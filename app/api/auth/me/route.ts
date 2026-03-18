import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = Number(session.userId)
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        // Check database connection
        try {
            await prisma.$connect()
        } catch (dbError: any) {
            console.error('Database connection error:', dbError)
            return NextResponse.json({ 
                error: 'Database connection failed', 
                details: process.env.NODE_ENV === 'development' ? dbError.message : undefined 
            }, { status: 500 })
        }

        const user = await prisma.acd_user.findUnique({
            where: { user_id: userId },
            include: {
                acd_admin: true,
                acd_student: {
                    include: {
                        acd_department: true,
                        acd_academic_year: true
                    }
                },
                acd_staff: {
                    include: {
                        acd_department: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Sanitize
        const { password_hash, ...safeUser } = user
        return NextResponse.json({ user: safeUser })
    } catch (error: any) {
        console.error('Get user error:', error)
        
        // Handle Prisma errors
        if (error.code === 'P1001') {
            return NextResponse.json({ 
                error: 'Database connection failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }, { status: 500 })
        }

        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 })
    }
}
