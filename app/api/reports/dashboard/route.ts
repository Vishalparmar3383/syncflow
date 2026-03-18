import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const stats: any = { role: session.role }

        if (session.role === 'Admin') {
            const [studentCount, staffCount, groupCount, activeGroups] = await Promise.all([
                prisma.acd_student.count(),
                prisma.acd_staff.count(),
                prisma.acd_project_group.count(),
                prisma.acd_project_group.count({ where: { group_status: 'Active' } })
            ])
            stats.summary = { studentCount, staffCount, groupCount, activeGroups }
        }
        else if (session.role === 'Faculty') {
            const staff = await prisma.acd_staff.findUnique({ where: { user_id: Number(session.userId) } })
            if (staff) {
                const myGroups = await prisma.acd_project_group.count({ where: { guide_staff_id: staff.staff_id } })
                const pendingEvaluations = await prisma.acd_project_evaluation.count({
                    where: { evaluator_staff_id: staff.staff_id, evaluation_status: 'Pending' }
                })
                stats.summary = { myGroups, pendingEvaluations }

                // Upcoming meetings
                stats.upcomingMeetings = await prisma.acd_project_meeting.findMany({
                    where: { guide_staff_id: staff.staff_id, meeting_date_time: { gte: new Date() } },
                    take: 5,
                    orderBy: { meeting_date_time: 'asc' }
                })
            }
        }
        else if (session.role === 'Student') {
            const student = await prisma.acd_student.findUnique({ where: { user_id: Number(session.userId) } })
            if (student) {
                const myGroup = await prisma.acd_project_group_member.findFirst({
                    where: { student_id: student.student_id },
                    include: { acd_project_group: true }
                })
                stats.myGroup = myGroup?.acd_project_group

                if (myGroup) {
                    stats.upcomingMeetings = await prisma.acd_project_meeting.findMany({
                        where: { project_group_id: myGroup.project_group_id, meeting_date_time: { gte: new Date() } },
                        take: 3,
                        orderBy: { meeting_date_time: 'asc' }
                    })
                }
            }
        }

        return NextResponse.json(stats)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
