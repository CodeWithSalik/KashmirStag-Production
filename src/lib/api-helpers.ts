import { NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { ValidationError, handleApiError } from './errors';
export { handleApiError };

export function successResponse<T>(data: T, statusOrMessage: number | string = 200, maybeStatus = 200) {
  let status = 200;
  let message: string | undefined;

  if (typeof statusOrMessage === 'number') {
    status = statusOrMessage;
  } else if (typeof statusOrMessage === 'string') {
    message = statusOrMessage;
    status = maybeStatus;
  }

  return NextResponse.json({ success: true, ...(message ? { message } : {}), data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export function parseSearchParams(searchParams: URLSearchParams, schema: ZodSchema) {
  const params = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ValidationError('Invalid query parameters', result.error.errors);
  }
  return result.data;
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid request body', result.error.errors);
    }
    return result.data;
  } catch (err: any) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('Malformed JSON body');
  }
}
