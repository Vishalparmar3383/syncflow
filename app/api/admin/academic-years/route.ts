import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const academicYearSchema = z.object({
    academic_year_code: z.string().trim().min(4).max(10),
    start_date: z.string().min(1),
    end_date: z.string().min(1),
    is_active: z.boolean().optional(),
    description: z.string().trim().max(1000).optional().or(z.literal(''))
}).refine((value) => new Date(value.start_date) <= new Date(value.end_date), {
    message: 'Start date must be before end date',
    path: ['end_date']
})

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'Admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const years = await prisma.acd_academic_year.findMany({
            orderBy: { start_date: 'desc' }
        })
        return NextResponse.json(years)
    } catch (error) {
        console.error('Admin Academic Years GET Error:', error)
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
        const parsed = academicYearSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid academic year payload' }, { status: 400 })
        }

        const { academic_year_code, start_date, end_date, is_active, description } = parsed.data

        // If making this one active, deactivate others
        if (is_active) {
            await prisma.acd_academic_year.updateMany({
                where: { is_active: true },
                data: { is_active: false }
            })
        }

        const ay = await prisma.acd_academic_year.create({
            data: {
                academic_year_code,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                is_active: !!is_active,
                description: description || `Academic year ${academic_year_code} from ${start_date} to ${end_date}.`
            }
        })

        return NextResponse.json(ay, { status: 201 })
    } catch (error) {
        console.error('Admin Academic Years POST Error:', error)
        return NextResponse.json({ error: 'Failed to create academic year' }, { status: 500 })
    }
}
