"use client";

import { useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { useToast } from "@/providers/toast-provider";
import { VariantSelector } from "@/components/product/variant-selector";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";

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
      setTimeout(() => setAdded(false), 4000);
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
        <div className="flex items-center rounded-lg border border-border bg-surface-secondary/50 p-1 w-full sm:w-36 justify-between shadow-xs">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={quantity <= 1 || isOutOfStock}
            type="button"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold text-text select-none">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
            className="w-9 h-9 flex items-center justify-center rounded-md text-text-secondary hover:text-text hover:bg-surface transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={quantity >= maxQty || isOutOfStock}
            type="button"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <Button
          onClick={handleAdd}
          disabled={isOutOfStock || adding}
          className="flex-1 flex items-center justify-center gap-2"
          size="lg"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>{adding ? "Adding to Bag..." : isOutOfStock ? "Out of Stock" : added ? "Added to Bag ✓" : "Add to Bag"}</span>
        </Button>

        {added && (
          <Link
            href="/cart"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-semibold rounded-lg border border-brand-700 text-brand-800 bg-brand-50 hover:bg-brand-100 transition-colors shadow-xs"
          >
            <span>View Bag</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
