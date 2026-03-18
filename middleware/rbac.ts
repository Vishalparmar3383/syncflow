import { NextRequest, NextResponse } from 'next/server'
import { JWTPayload } from 'jose'

const adminRoutes = ['/api/master', '/api/users', '/api/admin']
const studentRoutes = ['/api/student']
const facultyRoutes = ['/api/staff', '/api/faculty']

export function rbacMiddleware(request: NextRequest, payload: JWTPayload) {
    const { pathname } = request.nextUrl
    const role = payload.role as string

    // Dashboard Route Protection - Role-based access
    if (pathname.startsWith('/dashboard')) {
        // Check if user is trying to access their own dashboard
        if (pathname.startsWith('/dashboard/admin') && role !== 'Admin') {
            // Redirect to their own dashboard
            const redirectUrl = role === 'Student' ? '/dashboard/student' : '/dashboard/faculty'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        
        if (pathname.startsWith('/dashboard/faculty') && role !== 'Faculty') {
            // Redirect to their own dashboard
            const redirectUrl = role === 'Admin' ? '/dashboard/admin' : '/dashboard/student'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        
        if (pathname.startsWith('/dashboard/student') && role !== 'Student') {
            // Redirect to their own dashboard
            const redirectUrl = role === 'Admin' ? '/dashboard/admin' : '/dashboard/faculty'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }

        // If accessing /dashboard without specific role, redirect to role-specific dashboard
        if (pathname === '/dashboard' || pathname === '/dashboard/') {
            const roleDashboard: Record<string, string> = {
                'Admin': '/dashboard/admin',
                'Faculty': '/dashboard/faculty',
                'Student': '/dashboard/student'
            }
            const redirectUrl = roleDashboard[role] || '/login'
            return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
    }

    // API Route Protection
    // Admin Route Protection
    if (adminRoutes.some(r => pathname.startsWith(r)) && role !== 'Admin') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Student Route Protection
    if (studentRoutes.some(r => pathname.startsWith(r)) && role !== 'Student') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Faculty Route Protection
    if (facultyRoutes.some(r => pathname.startsWith(r)) && role !== 'Faculty') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return null
}
