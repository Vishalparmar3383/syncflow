import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authMiddleware } from './middleware/auth'
import { rbacMiddleware } from './middleware/rbac'
import { JWTPayload } from 'jose'

export async function proxy(request: NextRequest) {
    // 1. Auth Check
    const authResult = await authMiddleware(request)

    // If authMiddleware returns a Response, it's a redirect or error
    if (authResult instanceof NextResponse) {
        return authResult
    }

    // If authResult is null, it meant it wasn't a protected route
    if (!authResult) {
        return NextResponse.next()
    }

    // If we have a payload, it was a protected route and user is authenticated.
    const payload = authResult as JWTPayload

    // 2. RBAC Check
    const rbacResult = rbacMiddleware(request, payload)
    if (rbacResult) {
        return rbacResult
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/:path*',
        '/api/:path*',
    ],
}

