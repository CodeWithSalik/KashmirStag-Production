import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextResponse, NextRequest } from 'next/server';
import { JWT_EXPIRY, BCRYPT_ROUNDS } from '@/config/constants';
import { UnauthorizedError, ForbiddenError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface JwtPayload {
  sub: string;
  id: string;
  email: string;
  role: string;
}

export function signJwt(payload: { sub: string; id?: string; email: string; role: string }): string {
  const tokenPayload = {
    ...payload,
    id: payload.id || payload.sub,
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.sub) return null;
    return {
      sub: decoded.sub,
      id: decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function getTokenFromRequest(request: NextRequest | Request): string | null {
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const token = (request as any).cookies.get('auth-token')?.value;
    if (token) return token;
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]*)/);
    if (match) return decodeURIComponent(match[1]);
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export function getAuthUser(request: Request | NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyJwt(token);
}

export function requireAuth(request: Request | NextRequest): JwtPayload {
  const user = getAuthUser(request);
  if (!user) {
    throw new UnauthorizedError('Unauthorized');
  }
  return user;
}

export function requireAdmin(request: Request | NextRequest): JwtPayload {
  const user = requireAuth(request);
  if (user.role !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }
  return user;
}
