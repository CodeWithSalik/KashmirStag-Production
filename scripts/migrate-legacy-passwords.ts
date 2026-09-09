/**
 * Script to migrate legacy passwords to bcrypt
 * Usage: tsx scripts/migrate-legacy-passwords.ts
 * Ensure `npm i crypto-js` is run before executing.
 */
import mongoose from 'mongoose';
import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const AES_SECRET = process.env.AES_SECRET || 'legacy-secret';
const BCRYPT_ROUNDS = 12;

if (!MONGODB_URI) {
  console.error('MONGODB_URI missing');
  process.exit(1);
}

// Minimal schema for migration
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function migrate() {
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to DB');

  // Find users whose password does not start with $2a$, $2b$, or $2y$ (bcrypt prefix)
  const users = await User.find({ password: { $not: /^\$2[aby]\$/ } });
  
  console.log(`Found ${users.length} users to migrate.`);
  
  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    if (!user.password) continue;
    
    try {
      // Decrypt legacy password
      const bytes = CryptoJS.AES.decrypt(user.password, AES_SECRET);
      const originalPassword = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!originalPassword) {
        throw new Error('Failed to decrypt');
      }

      // Hash with bcrypt
      const newHash = await bcrypt.hash(originalPassword, BCRYPT_ROUNDS);
      
      // Update
      user.password = newHash;
      await user.save();
      successCount++;
    } catch (err: any) {
      console.error(`Failed for user ${user.email}: ${err.message}`);
      failCount++;
    }
  }

  console.log(`Migration complete. Success: ${successCount}, Failures: ${failCount}`);
  process.exit(0);
}

migrate();
