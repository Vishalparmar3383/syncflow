import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const meetingId = Number(id)

    const attendance = await prisma.acd_project_meeting_attendance.findMany({
        where: { project_meeting_id: meetingId },
        include: { acd_student: true }
    })
    return NextResponse.json(attendance)
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.role === 'Student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await context.params
    const meetingId = Number(id)

    try {
        const { attendance } = await request.json()
        // attendance: [{ student_id, is_present, remark }]

        // Transaction to upsert
        await prisma.$transaction(
            attendance.map((record: any) =>
                prisma.acd_project_meeting_attendance.upsert({
                    where: {
                        project_meeting_id_student_id: {
                            project_meeting_id: meetingId,
                            student_id: Number(record.student_id)
                        }
                    },
                    update: {
                        is_present: record.is_present,
                        attendance_remark: record.remark
                    },
                    create: {
                        project_meeting_id: meetingId,
                        student_id: Number(record.student_id),
                        is_present: record.is_present,
                        attendance_remark: record.remark
                    }
                })
            )
        )

        // Also update meeting status to Completed?
        // Let's leave that to a separate update or implicit.

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 })
    }
}
