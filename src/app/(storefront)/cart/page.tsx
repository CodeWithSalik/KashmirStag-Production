'use client';

import { useCart } from '@/providers/cart-provider';
import { useAuth } from '@/providers/auth-provider';
import { formatPrice } from '@/lib/money';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import Image from 'next/image';

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

  if (isLoading) return <div className="p-8 text-center">Loading cart...</div>;

  if (items.length === 0) {
    return (
      <div className="p-8 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="mb-8 text-gray-600">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 99900 ? 0 : 4900;
  const total = subtotal - discount + shipping;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shopping Cart ({items.length} items)</h1>
          <Button variant="outline" size="sm" onClick={clearCart}>Clear Cart</Button>
        </div>
        
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border p-4 rounded-lg bg-white shadow-sm">
              <div className="w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 relative">
                {item.image && <Image src={item.image} alt={item.title} fill className="object-cover rounded-md" />}
              </div>
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">Variant: {item.variant}</p>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center border rounded">
                    <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 bg-gray-50">-</button>
                    <span className="px-3 py-1 border-x">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1 bg-gray-50">+</button>
                  </div>
                  <button onClick={() => removeItem(item.variantId)} className="text-sm text-red-500 hover:underline">Remove</button>
                </div>
              </div>
              <div className="text-right font-semibold">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg h-fit border">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
        
        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          <div className="flex gap-2">
            <Input 
              placeholder="Coupon code" 
              value={couponInput} 
              onChange={(e) => setCouponInput(e.target.value)} 
            />
            <Button variant="secondary" onClick={handleApplyCoupon}>Apply</Button>
          </div>
          {couponError && <p className="text-red-500 text-xs">{couponError}</p>}
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
          
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Link href="/checkout">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>
      </div>
    </div>
  );
}
