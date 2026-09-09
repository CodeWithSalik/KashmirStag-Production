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

  return NextResponse.json(
    { success: false, error: 'Internal Server Error' },
    { status: 500 }
  );
}
