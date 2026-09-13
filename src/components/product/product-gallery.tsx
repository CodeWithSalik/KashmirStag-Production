"use client";
import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});

  const getImageSrc = (index: number) => {
    if (errorMap[index]) return "/images/placeholder.svg";
    return images[index] || "/images/placeholder.svg";
  };

  if (!images?.length) {
    return (
      <div className="relative aspect-square w-full rounded-2xl bg-surface-secondary border border-border flex flex-col items-center justify-center text-text-tertiary">
        <ImageOff className="w-10 h-10 mb-2 opacity-40 text-text-tertiary" strokeWidth={1.5} />
        <span className="text-xs font-medium">No Image Available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full flex-1 overflow-hidden rounded-2xl bg-surface-secondary border border-border group shadow-xs">
        <Image
          src={getImageSrc(currentIndex)}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setErrorMap((prev) => ({ ...prev, [currentIndex]: true }))}
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
                src={getImageSrc(index)}
                alt={`Thumbnail ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                onError={() => setErrorMap((prev) => ({ ...prev, [index]: true }))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
