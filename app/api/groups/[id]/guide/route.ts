import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const allocationSchema = z.object({
    guide_staff_id: z.coerce.number().int().positive().optional(),
    convener_staff_id: z.coerce.number().int().positive().nullable().optional(),
    expert_staff_id: z.coerce.number().int().positive().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one allocation field is required',
})

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only Admin or Faculty?
    if (session.role === 'Student') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = Number(id)

    try {
        const body = await request.json()
        const parsed = allocationSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid guide allocation payload' }, { status: 400 })
        }

        // Build update data
        const data: {
            guide_staff_id?: number
            convener_staff_id?: number | null
            expert_staff_id?: number | null
            updated_at: Date
        } = { updated_at: new Date() }
        if (parsed.data.guide_staff_id) data.guide_staff_id = parsed.data.guide_staff_id
        if (Object.prototype.hasOwnProperty.call(parsed.data, 'convener_staff_id')) data.convener_staff_id = parsed.data.convener_staff_id ?? null
        if (Object.prototype.hasOwnProperty.call(parsed.data, 'expert_staff_id')) data.expert_staff_id = parsed.data.expert_staff_id ?? null

        const group = await prisma.acd_project_group.update({
            where: { project_group_id: groupId },
            data
        })

        return NextResponse.json(group)
    } catch {
        return NextResponse.json({ error: 'Failed to update guide allocation' }, { status: 500 })
    }
}
