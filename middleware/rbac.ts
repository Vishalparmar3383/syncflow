import { NextRequest, NextResponse } from 'next/server'
import { JWTPayload } from 'jose'

const adminRoutes = ['/admin', '/api/master', '/api/users', '/api/admin']
const studentRoutes = ['/student', '/api/student']
const facultyRoutes = ['/faculty', '/api/staff', '/api/faculty']

export function rbacMiddleware(request: NextRequest, payload: JWTPayload) {
    const { pathname } = request.nextUrl
    const role = payload.role as string

    // Dashboard Hub Redirection (Base /dashboard route)
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        const roleDashboard: Record<string, string> = {
            'Admin': '/admin',
            'Faculty': '/faculty',
            'Student': '/student'
        }
        const redirectUrl = roleDashboard[role] || '/login'
        return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Role-based Route Protection
    
    // Admin Route Protection
    if (adminRoutes.some(r => pathname.startsWith(r)) && role !== 'Admin') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Student Route Protection
    if (studentRoutes.some(r => pathname.startsWith(r)) && role !== 'Student') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Faculty Route Protection
    if (facultyRoutes.some(r => pathname.startsWith(r)) && role !== 'Faculty') {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return null
}
