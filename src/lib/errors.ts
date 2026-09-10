import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number, isOperational = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity = 'Resource', id?: string) {
    super(`${entity} ${id ? `'${id}' ` : ''}not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  errors?: any;
  constructor(message: string, errors?: any) {
    super(message, 400);
    this.errors = errors;
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message, errors: error.errors },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: 'Validation Error', errors: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  // Handle Mongoose Validation Errors
  if (error && typeof error === 'object' && (error as any).name === 'ValidationError') {
    const mongooseErrors = (error as any).errors;
    const messages = mongooseErrors
      ? Object.values(mongooseErrors).map((e: any) => e.message || String(e))
      : [(error as any).message || 'Validation failed'];
    return NextResponse.json(
      { success: false, error: messages.join(', '), errors: mongooseErrors },
      { status: 400 }
    );
  }

  // Handle Mongoose CastError (invalid ObjectId or type)
  if (error && typeof error === 'object' && (error as any).name === 'CastError') {
    return NextResponse.json(
      { success: false, error: `Invalid ${(error as any).path || 'field'}: ${(error as any).value}` },
      { status: 400 }
    );
  }

  // Handle MongoDB E11000 duplicate key error
  if (error && typeof error === 'object' && (error as any).code === 11000) {
    const keyPattern = (error as any).keyPattern ? Object.keys((error as any).keyPattern).join(', ') : 'field';
    return NextResponse.json(
      { success: false, error: `A record with this ${keyPattern} already exists.` },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { success: false, error: (error as any)?.message || 'Internal Server Error' },
    { status: 500 }
  );
}
