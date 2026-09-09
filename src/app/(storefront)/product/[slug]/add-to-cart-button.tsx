"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import { VariantSelector } from "@/components/product/variant-selector";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AddToCartButton({ product, variants }: { product: any, variants: any[] }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedVariant, setSelectedVariant] = useState<any>(variants[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    if (!selectedVariant?._id) {
      toast('Please select a product variant', 'error');
      return;
    }
    setAdding(true);
    try {
      await addItem(
        selectedVariant._id,
        product._id,
        quantity
      );
      setAdded(true);
      toast('Item added to your cart!', 'success');
      setTimeout(() => setAdded(false), 3000);
    } catch (err: any) {
      toast(err.message || 'Failed to add item to cart', 'error');
    } finally {
      setAdding(false);
    }
  };

  const maxQty = selectedVariant ? (selectedVariant.availableQty ?? 10) : (variants.length > 0 ? 10 : 0);
  const isOutOfStock = variants.length === 0 || maxQty <= 0;

  return (
    <div className="flex flex-col gap-6">
      {variants.length > 0 && (
        <VariantSelector
          variants={variants}
          selectedVariant={selectedVariant}
          onVariantChange={setSelectedVariant}
        />
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center justify-between sm:justify-start border border-border rounded-md w-32">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 text-text-secondary hover:text-brand-600 disabled:opacity-30"
            disabled={quantity <= 1 || isOutOfStock}
            type="button"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
            className="px-3 py-2 text-text-secondary hover:text-brand-600 disabled:opacity-30"
            disabled={quantity >= maxQty || isOutOfStock}
            type="button"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        
        <Button
          onClick={handleAdd}
          disabled={isOutOfStock || adding}
          className="flex-1"
          size="lg"
        >
          {adding ? "Adding..." : isOutOfStock ? "Out of Stock" : added ? "Added to Cart ✓" : "Add to Cart"}
        </Button>

        {added && (
          <Link
            href="/cart"
            className="inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-md border border-brand-600 text-brand-700 bg-brand-50 hover:bg-brand-100 transition-colors"
          >
            View Cart &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
