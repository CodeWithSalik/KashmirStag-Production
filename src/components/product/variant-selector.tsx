"use client";
import { useState } from "react";
import { ProductVariant } from "@/types/product";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
}: VariantSelectorProps) {
  // Group variants by color and size
  const colors = Array.from(new Map(variants.filter(v => v.color).map(v => [v.color, { color: v.color, colorHex: v.colorHex }])).values());
  const sizes = Array.from(new Set(variants.filter(v => v.size).map(v => v.size)));

  const [selectedColor, setSelectedColor] = useState<string | null>(selectedVariant?.color || colors[0]?.color || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(selectedVariant?.size || sizes[0] || null);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const newVariant = variants.find(v => v.color === color && v.size === selectedSize) 
      || variants.find(v => v.color === color);
    if (newVariant) {
      if (newVariant.size !== selectedSize) setSelectedSize(newVariant.size || null);
      onVariantChange(newVariant);
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const newVariant = variants.find(v => v.size === size && v.color === selectedColor)
      || variants.find(v => v.size === size);
    if (newVariant) {
      if (newVariant.color !== selectedColor) setSelectedColor(newVariant.color || null);
      onVariantChange(newVariant);
    }
  };

  const getStockStatus = () => {
    if (!selectedVariant) return null;
    const qty = selectedVariant.availableQty ?? 0;
    if (qty <= 0) return { text: "Out of Stock", color: "text-error" };
    if (qty <= 5) return { text: `Only ${qty} left`, color: "text-warning" };
    return { text: "In Stock", color: "text-success" };
  };

  const status = getStockStatus();

  return (
    <div className="flex flex-col gap-6">
      {colors.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">Color: <span className="font-normal text-text-secondary">{selectedColor}</span></span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const isSelected = selectedColor === c.color;
              return (
                <button
                  key={c.color}
                  onClick={() => handleColorChange(c.color!)}
                  aria-label={`Select color ${c.color}`}
                  title={c.color}
                  className={cn(
                    "h-8 w-8 rounded-full border transition-all relative flex items-center justify-center",
                    isSelected
                      ? "border-brand-700 ring-2 ring-brand-700 ring-offset-2 scale-105"
                      : "border-border hover:border-text-secondary hover:scale-105"
                  )}
                  style={{ backgroundColor: c.colorHex || '#ccc' }}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-text">Size: <span className="font-normal text-text-secondary">{selectedSize}</span></span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const isSelected = selectedSize === s;
              const isAvailable = variants.some(v => v.size === s && v.color === selectedColor && (v.availableQty ?? 0) > 0);
              
              return (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s!)}
                  disabled={!isAvailable}
                  aria-label={`Select size ${s}`}
                  className={cn(
                    "min-w-[3rem] px-3.5 py-2 text-xs font-medium rounded-lg border transition-all duration-150",
                    isSelected
                      ? "border-brand-700 bg-brand-50/70 text-brand-800 font-semibold shadow-sm ring-1 ring-brand-700"
                      : isAvailable
                      ? "border-border bg-surface hover:border-brand-600 hover:text-brand-700 text-text active:scale-95"
                      : "border-border/60 bg-surface-secondary text-text-tertiary cursor-not-allowed line-through opacity-50"
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {status && (
        <div className="flex items-center gap-2 text-xs font-medium pt-1">
          <span className={cn(
            "w-2 h-2 rounded-full shrink-0",
            (selectedVariant?.availableQty ?? 0) > 5 ? "bg-success" :
            (selectedVariant?.availableQty ?? 0) > 0 ? "bg-warning" : "bg-text-tertiary"
          )} />
          <span className={status.color}>{status.text}</span>
        </div>
      )}
    </div>
  );
}
