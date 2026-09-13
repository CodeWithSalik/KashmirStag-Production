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
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

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
    <div className="container-page py-8 lg:py-12">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-6">
        <span className="text-text-secondary">Cart</span>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-brand-700 font-semibold">Shipping &amp; Payment</span>
        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-text-muted">Confirmation</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-text mb-8">Secure Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-surface border border-border p-6 sm:p-7 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-text">Shipping Address</h2>
              <p className="text-xs text-text-secondary mt-0.5">Enter the destination for your order delivery</p>
            </div>
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
                className="text-xs text-brand-700 font-semibold hover:text-brand-800 transition-colors"
              >
                {isCustomAddress ? '← Choose Saved Address' : '+ Add New Address'}
              </button>
            )}
          </div>

          {savedAddresses.length > 0 && !isCustomAddress ? (
            <div className="space-y-3 mb-6">
              <p className="text-xs font-medium text-text-secondary mb-2">Select a delivery address:</p>
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr._id;
                return (
                  <div
                    key={addr._id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`cursor-pointer border rounded-xl p-4 transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/30 ring-1 ring-brand-500/20 shadow-xs'
                        : 'border-border bg-surface hover:border-brand-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
                        className="text-brand-700 focus:ring-brand-600 cursor-pointer h-4 w-4"
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
                  label="Email Address"
                  placeholder="name@example.com"
                  hint="We will send your order confirmation and dispatch tracking details here."
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
              <Input 
                label="Full Name" 
                placeholder="Recipient's full name" 
                required 
                value={address.name} 
                onChange={(e) => setAddress({ ...address, name: e.target.value })} 
              />
              <Input 
                type="tel"
                label="Phone Number" 
                placeholder="10-digit mobile number" 
                hint="Required for courier delivery coordination and OTP"
                required 
                value={address.phone} 
                onChange={(e) => setAddress({ ...address, phone: e.target.value })} 
              />
              <Input 
                label="Street Address / House No." 
                placeholder="House, Flat or Apartment No., Street Name" 
                required 
                value={address.line1} 
                onChange={(e) => setAddress({ ...address, line1: e.target.value })} 
              />
              <Input 
                label="Landmark / Area (Optional)" 
                placeholder="Near prominent landmark, Colony or Sector" 
                value={address.line2} 
                onChange={(e) => setAddress({ ...address, line2: e.target.value })} 
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="City / Town" 
                  placeholder="City" 
                  required 
                  value={address.city} 
                  onChange={(e) => setAddress({ ...address, city: e.target.value })} 
                />
                <Input 
                  label="State / Province" 
                  placeholder="State" 
                  required 
                  value={address.state} 
                  onChange={(e) => setAddress({ ...address, state: e.target.value })} 
                />
              </div>
              <Input 
                label="PIN Code" 
                placeholder="6-digit postal code" 
                required 
                value={address.pincode} 
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })} 
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-surface border border-border p-6 sm:p-7 rounded-xl shadow-xs sticky top-24">
          <h2 className="text-lg font-bold text-text mb-4 pb-3 border-b border-border">Order Review</h2>
          
          <div className="space-y-3.5 mb-6 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-surface-secondary rounded-lg flex-shrink-0 relative overflow-hidden border border-border">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-[10px]">No Img</div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium text-text truncate">{item.title}</p>
                  <p className="text-xs text-text-secondary">{item.variant} &times; {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-text whitespace-nowrap">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-2.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-semibold text-text">{formatPrice(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs border border-emerald-200">
                <span>Discount applied ({couponCode})</span>
                <span className="font-bold">-{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-text-secondary">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-emerald-700 font-semibold' : 'font-semibold text-text'}>
                {shipping === 0 ? 'Free Express' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between items-baseline font-bold text-lg pt-3 border-t border-border mt-3 text-text">
              <span>Total Amount</span>
              <span className="text-xl text-brand-900">{formatPrice(total)}</span>
            </div>
            <p className="text-[11px] text-text-muted text-right">All inclusive of taxes</p>
          </div>

          {error && (
            <div className="mt-4 p-3.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <Button 
            size="lg"
            className="w-full mt-6 flex items-center justify-center gap-2" 
            onClick={handlePayment} 
            disabled={isProcessing || !address.name || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode || (!user && !email)}
          >
            <Lock className="w-4 h-4" />
            <span>{isProcessing ? 'Processing Secure Payment...' : `Pay ${formatPrice(total)}`}</span>
          </Button>

          <div className="mt-6 pt-5 border-t border-border space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verified secure checkout via Razorpay</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-brand-700 flex-shrink-0" />
              <span>Supports UPI, Cards, NetBanking &amp; Wallets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
