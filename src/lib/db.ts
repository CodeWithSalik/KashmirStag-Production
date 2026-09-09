import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined.');
}

/**
 * Global cache for the Mongoose connection promise.
 * In serverless environments (Vercel), each cold start creates a new module scope.
 * By caching on `globalThis`, we reuse the connection across hot reloads in
 * development and across concurrent requests in production.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cached;

/**
 * Returns a connected Mongoose instance.
 * Safe to call from any API route or server component — deduplicates connections.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
      })
      .then((m) => {
        console.log('[DB] Connected to MongoDB');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

/**
 * Returns a Mongoose client session for multi-document transactions.
 * Usage:
 *   const session = await startSession();
 *   try {
 *     await session.withTransaction(async () => { ... });
 *   } finally {
 *     session.endSession();
 *   }
 */
export async function startSession() {
  const conn = await connectDB();
  return conn.startSession();
}
