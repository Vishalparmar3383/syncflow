import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    // Await params as per Next.js 15+ changes? Actually 13+ params are object, but lately they are becoming promises in some versions/contexts. 
    // Next 15: params is async.
    // The user package.json says "next": "16.1.1". So YES, params is a Promise.
    const { id } = await context.params

    const groupId = Number(id)
    if (isNaN(groupId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    try {
        const group = await prisma.acd_project_group.findUnique({
            where: { project_group_id: groupId },
            include: {
                acd_project_group_member: {
                    include: { acd_student: true }
                },
                acd_project_type: true,
                acd_academic_year: true,
                acd_staff_acd_project_group_guide_staff_idToacd_staff: true,
                acd_project_document: true,
                acd_project_meeting: true
            }
        })

        if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
        return NextResponse.json(group)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
    }
}
