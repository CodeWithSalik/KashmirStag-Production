import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// We must duplicate the secret check for Edge runtime compatibility
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const secretKey = new TextEncoder().encode(JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as { sub: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const token = request.cookies.get('auth-token')?.value;
  let payload = null;
  if (token) {
    payload = await verifyToken(token);
  }

  // Admin routes logic
  if (path.startsWith('/admin')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Account routes logic
  if (path.startsWith('/account')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Pass user info via headers if authenticated
  const requestHeaders = new Headers(request.headers);
  if (payload) {
    requestHeaders.set('x-user-id', payload.sub);
    requestHeaders.set('x-user-role', payload.role);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
