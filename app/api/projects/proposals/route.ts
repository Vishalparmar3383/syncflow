import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const proposalSchema = z.object({
    project_group_id: z.coerce.number().int().positive(),
    project_title: z.string().trim().min(4).max(255),
    project_area: z.string().trim().min(2).max(255),
    project_description: z.string().trim().min(20).max(5000),
})

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Students submit, or Guide on behalf? Usually students.

    try {
        const body = await request.json()
        const parsed = proposalSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid proposal payload' }, { status: 400 })
        }
        // data: { project_group_id, project_title, project_area, project_description, document_id? }

        const groupId = parsed.data.project_group_id

        // Check ownership if student
        if (session.role === 'Student') {
            const student = await prisma.acd_student.findUnique({ where: { user_id: Number(session.userId) } })
            if (student) {
                const member = await prisma.acd_project_group_member.findFirst({
                    where: { project_group_id: groupId, student_id: student.student_id }
                })
                if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
        }

        // Update group details
        const group = await prisma.acd_project_group.update({
            where: { project_group_id: groupId },
            data: {
                project_title: parsed.data.project_title,
                project_area: parsed.data.project_area,
                project_description: parsed.data.project_description,
                approval_status: 'Pending',
                progress_percentage: 0,
                description: `Proposal resubmitted for ${parsed.data.project_title} on ${new Date().toISOString()}.`,
                approved_by: null,
                approved_at: null,
                updated_at: new Date(),
            }
        })

        // If document_id provided (uploaded previously via /api/projects/documents), verify it belongs to group
        // The documents API links to group, so it's already linked.
        // We might want to tag it as 'Proposal' type if not already.

        return NextResponse.json(group)
    } catch {
        return NextResponse.json({ error: 'Failed to submit proposal' }, { status: 500 })
    }
}
