import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const departmentSchema = z.object({
    department_name: z.string().trim().min(2).max(255),
    department_code: z.string().trim().min(1).max(10),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function GET() {
    try {
        const depts = await prisma.acd_department.findMany({
            orderBy: { department_name: 'asc' }
        })
        return NextResponse.json(depts)
    } catch (error) {
        console.error('Master Departments GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const parsed = departmentSchema.safeParse(data)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid department payload' }, { status: 400 })
        }

        const dept = await prisma.acd_department.create({
            data: {
                department_name: parsed.data.department_name,
                department_code: parsed.data.department_code.toUpperCase(),
                description: parsed.data.description || `${parsed.data.department_name} department configuration record.`
            }
        })
        return NextResponse.json(dept)
    } catch (error) {
        console.error('Master Departments POST Error:', error)
        return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
    }
}
