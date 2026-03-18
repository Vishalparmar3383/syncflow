import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const groupUpdateSchema = z.object({
    approval_status: z.enum(['Pending', 'Approved', 'Rejected']).optional(),
    group_status: z.enum(['Active', 'Completed', 'Suspended']).optional(),
    guide_staff_id: z.number().int().positive().optional(),
    convener_staff_id: z.number().int().positive().nullable().optional(),
    expert_staff_id: z.number().int().positive().nullable().optional(),
    approved_by: z.number().int().positive().nullable().optional(),
    approved_at: z.string().datetime().nullable().optional(),
    description: z.string().trim().max(1000).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be updated'
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectGroupId = Number(id)

    if (!Number.isInteger(projectGroupId) || projectGroupId <= 0) {
        return NextResponse.json({ error: 'Invalid group id' }, { status: 400 })
    }

    try {
        const body = await request.json()
        const parsed = groupUpdateSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid group update payload' }, { status: 400 })
        }

        const updated = await prisma.acd_project_group.update({
            where: { project_group_id: projectGroupId },
            data: {
                ...parsed.data,
                approved_at: parsed.data.approved_at ? new Date(parsed.data.approved_at) : parsed.data.approved_at
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Admin Groups PATCH Error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}
