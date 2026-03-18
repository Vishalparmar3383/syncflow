import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, comparePassword, hashPassword } from '@/lib/auth-utils'
import { z } from 'zod'

const changePasswordSchema = z.object({
    email: z.email('Invalid email format').optional(),
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((value) => value.newPassword === value.confirmPassword, {
    message: 'New password and confirm password do not match',
    path: ['confirmPassword'],
}).refine((value) => value.oldPassword !== value.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const parsed = changePasswordSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({
                error: 'Invalid password change payload',
                details: parsed.error.flatten().fieldErrors,
            }, { status: 400 })
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

        let user

        // Try to get user from session first (if authenticated)
        const session = await getSession()
        if (session) {
            const userId = Number(session.userId)
            if (!isNaN(userId)) {
                user = await prisma.acd_user.findUnique({
                    where: { user_id: userId },
                })
            }
        }

        // If no user from session, require email
        if (!user) {
            if (!parsed.data.email) {
                return NextResponse.json({ 
                    error: 'Email is required when not authenticated' 
                }, { status: 400 })
            }

            user = await prisma.acd_user.findUnique({
                where: { email: parsed.data.email },
            })
        }

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user is active
        if (!user.is_active) {
            return NextResponse.json({ 
                error: 'Account is inactive. Please contact administrator.' 
            }, { status: 403 })
        }

        // Verify old password
        const isValid = await comparePassword(parsed.data.oldPassword, user.password_hash)
        if (!isValid) {
            return NextResponse.json({ 
                error: 'Old password is incorrect' 
            }, { status: 401 })
        }

        // Hash new password
        const hashedPassword = await hashPassword(parsed.data.newPassword)

        // Update password
        await prisma.acd_user.update({
            where: { user_id: user.user_id },
            data: { password_hash: hashedPassword }
        })

        return NextResponse.json({ 
            success: true, 
            message: 'Password changed successfully' 
        })
    } catch (error: unknown) {
        console.error('Change password error:', error)
        
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

