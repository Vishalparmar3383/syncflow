import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const meetingsQuerySchema = z.object({
    group_id: z.coerce.number().int().positive().optional(),
    status: z.enum(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled']).optional(),
})

const meetingsCreateSchema = z.object({
    project_group_id: z.coerce.number().int().positive(),
    meeting_date_time: z.string().min(1),
    meeting_purpose: z.string().trim().min(2).max(255),
    meeting_location: z.string().trim().min(2).max(255),
    guide_staff_id: z.coerce.number().int().positive().optional(),
})

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const parsed = meetingsQuerySchema.safeParse({
        group_id: searchParams.get('group_id') ?? undefined,
        status: searchParams.get('status') ?? undefined,
    })
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid meeting filters' }, { status: 400 })
    }

    const where: {
        project_group_id?: number
        meeting_status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled'
        acd_project_group?: { acd_project_group_member: { some: { student_id: number } } }
        guide_staff_id?: number
    } = {}
    if (parsed.data.group_id) where.project_group_id = parsed.data.group_id
    if (parsed.data.status) where.meeting_status = parsed.data.status

    // RBAC: Students see their group meetings. Staff see their meetings.
    if (session.role === 'Student') {
        const student = await prisma.acd_student.findUnique({ where: { user_id: Number(session.userId) } })
        if (!parsed.data.group_id && student) {
            // Find groups where student is member
            where.acd_project_group = {
                acd_project_group_member: {
                    some: { student_id: student.student_id }
                }
            }
        }
    } else if (session.role === 'Faculty') {
        const staff = await prisma.acd_staff.findUnique({ where: { user_id: Number(session.userId) } })
        if (staff) {
            where.guide_staff_id = staff.staff_id
        }
    }

    try {
        const meetings = await prisma.acd_project_meeting.findMany({
            where,
            include: {
                acd_project_group: { select: { project_group_name: true } },
                acd_staff: { select: { staff_name: true } }
            },
            orderBy: { meeting_date_time: 'desc' }
        })
        return NextResponse.json(meetings)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.role === 'Student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const parsed = meetingsCreateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid meeting payload' }, { status: 400 })
        }
        // data: { project_group_id, meeting_date_time, meeting_purpose, meeting_location, guide_staff_id }

        // Default guide to current user if Faculty??
        let guideId = parsed.data.guide_staff_id
        if (!guideId && session.role === 'Faculty') {
            const staff = await prisma.acd_staff.findUnique({ where: { user_id: Number(session.userId) } })
            if (staff) guideId = staff.staff_id
        }

        const targetGroup = await prisma.acd_project_group.findUnique({
            where: { project_group_id: parsed.data.project_group_id },
            select: { project_group_name: true },
        })

        if (!targetGroup || !guideId) {
            return NextResponse.json({ error: 'Invalid group or guide' }, { status: 400 })
        }

        const meeting = await prisma.acd_project_meeting.create({
            data: {
                project_group_id: parsed.data.project_group_id,
                guide_staff_id: Number(guideId),
                meeting_date_time: new Date(parsed.data.meeting_date_time),
                meeting_purpose: parsed.data.meeting_purpose,
                meeting_location: parsed.data.meeting_location,
                meeting_status: 'Scheduled',
                meeting_status_date_time: new Date(),
                meeting_status_description: `Scheduled for ${targetGroup.project_group_name}.`,
                description: `${parsed.data.meeting_purpose} at ${parsed.data.meeting_location}.`,
            }
        })
        return NextResponse.json(meeting)
    } catch {
        return NextResponse.json({ error: 'Failed to schedule meeting' }, { status: 500 })
    }
}
