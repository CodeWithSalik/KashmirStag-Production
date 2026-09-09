import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { successResponse } from '@/lib/api-helpers';
import { getAuthUser, clearAuthCookie } from '@/lib/auth';
import { getProfile, updateProfile, checkAndPromoteAdmin } from '@/services/auth.service';

export async function GET(request: Request) {
  try {
    await connectDB();
    const authUser = getAuthUser(request);
    if (!authUser) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await getProfile(authUser.sub);
    
    // Auto-promote admin if matching env emails (and not already admin)
    if (user.role !== 'admin') {
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
      if (adminEmails.includes(user.email)) {
        user.role = 'admin';
        await user.save();
      }
    }

    return successResponse({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    const response = handleApiError(error);
    clearAuthCookie(response);
    return response;
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const authUser = getAuthUser(request);
    if (!authUser) {
      throw new UnauthorizedError('Not authenticated');
    }

    const body = await request.json();
    const updatedUser = await updateProfile(authUser.sub, {
      name: body.name,
      phone: body.phone,
    });

    return successResponse({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
