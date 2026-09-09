'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Star, ArrowLeft, ArrowRight, Link as LinkIcon, Loader2 } from 'lucide-react';

interface ProductImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
}

export function ProductImageManager({ images, onChange, disabled = false }: ProductImageManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (images.length + files.length > 10) {
      toast({
        title: 'Too many images',
        description: 'You can have at most 10 images per product.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const newUploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Client-side quick size check
      if (file.size > 4 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds the 4MB limit.`,
          variant: 'destructive',
        });
        continue;
      }

      // Basic client type check (backend performs strict magic-byte inspection)
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Invalid file format',
          description: `${file.name} is not a valid JPEG, PNG, or WEBP image.`,
          variant: 'destructive',
        });
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.data?.url) {
          throw new Error(data.error || 'Upload failed');
        }

        newUploadedUrls.push(data.data.url);
      } catch (err: any) {
        toast({
          title: 'Upload failed',
          description: err.message || `Failed to upload ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    if (newUploadedUrls.length > 0) {
      onChange([...images, ...newUploadedUrls]);
      toast({
        title: 'Uploaded successfully',
        description: `Added ${newUploadedUrls.length} image(s).`,
      });
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (images.length >= 10) {
      toast({
        title: 'Limit reached',
        description: 'Maximum 10 images allowed per product.',
        variant: 'destructive',
      });
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
    toast({
      title: 'Image URL Added',
      description: 'Image added to product gallery.',
    });
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([target, ...rest]);
    toast({
      title: 'Primary Image Updated',
      description: 'Set as primary display image.',
    });
  };

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-text">Product Images ({images.length}/10)</label>
          <p className="text-xs text-text-secondary mt-0.5">
            The first image is the primary storefront thumbnail. Drag & drop or upload JPG, PNG, or WEBP up to 4MB.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={disabled || uploading}
          className="text-xs"
        >
          <LinkIcon className="w-3.5 h-3.5 mr-1" />
          {showUrlInput ? 'Hide URL' : 'Add via URL'}
        </Button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-3 bg-surface-secondary border border-border rounded-lg">
          <Input
            placeholder="https://images.unsplash.com/photo-..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={disabled}
            className="text-xs"
          />
          <Button type="button" size="sm" onClick={handleAddUrl} disabled={disabled || !urlInput.trim()}>
            Add
          </Button>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && !uploading) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!disabled && !uploading) fileInputRef.current?.click();
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-brand-600 bg-brand-50/50' : 'border-border hover:border-brand-500 bg-surface'
        } ${disabled || uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="text-sm font-medium text-text">Uploading & inspecting images...</p>
              <p className="text-xs text-text-secondary">Validating magic bytes and security signatures</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">
                  <span className="text-brand-600 underline">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-text-secondary mt-0.5">JPEG, PNG, or WEBP (Max 4MB per image)</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {images.map((imgUrl, index) => {
            const isPrimary = index === 0;
            return (
              <div
                key={`${imgUrl}-${index}`}
                className={`group relative aspect-square rounded-lg overflow-hidden border bg-surface-secondary flex flex-col justify-between ${
                  isPrimary ? 'border-brand-600 ring-2 ring-brand-600/30' : 'border-border'
                }`}
              >
                {/* Image Thumbnail */}
                <img
                  src={imgUrl}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Graceful visual fallback for broken image URLs
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                  }}
                />

                {/* Primary Tag */}
                {isPrimary && (
                  <span className="absolute top-1.5 left-1.5 bg-brand-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> Primary
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                  disabled={disabled || uploading}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition shadow"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Action Overlay / Bar */}
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 flex items-center justify-between opacity-95 transition">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'left')}
                      disabled={disabled || uploading || index === 0}
                      className="p-1 text-white hover:text-brand-300 disabled:opacity-30 transition"
                      title="Move left"
                      aria-label="Move left"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'right')}
                      disabled={disabled || uploading || index === images.length - 1}
                      className="p-1 text-white hover:text-brand-300 disabled:opacity-30 transition"
                      title="Move right"
                      aria-label="Move right"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      disabled={disabled || uploading}
                      className="text-[10px] text-white hover:text-brand-300 font-medium px-1.5 py-0.5 rounded bg-white/20 hover:bg-white/30 transition"
                      title="Make this the primary image"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
