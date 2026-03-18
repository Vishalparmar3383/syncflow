import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Get Student ID
        const student = await prisma.acd_student.findUnique({
            where: { user_id: Number(session.userId) },
            select: { student_id: true }
        })

        if (!student) {
            return NextResponse.json({ error: 'Student record not found' }, { status: 404 })
        }

        // 2. Get Student's Group ID
        const groupMember = await prisma.acd_project_group_member.findFirst({
            where: { student_id: student.student_id },
            select: { project_group_id: true }
        })

        if (!groupMember) {
            return NextResponse.json([]) // No group, no meetings
        }

        // 3. Get All Meetings for the Group
        const meetings = await prisma.acd_project_meeting.findMany({
            where: {
                project_group_id: groupMember.project_group_id
            },
            include: {
                acd_staff: true,
                acd_project_meeting_attendance: {
                    where: {
                        student_id: student.student_id
                    }
                }
            },
            orderBy: {
                meeting_date_time: 'desc'
            }
        })

        return NextResponse.json(meetings)
    } catch (error) {
        console.error('Student Meetings API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
