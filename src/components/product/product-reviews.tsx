"use client";
import { useState, useEffect } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/providers/auth-provider";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  _id: string;
  rating: number;
  title: string;
  body: string;
  user: { firstName: string };
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export function ProductReviews({ productId, avgRating, reviewCount }: { productId: string, avgRating: number, reviewCount: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, title: "", body: "", orderId: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews?page=${page}&limit=5`);
      const data = await res.json();
      if (res.ok) {
        const list = data.data?.reviews || data.reviews || [];
        setReviews(Array.isArray(list) ? list : []);
        setTotalPages(data.data?.pagination?.totalPages || data.totalPages || 1);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error(err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ rating: 5, title: "", body: "", orderId: "" });
        alert("Review submitted successfully! It will appear after moderation.");
      } else {
        setError(data.error || "Failed to submit review");
      }
    } catch (err) {
      setError("An error occurred");
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 bg-surface-secondary p-6 rounded-lg border border-border">
          <h3 className="text-xl font-semibold mb-4 text-text">Customer Reviews</h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-4xl font-bold text-text">{avgRating.toFixed(1)}</div>
            <div>
              <StarRating rating={avgRating} />
              <div className="text-sm text-text-secondary mt-1">{reviewCount} reviews</div>
            </div>
          </div>
          <Button onClick={() => user ? setIsModalOpen(true) : alert("Please log in to write a review")} className="w-full mt-6">
            Write a Review
          </Button>
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          {loading ? (
            <div className="text-center py-8 text-text-secondary">Loading reviews...</div>
          ) : (!reviews || reviews.length === 0) ? (
            <EmptyState title="No reviews yet" description="Be the first to review this product!" />
          ) : (
            <>
              {(reviews || []).map((r: any) => {
                const authorName = r.user?.firstName || r.user?.name || r.userId?.name || 'Customer';
                return (
                  <div key={r._id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} />
                        <span className="font-medium text-sm text-text">{r.title}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary mb-2">{r.body}</div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="font-medium text-text">{authorName}</span>
                      {(r.isVerifiedPurchase || r.isVerified) && (
                        <span className="text-success flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Write a Review">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-error text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="text-2xl focus:outline-none"
                >
                  <span className={star <= formData.rating ? "text-warning" : "text-surface-300"}>★</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Review Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            label="Review Body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            required
            rows={4}
          />
          <Input
            label="Order ID (for verified purchase)"
            value={formData.orderId}
            onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
            placeholder="Optional"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Review"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
