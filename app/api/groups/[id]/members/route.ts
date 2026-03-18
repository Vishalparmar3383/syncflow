import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const memberSchema = z.object({
    student_id: z.coerce.number().int().positive(),
    is_group_leader: z.boolean().optional(),
})

async function syncGroupAverageCpi(projectGroupId: number) {
    const members = await prisma.acd_project_group_member.findMany({
        where: { project_group_id: projectGroupId },
        select: { student_cgpa: true },
    })

    const cgpas = members
        .map((member) => Number(member.student_cgpa ?? 0))
        .filter((value) => !Number.isNaN(value))

    const average = cgpas.length ? Number((cgpas.reduce((sum, value) => sum + value, 0) / cgpas.length).toFixed(2)) : null

    await prisma.acd_project_group.update({
        where: { project_group_id: projectGroupId },
        data: { average_cpi: average, updated_at: new Date() },
    })
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const groupId = Number(id)

    try {
        const body = await request.json()
        const parsed = memberSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid member payload' }, { status: 400 })
        }

        const [group, student, existingMembership] = await Promise.all([
            prisma.acd_project_group.findUnique({
                where: { project_group_id: groupId },
                select: { project_group_id: true, project_group_name: true },
            }),
            prisma.acd_student.findUnique({
                where: { student_id: parsed.data.student_id },
                select: { student_id: true, student_name: true, cgpa: true },
            }),
            prisma.acd_project_group_member.findFirst({
                where: { student_id: parsed.data.student_id },
                select: { project_group_id: true },
            }),
        ])

        if (!group || !student) {
            return NextResponse.json({ error: 'Group or student not found' }, { status: 404 })
        }

        if (existingMembership) {
            return NextResponse.json({ error: 'Student is already assigned to a project group' }, { status: 409 })
        }

        if (parsed.data.is_group_leader) {
            await prisma.acd_project_group_member.updateMany({
                where: { project_group_id: groupId },
                data: { is_group_leader: false },
            })
        }

        const member = await prisma.acd_project_group_member.create({
            data: {
                project_group_id: groupId,
                student_id: parsed.data.student_id,
                is_group_leader: parsed.data.is_group_leader || false,
                student_cgpa: student.cgpa ?? 0,
                description: `${student.student_name} added to ${group.project_group_name}.`,
            }
        })

        await syncGroupAverageCpi(groupId)

        return NextResponse.json(member)
    } catch {
        return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await context.params
    const groupId = Number(id)
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

    try {
        // Only Leader or Admin/Staff can remove?
        // For now allow simple removal
        await prisma.acd_project_group_member.deleteMany({
            where: {
                project_group_id: groupId,
                student_id: Number(studentId)
            }
        })
        await syncGroupAverageCpi(groupId)
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }
}
