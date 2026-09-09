"use client";
import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images?.length) {
    return (
      <div className="relative aspect-square w-full rounded-lg bg-surface-secondary border border-border flex flex-col items-center justify-center text-text-tertiary">
        <svg className="w-16 h-16 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect width="18" height="18" x="3" y="3" rx="2" strokeWidth="1.5" />
          <circle cx="9" cy="9" r="2" strokeWidth="1.5" />
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" strokeWidth="1.5" />
        </svg>
        <span className="text-sm font-medium">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-lg bg-surface-100 group">
        <Image
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 pb-2 md:pb-0 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative aspect-square w-20 md:w-full shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                currentIndex === index ? "border-brand-600" : "border-transparent hover:border-surface-300"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
