import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const approvalSchema = z.object({
    status: z.enum(['Approved', 'Rejected']),
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only Admin or potentially Coordinator Staff can approve
    if (session.role === 'Student') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const groupId = Number(id)

    try {
        const body = await request.json()
        const parsed = approvalSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid approval payload' }, { status: 400 })
        }

        // Need admin_id if approved_by is Admin. acd_admin has user_id.
        let approvedBy = null
        if (session.role === 'Admin') {
            const admin = await prisma.acd_admin.findUnique({ where: { user_id: Number(session.userId) } })
            if (admin) approvedBy = admin.admin_id
        }

        const group = await prisma.acd_project_group.update({
            where: { project_group_id: groupId },
            data: {
                approval_status: parsed.data.status,
                progress_percentage: parsed.data.status === 'Approved' ? 0 : undefined,
                approved_by: approvedBy,
                approved_at: new Date(),
                updated_at: new Date(),
                description: `Proposal ${parsed.data.status.toLowerCase()} on ${new Date().toISOString()}.`,
            }
        })

        return NextResponse.json(group)
    } catch {
        return NextResponse.json({ error: 'Failed to update approval status' }, { status: 500 })
    }
}
