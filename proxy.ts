import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth/', '/api/sync']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths, static assets, and Next.js internals
  if (
    isPublic(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check JWT session cookie
  const token = request.cookies.get('zwaluw-session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    await jwtVerify(token, new TextEncoder().encode(secret))
    return NextResponse.next()
  } catch {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('zwaluw-session')
    return response
  }
}
