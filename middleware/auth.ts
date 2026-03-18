import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-utils'

const protectedRoutes = ['/dashboard', '/admin', '/faculty', '/student', '/api/admin', '/api/student', '/api/staff', '/api/groups', '/api/projects', '/api/meetings']

export async function authMiddleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if this is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    
    if (!isProtectedRoute) {
        return null
    }

    // For protected routes, require authentication
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
        // No token found - redirect to login for pages, return 401 for API
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // Redirect to login with return URL
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Verify token
    const payload = await verifyToken(token)
    
    if (!payload) {
        // Invalid token - redirect to login
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return payload
}
