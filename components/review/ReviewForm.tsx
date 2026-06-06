"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Send } from "lucide-react";

type Props = {
  submissionId: string;
  onReviewAdded?: (review: any) => void;
};

export default function ReviewForm({ submissionId, onReviewAdded }: Props) {
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [lineReference, setLineReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 30) { setError("Review must be at least 30 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, content, rating, lineReference: lineReference ? parseInt(lineReference) : null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit review."); return; }
      setContent(""); setRating(5); setLineReference("");
      onReviewAdded?.(data.data);
      router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-white">Write a Review</h3>

      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button type="button" key={i}
            onMouseEnter={() => setHoveredRating(i + 1)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(i + 1)}>
            <Star className={`w-6 h-6 transition-colors ${i < (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-400">{rating}/5</span>
      </div>

      <input
        type="number" min="1" value={lineReference} onChange={(e) => setLineReference(e.target.value)}
        placeholder="Line reference (optional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />

      <textarea
        value={content} onChange={(e) => setContent(e.target.value)}
        placeholder="Write your review (min 30 characters)..."
        rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{content.length} / 5000 characters</span>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-semibold transition-colors">
          <Send className="w-4 h-4" /> {loading ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
