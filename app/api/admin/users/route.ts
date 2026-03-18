import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const roleSchema = z.enum(['Student', 'Faculty'])

export async function GET(request: Request) {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleResult = roleSchema.safeParse(searchParams.get('role'))

    if (!roleResult.success) {
        return NextResponse.json({ error: 'Valid role parameter required' }, { status: 400 })
    }

    const role = roleResult.data

    try {
        if (role === 'Student') {
            const students = await prisma.acd_student.findMany({
                include: {
                    acd_department: true,
                    acd_academic_year: true,
                    acd_user: true
                },
                orderBy: { student_name: 'asc' }
            })
            return NextResponse.json(students)
        } 
        
        if (role === 'Faculty') {
            const faculty = await prisma.acd_staff.findMany({
                include: {
                    acd_department: true,
                    acd_user: true
                },
                orderBy: { staff_name: 'asc' }
            })
            return NextResponse.json(faculty)
        }

    } catch (error) {
        console.error('Admin Users API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
