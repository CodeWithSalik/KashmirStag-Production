'use client';

import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { formatPrice } from '@/lib/money';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Script from 'next/script';
import Image from 'next/image';

export default function CheckoutPage() {
  const { items, subtotal, isLoading, couponCode } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'IN',
  });

  const [email, setEmail] = useState(user?.email || '');
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  useEffect(() => {
    if (couponCode) {
      fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.data?.valid) {
            setDiscount(data.data.discount);
          }
        });
    }
  }, [couponCode]);

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const shipping = subtotal >= 99900 ? 0 : 4900;
  const total = subtotal - discount + shipping;

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      const cleanedPhone = address.phone.replace(/\D/g, '').replace(/^(?:91|0)/, '');
      const cleanedPincode = address.pincode.replace(/\s+/g, '');

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: {
            ...address,
            name: address.name.trim(),
            phone: cleanedPhone || address.phone.trim(),
            line1: address.line1.trim(),
            line2: address.line2?.trim() || undefined,
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: cleanedPincode || address.pincode.trim(),
          },
          couponCode: couponCode || undefined,
          email: (user?.email || email || '').trim() || undefined,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        const errorMsg = data.errors && data.errors.length > 0
          ? data.errors.map((e: any) => e.message || `${e.path?.join('.')}: ${e.message}`).join(', ')
          : (data.error || 'Checkout failed');
        throw new Error(errorMsg);
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = data.data;

      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        throw new Error('Payment gateway failed to initialize. Please ensure ad-blockers are disabled and try again.');
      }

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'KashmirStag',
        description: `Order ${orderId}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              router.push(`/order-confirmation/${orderId}`);
            } else {
              setError('Payment verification failed');
            }
          } catch (e) {
            setError('Payment verification error');
          }
        },
        prefill: {
          name: address.name,
          email: user?.email || email || '',
          contact: cleanedPhone || address.phone,
        },
        theme: { color: '#000000' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error?.description || 'Payment was declined or cancelled');
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          <div className="space-y-4">
            {!user && (
              <Input
                type="email"
                placeholder="Email Address (for order updates)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            <Input placeholder="Full Name" value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} />
            <Input placeholder="Phone Number" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
            <Input placeholder="Address Line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
            <Input placeholder="Address Line 2 (Optional)" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
            </div>
            <Input placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.variantId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity} x {item.title} ({item.variant})</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({couponCode})</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}

          <Button 
            className="w-full mt-6" 
            onClick={handlePayment} 
            disabled={isProcessing || !address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode || (!user && !email)}
          >
            {isProcessing ? 'Processing...' : `Pay ${formatPrice(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
