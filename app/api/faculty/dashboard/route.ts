import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Faculty') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const staff = await prisma.acd_staff.findUnique({
            where: { user_id: Number(session.userId) },
            include: {
                acd_department: true
            }
        })

        if (!staff) {
            return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
        }

        // Dashboard Stats
        const [groupsCount, pendingProposals, upcomingMeetings] = await Promise.all([
            prisma.acd_project_group.count({
                where: {
                    OR: [
                        { guide_staff_id: staff.staff_id },
                        { convener_staff_id: staff.staff_id },
                        { expert_staff_id: staff.staff_id }
                    ]
                }
            }),
            prisma.acd_project_group.count({
                where: {
                    guide_staff_id: staff.staff_id,
                    approval_status: 'Pending'
                }
            }),
            prisma.acd_project_meeting.count({
                where: {
                    guide_staff_id: staff.staff_id,
                    meeting_date_time: { gte: new Date() },
                    meeting_status: 'Scheduled'
                }
            })
        ])

        // Recent Activity / Groups
        const recentGroups = await prisma.acd_project_group.findMany({
            where: {
                OR: [
                    { guide_staff_id: staff.staff_id },
                    { convener_staff_id: staff.staff_id },
                    { expert_staff_id: staff.staff_id }
                ]
            },
            take: 5,
            orderBy: { updated_at: 'desc' },
            include: {
                acd_project_type: true,
                acd_project_group_member: {
                    include: {
                        acd_student: true
                    }
                }
            }
        })

        // Upcoming meetings list
        const meetings = await prisma.acd_project_meeting.findMany({
            where: {
                guide_staff_id: staff.staff_id,
                meeting_date_time: { gte: new Date() },
                meeting_status: 'Scheduled'
            },
            take: 5,
            orderBy: { meeting_date_time: 'asc' },
            include: {
                acd_project_group: true
            }
        })

        return NextResponse.json({
            staff,
            stats: {
                totalGroups: groupsCount,
                pendingProposals,
                upcomingMeetings
            },
            recentGroups,
            upcomingMeetingsList: meetings
        })

    } catch (error) {
        console.error('Faculty Dashboard API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
