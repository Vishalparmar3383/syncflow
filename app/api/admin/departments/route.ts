import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const departmentSchema = z.object({
    department_name: z.string().trim().min(2).max(255),
    department_code: z.string().trim().min(1).max(10),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const departments = await prisma.acd_department.findMany({
            orderBy: { department_name: 'asc' }
        })
        return NextResponse.json(departments)
    } catch (error) {
        console.error('Admin Departments GET Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const parsed = departmentSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid department payload' }, { status: 400 })
        }

        const { department_name, department_code, description } = parsed.data

        const department = await prisma.acd_department.create({
            data: {
                department_name,
                department_code: department_code.toUpperCase(),
                description: description || `${department_name} department configuration record.`
            }
        })

        return NextResponse.json(department, { status: 201 })
    } catch (error) {
        console.error('Admin Departments POST Error:', error)
        return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }
}
