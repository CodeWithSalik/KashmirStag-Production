'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-provider';

export interface CartItem {
  variantId: string;
  productId: string;
  quantity: number;
  title: string;
  variant: string;
  image: string;
  price: number;
  availableQty: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addItem: (variantId: string, productId: string, quantity: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  couponCode: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setItems(data.data?.items || []);
        if (data.data?.cart?.couponCode) {
          setCouponCode(data.data.cart.couponCode);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addItem = async (variantId: string, productId: string, quantity: number) => {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, productId, quantity }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to add item to cart');
    }

    const data = await res.json();
    setItems(data.data?.items || []);
    if (data.data?.cart?.couponCode) {
      setCouponCode(data.data.cart.couponCode);
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    const res = await fetch('/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to update item quantity');
    }

    const data = await res.json();
    setItems(data.data?.items || []);
  };

  const removeItem = async (variantId: string) => {
    const res = await fetch(`/api/cart?variantId=${encodeURIComponent(variantId)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to remove item');
    }

    const data = await res.json();
    setItems(data.data?.items || []);
  };

  const clearCart = async () => {
    const res = await fetch('/api/cart', {
      method: 'DELETE',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to clear cart');
    }

    setItems([]);
    setCouponCode(null);
  };

  const applyCoupon = async (code: string) => {
    const res = await fetch('/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || 'Failed to apply coupon');
    }

    setCouponCode(code);
    await fetchCart();
  };

  const removeCoupon = async () => {
    await fetch('/api/cart/coupon', { method: 'DELETE' }).catch(() => {});
    setCouponCode(null);
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        couponCode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
