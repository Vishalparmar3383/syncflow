import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const groups = await prisma.acd_project_group.findMany({
            include: {
                acd_project_type: true,
                acd_academic_year: true,
                acd_staff_acd_project_group_guide_staff_idToacd_staff: true,
                acd_staff_acd_project_group_convener_staff_idToacd_staff: true,
                acd_staff_acd_project_group_expert_staff_idToacd_staff: true,
                acd_project_group_member: {
                    include: { acd_student: true }
                }
            },
            orderBy: { updated_at: 'desc' }
        })
        return NextResponse.json(groups)
    } catch (error) {
        console.error('Admin Groups GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
