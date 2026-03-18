import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
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

        // Fetch all groups where this staff is the guide
        const proposals = await prisma.acd_project_group.findMany({
            where: {
                guide_staff_id: staff.staff_id,
            },
            include: {
                acd_project_type: true,
                acd_academic_year: true,
                acd_project_group_member: {
                    include: {
                        acd_student: true
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json(proposals)

    } catch (error) {
        console.error('Faculty Proposals GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
