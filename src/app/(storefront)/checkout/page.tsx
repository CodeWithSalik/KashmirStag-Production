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

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  useEffect(() => {
    if (user) {
      fetch('/api/addresses')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setSavedAddresses(json.data);
            const defaultAddr = json.data.find((a: any) => a.isDefault) || json.data[0];
            setSelectedAddressId(defaultAddr._id);
            setAddress({
              name: defaultAddr.name || '',
              phone: defaultAddr.phone || '',
              line1: defaultAddr.line1 || '',
              line2: defaultAddr.line2 || '',
              city: defaultAddr.city || '',
              state: defaultAddr.state || '',
              pincode: defaultAddr.pincode || '',
              country: defaultAddr.country || 'IN',
            });
            setIsCustomAddress(false);
          } else {
            setIsCustomAddress(true);
          }
        })
        .catch(() => setIsCustomAddress(true));
    } else {
      setIsCustomAddress(true);
    }
  }, [user]);

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr._id);
    setIsCustomAddress(false);
    setAddress({
      name: addr.name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'IN',
    });
  };

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Shipping Address</h2>
            {savedAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomAddress(!isCustomAddress);
                  if (isCustomAddress && savedAddresses.length > 0) {
                    const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
                    handleSelectSavedAddress(defaultAddr);
                  } else {
                    setAddress({
                      name: user?.name || '',
                      phone: '',
                      line1: '',
                      line2: '',
                      city: '',
                      state: '',
                      pincode: '',
                      country: 'IN',
                    });
                  }
                }}
                className="text-xs text-brand-700 font-semibold hover:underline"
              >
                {isCustomAddress ? '← Use Saved Address' : '+ Add New Address'}
              </button>
            )}
          </div>

          {savedAddresses.length > 0 && !isCustomAddress ? (
            <div className="space-y-3 mb-6">
              <p className="text-xs text-text-secondary mb-2">Select a delivery address:</p>
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr._id;
                return (
                  <div
                    key={addr._id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`cursor-pointer border rounded-lg p-4 transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/20 shadow-sm'
                        : 'border-border bg-white hover:border-text-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text">{addr.name}</span>
                        {addr.isDefault && (
                          <span className="bg-brand-100 text-brand-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleSelectSavedAddress(addr)}
                        className="text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </div>
                    <div className="text-xs text-text-secondary space-y-0.5 mt-1">
                      <p>{addr.line1} {addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="text-text font-medium mt-1">Phone: {addr.phone}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
          )}
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
