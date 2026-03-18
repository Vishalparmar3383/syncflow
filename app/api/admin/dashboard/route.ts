import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
        sixMonthsAgo.setDate(1)
        sixMonthsAgo.setHours(0, 0, 0, 0)

        const [
            totalStudents,
            totalFaculty,
            totalDepartments,
            totalGroups,
            activeAY,
            pendingProposals,
            approvedGroups,
            rejectedGroups,
            activeUsers,
            inactiveUsers,
            recentUsers,
            departmentBreakdown,
            recentUserEvents,
            recentGroupEvents
        ] = await Promise.all([
            prisma.acd_student.count(),
            prisma.acd_staff.count(),
            prisma.acd_department.count(),
            prisma.acd_project_group.count(),
            prisma.acd_academic_year.findFirst({ where: { is_active: true } }),
            prisma.acd_project_group.count({ where: { approval_status: 'Pending' } }),
            prisma.acd_project_group.count({ where: { approval_status: 'Approved' } }),
            prisma.acd_project_group.count({ where: { approval_status: 'Rejected' } }),
            prisma.acd_user.count({ where: { is_active: true } }),
            prisma.acd_user.count({ where: { is_active: false } }),
            prisma.acd_user.findMany({
                take: 5,
                orderBy: { created_at: 'desc' },
                include: {
                    acd_student: true,
                    acd_staff: true
                }
            }),
            prisma.acd_department.findMany({
                select: {
                    department_id: true,
                    department_name: true,
                    _count: {
                        select: {
                            acd_student: true,
                            acd_staff: true
                        }
                    }
                },
                orderBy: { department_name: 'asc' }
            }),
            prisma.acd_user.findMany({
                where: {
                    created_at: { gte: sixMonthsAgo }
                },
                select: {
                    created_at: true,
                    role: true
                },
                orderBy: { created_at: 'asc' }
            }),
            prisma.acd_project_group.findMany({
                where: {
                    created_at: { gte: sixMonthsAgo }
                },
                select: {
                    created_at: true,
                    approval_status: true
                },
                orderBy: { created_at: 'asc' }
            })
        ])

        const groupStats = await prisma.acd_project_group.groupBy({
            by: ['approval_status'],
            _count: true
        })

        const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
            const date = new Date(sixMonthsAgo)
            date.setMonth(sixMonthsAgo.getMonth() + index)
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            return {
                key,
                label: date.toLocaleString('en-US', { month: 'short' }),
                users: 0,
                groups: 0
            }
        })

        recentUserEvents.forEach((entry) => {
            if (!entry.created_at) return
            const key = `${entry.created_at.getFullYear()}-${String(entry.created_at.getMonth() + 1).padStart(2, '0')}`
            const bucket = monthlyTrend.find((item) => item.key === key)
            if (bucket) bucket.users += 1
        })

        recentGroupEvents.forEach((entry) => {
            if (!entry.created_at) return
            const key = `${entry.created_at.getFullYear()}-${String(entry.created_at.getMonth() + 1).padStart(2, '0')}`
            const bucket = monthlyTrend.find((item) => item.key === key)
            if (bucket) bucket.groups += 1
        })

        const roleDistribution = [
            { label: 'Students', value: totalStudents, color: 'emerald' },
            { label: 'Faculty', value: totalFaculty, color: 'sky' },
            { label: 'Admins', value: Math.max(activeUsers + inactiveUsers - totalStudents - totalFaculty, 0), color: 'amber' }
        ]

        const topDepartments = departmentBreakdown
            .map((department) => ({
                department_id: department.department_id,
                department_name: department.department_name,
                studentCount: department._count.acd_student,
                facultyCount: department._count.acd_staff,
                totalPeople: department._count.acd_student + department._count.acd_staff
            }))
            .sort((left, right) => right.totalPeople - left.totalPeople)
            .slice(0, 6)

        return NextResponse.json({
            stats: {
                totalStudents,
                totalFaculty,
                totalDepartments,
                totalGroups,
                pendingProposals,
                activeAY: activeAY?.academic_year_code || 'N/A',
                approvedGroups,
                rejectedGroups,
                activeUsers,
                inactiveUsers
            },
            groupStats,
            recentUsers,
            monthlyTrend,
            roleDistribution,
            topDepartments
        })

    } catch (error) {
        console.error('Admin Dashboard API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
