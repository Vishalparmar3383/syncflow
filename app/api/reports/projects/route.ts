import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.role === 'Student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const yearId = searchParams.get('year')
    const typeId = searchParams.get('type')
    const status = searchParams.get('status') // Active, etc.

    let where: any = {}
    if (yearId) where.academic_year_id = Number(yearId)
    if (typeId) where.project_type_id = Number(typeId)
    if (status) where.group_status = status

    try {
        const projects = await prisma.acd_project_group.findMany({
            where,
            include: {
                acd_project_group_member: {
                    include: { acd_student: true }
                },
                acd_staff_acd_project_group_guide_staff_idToacd_staff: {
                    select: { staff_name: true }
                },
                acd_project_type: true
            }
        })

        // Flatten for report friendly format if needed, or send as is
        const reportData = projects.map(p => ({
            id: p.project_group_id,
            title: p.project_title,
            type: p.acd_project_type.project_type_name,
            guide: p.acd_staff_acd_project_group_guide_staff_idToacd_staff.staff_name,
            members: p.acd_project_group_member.map(m => m.acd_student.student_name).join(', '),
            status: p.group_status
        }))

        return NextResponse.json(reportData)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch project report' }, { status: 500 })
    }
}
