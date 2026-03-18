import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth-utils'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = loginSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid login payload', details: parsed.error.flatten().fieldErrors }, { status: 400 })
        }

        // Check database connection
        try {
            await prisma.$connect()
        } catch (dbError: unknown) {
            console.error('Database connection error:', dbError)
            return NextResponse.json({ 
                error: 'Database connection failed', 
                details: process.env.NODE_ENV === 'development' && dbError instanceof Error ? dbError.message : undefined 
            }, { status: 500 })
        }

        const user = await prisma.acd_user.findUnique({
            where: { email: parsed.data.email },
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json({ error: 'Account is inactive. Please contact administrator.' }, { status: 403 })
        }

        // Compare password
        const isValid = await comparePassword(parsed.data.password, user.password_hash)

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Generate token
        const token = await signToken({ userId: user.user_id, email: user.email, role: user.role })

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400 // 1 day
        })

        // Update last login
        await prisma.acd_user.update({
            where: { user_id: user.user_id },
            data: { last_login_at: new Date() }
        }).catch(err => {
            // Non-critical error, log but don't fail
            console.warn('Failed to update last_login_at:', err)
        })

        return NextResponse.json({ 
            success: true, 
            user: { 
                email: user.email, 
                role: user.role, 
                userId: user.user_id 
            } 
        })
    } catch (error: unknown) {
        console.error('Login error:', error)
        
        // Handle JSON parsing errors
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid request body. Expected JSON.' }, { status: 400 })
        }

        // Handle Prisma errors
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P1001') {
            return NextResponse.json({ 
                error: 'Database connection failed. Please check your database configuration.',
                details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
            }, { status: 500 })
        }

        return NextResponse.json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
        }, { status: 500 })
    }
}
