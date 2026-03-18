import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const meetingSchema = z.object({
    project_group_id: z.coerce.number().int().positive(),
    meeting_date_time: z.string().min(1),
    meeting_purpose: z.string().trim().min(2).max(255),
    meeting_location: z.string().trim().min(2).max(255)
})

const attendanceSchema = z.object({
    meeting_id: z.coerce.number().int().positive(),
    meeting_notes: z.string().trim().max(5000).optional().or(z.literal("")),
    attendance: z.array(z.object({
        student_id: z.coerce.number().int().positive(),
        is_present: z.boolean(),
        attendance_remark: z.enum(["Present", "Absent", "Late", "On_Leave", "Excused"]),
    })).min(1),
})

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Faculty') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const staff = await prisma.acd_staff.findUnique({
            where: { user_id: Number(session.userId) }
        })

        const meetings = await prisma.acd_project_meeting.findMany({
            where: { guide_staff_id: staff!.staff_id },
            include: {
                acd_project_group: true,
                acd_project_meeting_attendance: {
                    include: { acd_student: true }
                }
            },
            orderBy: { meeting_date_time: 'desc' }
        })

        return NextResponse.json(meetings)
    } catch (error) {
        console.error('Faculty Meetings GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.role !== 'Faculty') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const staff = await prisma.acd_staff.findUnique({
            where: { user_id: Number(session.userId) }
        })

        if (!staff) {
            return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const parsed = meetingSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid meeting payload' }, { status: 400 })
        }

        const group = await prisma.acd_project_group.findFirst({
            where: {
                project_group_id: parsed.data.project_group_id,
                guide_staff_id: staff.staff_id,
            },
            select: { project_group_id: true, project_group_name: true },
        })

        if (!group) {
            return NextResponse.json({ error: 'Selected group is not assigned to you' }, { status: 403 })
        }

        const meeting = await prisma.acd_project_meeting.create({
            data: {
                project_group_id: parsed.data.project_group_id,
                guide_staff_id: staff.staff_id,
                meeting_date_time: new Date(parsed.data.meeting_date_time),
                meeting_purpose: parsed.data.meeting_purpose,
                meeting_location: parsed.data.meeting_location,
                meeting_status: 'Scheduled',
                meeting_status_date_time: new Date(),
                meeting_status_description: `Scheduled by ${staff.staff_name} for ${group.project_group_name}.`,
                description: `${parsed.data.meeting_purpose} at ${parsed.data.meeting_location}.`,
            }
        })

        // Auto-create attendance records for all group members
        const members = await prisma.acd_project_group_member.findMany({
            where: { project_group_id: parsed.data.project_group_id }
        })

        await prisma.acd_project_meeting_attendance.createMany({
            data: members.map(m => ({
                project_meeting_id: meeting.project_meeting_id,
                student_id: m.student_id,
                is_present: false,
                attendance_remark: 'Absent',
                description: `Auto-created attendance record for meeting ${meeting.project_meeting_id}.`,
            }))
        })

        return NextResponse.json(meeting)
    } catch (error) {
        console.error('Faculty Meeting POST Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    const session = await getSession()
    if (!session || session.role !== 'Faculty') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const staff = await prisma.acd_staff.findUnique({
            where: { user_id: Number(session.userId) }
        })

        if (!staff) {
            return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const parsed = attendanceSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid attendance payload' }, { status: 400 })
        }

        const meeting = await prisma.acd_project_meeting.findFirst({
            where: {
                project_meeting_id: parsed.data.meeting_id,
                guide_staff_id: staff.staff_id,
            },
            include: {
                acd_project_group: {
                    select: { project_group_name: true },
                },
                acd_project_meeting_attendance: {
                    select: {
                        project_meeting_attendance_id: true,
                        student_id: true,
                    },
                },
            },
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found or not assigned to you' }, { status: 404 })
        }

        const validStudentIds = new Set(
            meeting.acd_project_meeting_attendance.map((attendance) => attendance.student_id)
        )

        const hasInvalidStudent = parsed.data.attendance.some(
            (attendance) => !validStudentIds.has(attendance.student_id)
        )

        if (hasInvalidStudent) {
            return NextResponse.json({ error: 'Attendance contains a student outside this meeting' }, { status: 400 })
        }

        await prisma.$transaction(async (tx) => {
            for (const entry of parsed.data.attendance) {
                await tx.acd_project_meeting_attendance.updateMany({
                    where: {
                        project_meeting_id: parsed.data.meeting_id,
                        student_id: entry.student_id,
                    },
                    data: {
                        is_present: entry.is_present,
                        attendance_remark: entry.attendance_remark,
                        description: `Marked ${entry.attendance_remark.toLowerCase()} by ${staff.staff_name}.`,
                        updated_at: new Date(),
                    },
                })
            }

            await tx.acd_project_meeting.update({
                where: { project_meeting_id: parsed.data.meeting_id },
                data: {
                    meeting_notes: parsed.data.meeting_notes || null,
                    meeting_status: 'Completed',
                    meeting_status_date_time: new Date(),
                    meeting_status_description: `Attendance completed by ${staff.staff_name} for ${meeting.acd_project_group.project_group_name}.`,
                    updated_at: new Date(),
                },
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Faculty Meeting PATCH Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
