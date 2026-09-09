import { UserRole } from '@/config/constants';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface SessionUser extends AuthUser {
  isAdmin: boolean;
}
