import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testAuth() {
  const { connectDB } = await import('../src/lib/db');
  const { loginUser } = await import('../src/services/auth.service');
  const { verifyJwt } = await import('../src/lib/auth');

  try {
    await connectDB();
    console.log('[AuthTest] Connected to DB.');

    // 1. Test Admin Login
    const adminRes = await loginUser({
      email: 'pirzadasalik543@gmail.com',
      password: 'Password123!',
    });
    console.log('[AuthTest] Admin login success:', adminRes.user);
    const decodedAdmin = verifyJwt(adminRes.token);
    console.log('[AuthTest] Decoded Admin Token:', decodedAdmin);

    // 2. Test Customer Login
    const custRes = await loginUser({
      email: 'customer@kashmirstag.com',
      password: 'Password123!',
    });
    console.log('[AuthTest] Customer login success:', custRes.user);

    // 3. Test Invalid Password
    try {
      await loginUser({
        email: 'pirzadasalik543@gmail.com',
        password: 'WrongPassword!',
      });
      console.error('[AuthTest] ERROR: Invalid password should have failed!');
      process.exit(1);
    } catch (e: any) {
      console.log('[AuthTest] Correctly rejected wrong password:', e.message);
    }

    console.log('[AuthTest] All authentication tests passed with flying colors!');
    process.exit(0);
  } catch (err) {
    console.error('[AuthTest] Auth test failed:', err);
    process.exit(1);
  }
}

testAuth();
