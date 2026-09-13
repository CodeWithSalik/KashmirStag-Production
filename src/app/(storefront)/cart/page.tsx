'use client';

import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { formatPrice } from '@/lib/money';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';
import { ShoppingBag, Trash2, Plus, Minus, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { items, subtotal, isLoading, updateQuantity, removeItem, clearCart, applyCoupon, removeCoupon, couponCode } = useCart();
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);

  const handleApplyCoupon = async () => {
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.data.valid) throw new Error(data.data.error);
      
      setDiscount(data.data.discount);
      await applyCoupon(couponInput);
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon');
    }
  };

  if (isLoading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-text-secondary">Loading your shopping cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-surface border border-border shadow-xs">
          <div className="w-16 h-16 rounded-full bg-brand-50 border border-brand-200/70 flex items-center justify-center mx-auto mb-5 text-brand-700">
            <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Your Cart is Empty</h1>
          <p className="text-sm text-text-secondary mb-6 leading-relaxed">
            Looks like you haven&apos;t added any authentic Kashmiri items yet. Explore our handcrafted collections today.
          </p>
          <Link href="/shop" className="inline-block w-full">
            <Button className="w-full">
              Explore Collections
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 99900 ? 0 : 4900;
  const total = subtotal - discount + shipping;

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold text-text">Shopping Bag</h1>
              <p className="text-xs text-text-secondary mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-text-muted hover:text-danger-600">
              Clear All
            </Button>
          </div>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.variantId} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-xl bg-surface border border-border shadow-xs">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface-secondary rounded-lg flex-shrink-0 relative overflow-hidden border border-border">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-text text-base">{item.title}</h3>
                    <p className="text-xs text-text-secondary mt-1">Option: <span className="font-medium text-text">{item.variant}</span></p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-6 mt-4">
                    <div className="flex items-center rounded-lg border border-border bg-surface-secondary/40 p-0.5">
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)} 
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold text-text select-none">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)} 
                        aria-label="Increase quantity"
                        className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeItem(item.variantId)} 
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-danger-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
                <div className="text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                  <span className="sm:hidden text-xs text-text-secondary font-medium">Subtotal</span>
                  <div>
                    <span className="text-base font-bold text-text">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {formatPrice(item.price)} each
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-surface border border-border p-6 rounded-xl h-fit shadow-xs sticky top-24">
            <h2 className="text-lg font-bold text-text mb-4 pb-3 border-b border-border">Order Summary</h2>
            
            <div className="space-y-3.5 text-sm mb-6">
              <div className="flex justify-between text-text-secondary">
                <span>Items Subtotal</span>
                <span className="font-semibold text-text">{formatPrice(subtotal)}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Discount code" 
                    value={couponInput} 
                    onChange={(e) => setCouponInput(e.target.value)} 
                    className="text-xs"
                  />
                  <Button variant="secondary" size="sm" onClick={handleApplyCoupon} className="whitespace-nowrap">
                    Apply
                  </Button>
                </div>
                {couponError && <p className="text-danger-600 text-xs mt-1.5">{couponError}</p>}
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-md text-xs mt-2 border border-emerald-200">
                    <span className="font-medium">Discount applied ({couponCode})</span>
                    <span className="font-bold">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-text-secondary pt-1">
                <span>Estimated Shipping</span>
                <span className={shipping === 0 ? 'text-emerald-700 font-semibold' : 'font-semibold text-text'}>
                  {shipping === 0 ? 'Free Express' : formatPrice(shipping)}
                </span>
              </div>
              
              {subtotal < 99900 && (
                <p className="text-[11px] text-brand-700 bg-brand-50/60 p-2 rounded border border-brand-100">
                  Add {formatPrice(99900 - subtotal)} more to qualify for <span className="font-semibold">Free Express Shipping</span>
                </p>
              )}

              <div className="border-t border-border pt-4 flex justify-between items-baseline font-bold text-lg text-text">
                <span>Total Amount</span>
                <span className="text-xl text-brand-900">{formatPrice(total)}</span>
              </div>
              <p className="text-[11px] text-text-muted text-right">Includes all applicable taxes</p>
            </div>

            <Link href="/checkout" className="block w-full">
              <Button size="lg" className="w-full flex items-center justify-center gap-2">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <div className="mt-5 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-text-secondary">
              <ShieldCheck className="w-4 h-4 text-brand-700 flex-shrink-0" />
              <span>Guaranteed safe &amp; secure checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
