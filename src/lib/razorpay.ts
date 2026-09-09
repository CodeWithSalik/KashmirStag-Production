import Razorpay from 'razorpay';

export function getRazorpay(): Razorpay {
  const key_id = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').replace(/['"]/g, '').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').replace(/['"]/g, '').trim();
  
  if (!key_id || !key_secret) {
    throw new Error('Razorpay keys are missing from environment variables');
  }
  if (process.env.NODE_ENV === 'development') {
    // Only log in dev without leaking secrets
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}
