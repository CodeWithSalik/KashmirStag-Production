import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function test() {
  console.log('URI:', process.env.MONGODB_URI ? 'Exists' : 'Missing');
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Mongoose connected successfully! Host:', conn.connection.host);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Mongoose connect failed:', err.message);
    process.exit(1);
  }
}

test();
