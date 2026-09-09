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
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-primary">Color: {selectedColor}</span>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => {
              const isSelected = selectedColor === c.color;
              return (
                <button
                  key={c.color}
                  onClick={() => handleColorChange(c.color!)}
                  aria-label={`Select color ${c.color}`}
                  title={c.color}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    isSelected ? "border-brand-600 ring-2 ring-brand-600 ring-offset-2" : "border-surface-200 hover:border-surface-300"
                  )}
                  style={{ backgroundColor: c.colorHex || '#ccc' }}
                />
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-text-primary">Size: {selectedSize}</span>
          <div className="flex flex-wrap gap-3">
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
                    "min-w-[3rem] px-3 py-2 text-sm rounded-md border transition-colors",
                    isSelected
                      ? "border-brand-600 bg-brand-50 text-brand-700 font-medium"
                      : isAvailable
                      ? "border-surface-200 bg-surface-50 hover:border-brand-300 text-text-secondary"
                      : "border-surface-100 bg-surface-100 text-text-muted cursor-not-allowed opacity-50"
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
        <div className={cn("text-sm font-medium", status.color)}>
          {status.text}
        </div>
      )}
    </div>
  );
}
