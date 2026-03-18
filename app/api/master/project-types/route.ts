import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const projectTypeSchema = z.object({
    project_type_name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
})

export async function GET() {
    try {
        const types = await prisma.acd_project_type.findMany({
            orderBy: { project_type_name: 'asc' }
        })
        return NextResponse.json(types)
    } catch (error) {
        console.error('Master Project Types GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch project types' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const parsed = projectTypeSchema.safeParse(data)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid project type payload' }, { status: 400 })
        }

        const type = await prisma.acd_project_type.create({
            data: {
                project_type_name: parsed.data.project_type_name,
                description: parsed.data.description || `${parsed.data.project_type_name} project type.`
            }
        })
        return NextResponse.json(type)
    } catch (error) {
        console.error('Master Project Types POST Error:', error)
        return NextResponse.json({ error: 'Failed to create project type' }, { status: 500 })
    }
}
