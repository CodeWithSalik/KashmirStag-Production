'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { ProductCard } from '@/components/product/product-card';

interface WishlistProduct {
  _id: string;
  title: string;
  slug: string;
  images: string[];
  basePrice: number;
  compareAtPrice?: number;
  avgRating: number;
  reviewCount: number;
}

export default function WishlistPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetch('/api/wishlist')
        .then((res) => res.json())
        .then((data) => {
          setProducts(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleRemove = async (productId: string) => {
    await fetch(`/api/wishlist?productId=${productId}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p._id !== productId));
  };

  if (authLoading || loading) {
    return <div className="container-page py-16 text-center text-text-secondary">Loading wishlist...</div>;
  }

  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Your wishlist is empty.</p>
          <a href="/shop" className="mt-4 inline-block text-brand-700 font-medium hover:underline">
            Browse our shop →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="relative group">
              <ProductCard
                product={{
                  id: product._id,
                  title: product.title,
                  slug: product.slug,
                  image: product.images?.[0] || '',
                  basePrice: product.basePrice,
                  compareAtPrice: product.compareAtPrice,
                  avgRating: product.avgRating,
                  reviewCount: product.reviewCount,
                }}
              />
              <button
                onClick={() => handleRemove(product._id)}
                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-card opacity-0 group-hover:opacity-100 transition-opacity text-error hover:bg-error-light"
                aria-label={`Remove ${product.title} from wishlist`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
