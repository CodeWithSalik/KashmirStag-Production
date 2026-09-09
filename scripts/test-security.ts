import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function runSecurityVerification() {
  console.log('====================================================');
  console.log('  SECURITY HARDENING & DEFENSE VERIFICATION');
  console.log('====================================================\n');

  // 1. Rate Limiting Tests
  console.log('1. Testing In-Memory Sliding Window Rate Limiter:');
  const { checkRateLimit } = await import('../src/lib/rate-limit');
  const testKey = `test-ip-${Date.now()}`;
  const limit = 3;
  const windowSec = 10;

  const req1 = checkRateLimit(testKey, limit, windowSec);
  const req2 = checkRateLimit(testKey, limit, windowSec);
  const req3 = checkRateLimit(testKey, limit, windowSec);
  const req4 = checkRateLimit(testKey, limit, windowSec); // Should be blocked

  const rateLimitPass = req1.success && req2.success && req3.success && !req4.success && req4.remaining === 0;
  console.log(`  [${rateLimitPass ? 'PASS' : 'FAIL'}] First 3 requests allowed, 4th request blocked with remaining=0`);

  // 2. Timing Safe Equal & Razorpay Signature Security
  console.log('\n2. Testing Payment Signature Timing-Safe Equal Hardening:');
  const { getPaymentProvider } = await import('../src/services/payment.service');
  const provider = getPaymentProvider();

  // Test with malformed signature length (previously crashed with RangeError)
  let timingCrash = false;
  let invalidSigResult = true;
  try {
    invalidSigResult = provider.verifyPayment({
      orderId: 'order_12345',
      paymentId: 'pay_12345',
      signature: 'short_invalid_sig', // Byte length !== 64 hex characters
    });
  } catch (err: any) {
    timingCrash = true;
  }

  const timingSafePass = !timingCrash && invalidSigResult === false;
  console.log(`  [${timingSafePass ? 'PASS' : 'FAIL'}] Unequal buffer length handled safely without RangeError crash`);

  // 3. File Upload Magic Bytes and Path Traversal Security
  console.log('\n3. Testing File Upload Validation & Content Inspection:');
  const { saveUploadedFile, deleteUploadedFile } = await import('../src/lib/upload');

  // Test A: Disguised HTML file with image/jpeg mime type
  let disguisedRejected = false;
  try {
    const maliciousHtml = Buffer.from('<html><body><script>alert("XSS")</script></body></html>');
    const fakeFile = new File([maliciousHtml], 'avatar.html', { type: 'image/jpeg' });
    await saveUploadedFile(fakeFile, 'test');
  } catch (err: any) {
    disguisedRejected = err.message.includes('File header does not match') || err.message.includes('Invalid image content');
  }
  console.log(`  [${disguisedRejected ? 'PASS' : 'FAIL'}] Disguised executable/HTML payload rejected via magic bytes`);

  // Test B: Genuine JPEG header
  let genuineJpegAccepted = false;
  let savedPath = '';
  try {
    // Valid JPEG header: FF D8 FF E0 00 10 4A 46 49 46 00 01
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validFile = new File([jpegBuffer], 'photo.png', { type: 'image/jpeg' }); // note: extension is png, but mime is jpeg
    savedPath = await saveUploadedFile(validFile, 'test-products');
    genuineJpegAccepted = savedPath.endsWith('.jpg') && savedPath.startsWith('/uploads/test-products/');
  } catch (err: any) {
    console.error('JPEG upload error:', err);
  }
  console.log(`  [${genuineJpegAccepted ? 'PASS' : 'FAIL'}] Genuine JPEG accepted with strict .jpg extension derived from magic bytes`);

  // Test C: Path Traversal Directory Sanitization
  let traversalPrevented = false;
  try {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validFile = new File([jpegBuffer], 'photo.jpg', { type: 'image/jpeg' });
    const traversalPath = await saveUploadedFile(validFile, '../../sensitive-dir');
    traversalPrevented = !traversalPath.includes('..') && traversalPath.startsWith('/uploads/sensitive-dir/');
    await deleteUploadedFile(traversalPath);
  } catch (err: any) {
    traversalPrevented = false;
  }
  console.log(`  [${traversalPrevented ? 'PASS' : 'FAIL'}] Directory traversal path sanitized safely to public/uploads`);

  if (savedPath) {
    await deleteUploadedFile(savedPath);
  }

  if (rateLimitPass && timingSafePass && disguisedRejected && genuineJpegAccepted && traversalPrevented) {
    console.log('\n ALL SECURITY HARDENING DEFENSES VERIFIED: 100% SUCCESS');
    process.exit(0);
  } else {
    console.error('\n SECURITY VERIFICATION FAILED');
    process.exit(1);
  }
}

runSecurityVerification().catch((err) => {
  console.error('Fatal error running security verification:', err);
  process.exit(1);
});
