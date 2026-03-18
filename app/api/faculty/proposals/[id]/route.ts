import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const proposalDecisionSchema = z.object({
    status: z.enum(['Approved', 'Rejected']),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getSession()
    const { id } = await params
    
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
        const parsed = proposalDecisionSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid proposal decision payload' }, { status: 400 })
        }

        // Verify faculty is the guide for this group
        const group = await prisma.acd_project_group.findUnique({
            where: { project_group_id: Number(id) }
        })

        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        }

        if (group.guide_staff_id !== staff.staff_id) {
            return NextResponse.json({ error: 'Forbidden: You are not the guide for this project' }, { status: 403 })
        }

        const updatedGroup = await prisma.acd_project_group.update({
            where: { project_group_id: Number(id) },
            data: {
                approval_status: parsed.data.status,
                progress_percentage: parsed.data.status === "Approved" ? 0 : undefined,
                description: parsed.data.description || `Faculty ${parsed.data.status.toLowerCase()} proposal on ${new Date().toISOString()}.`,
                approved_at: parsed.data.status === 'Approved' ? new Date() : null,
                updated_at: new Date()
            }
        })

        return NextResponse.json(updatedGroup)

    } catch (error) {
        console.error('Faculty Proposal PATCH Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
