import crypto from 'crypto';
import User from '@/models/User';
import { hashPassword, comparePassword, signJwt } from '@/lib/auth';
import { ConflictError, UnauthorizedError, NotFoundError, AppError } from '@/lib/errors';
import { sendWelcome, sendPasswordReset } from '@/lib/email';
import { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MINUTES, PASSWORD_RESET_EXPIRY_HOURS } from '@/config/constants';
import { SignupSchema, LoginSchema, UpdateProfileSchema } from '@/validations/auth.schema';
import mongoose from 'mongoose';

export async function registerUser(data: SignupSchema) {
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  const hashedPassword = await hashPassword(data.password);
  
  const user = new User({
    name: data.name,
    email: data.email,
    password: hashedPassword,
  });

  await checkAndPromoteAdmin(user);
  await user.save();

  const token = signJwt({ sub: user.id, email: user.email, role: user.role });
  
  // Try sending welcome email without blocking
  sendWelcome(user.email, user.name).catch(console.error);

  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
}

export async function loginUser(data: LoginSchema) {
  const user = await User.findOne({ email: data.email });
  if (!user || !user.password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError(`Account is ${user.status}`);
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError('Account is temporarily locked. Try again later.', 423);
  }

  const isValidPassword = await comparePassword(data.password, user.password);
  
  if (!isValidPassword) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60000);
    }
    await user.save();
    throw new UnauthorizedError('Invalid credentials');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const token = signJwt({ sub: user.id, email: user.email, role: user.role });
  
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token };
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  if (!user) return; // Silent return for security

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken; // in production you should hash this token before saving
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 3600000);
  await user.save();

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  sendPasswordReset(user.email, resetUrl).catch(console.error);
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select('name email phone role createdAt');
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

export async function updateProfile(userId: string, data: UpdateProfileSchema) {
  const user = await User.findByIdAndUpdate(userId, data, { new: true }).select('name email phone role createdAt');
  if (!user) {
    throw new NotFoundError('User');
  }
  return user;
}

export async function checkAndPromoteAdmin(user: mongoose.Document & any) {
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  if (adminEmails.includes(user.email)) {
    user.role = 'admin';
  }
}
