import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    try {
        const years = await prisma.acd_academic_year.findMany({
            orderBy: { start_date: 'desc' }
        })
        return NextResponse.json(years)
    } catch (error) {
        console.error('Master Academic Years GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const parsed = academicYearSchema.safeParse(data)

        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid academic year payload' }, { status: 400 })
        }

        const year = await prisma.acd_academic_year.create({
            data: {
                academic_year_code: parsed.data.academic_year_code,
                start_date: new Date(parsed.data.start_date),
                end_date: new Date(parsed.data.end_date),
                is_active: parsed.data.is_active || false,
                description: parsed.data.description || `Academic year ${parsed.data.academic_year_code} from ${parsed.data.start_date} to ${parsed.data.end_date}.`
            }
        })
        return NextResponse.json(year)
    } catch (error) {
        console.error('Master Academic Years POST Error:', error)
        return NextResponse.json({ error: 'Failed to create academic year' }, { status: 500 })
    }
}
