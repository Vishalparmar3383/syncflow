import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const projectTypeSchema = z.object({
    project_type_name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const types = await prisma.acd_project_type.findMany({
            orderBy: { project_type_name: 'asc' }
        })
        return NextResponse.json(types)
    } catch (error) {
        console.error('Admin Project Types GET Error:', error)
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
        const parsed = projectTypeSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid project type payload' }, { status: 400 })
        }

        const { project_type_name, description } = parsed.data

        const type = await prisma.acd_project_type.create({
            data: {
                project_type_name,
                description: description || `${project_type_name} project type.`
            }
        })

        return NextResponse.json(type, { status: 201 })
    } catch (error) {
        console.error('Admin Project Types POST Error:', error)
        return NextResponse.json({ error: 'Failed to create project type' }, { status: 500 })
    }
}
