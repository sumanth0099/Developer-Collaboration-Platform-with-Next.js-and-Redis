"use client";

import { useState, useEffect } from "react";
import { getPusherClient } from "@/lib/pusher";
import ReviewForm from "./ReviewForm";
import { CheckCircle, Star, User } from "lucide-react";

type ReviewData = {
  id: string; content: string; lineReference: number | null; rating: number;
  isResolved: boolean; createdAt: string; updatedAt: string;
  submissionId: string; reviewerId: string;
  reviewer: { id: string; username: string; displayName: string; avatarUrl: string | null };
};

type Props = {
  initialReviews: ReviewData[];
  submissionId: string;
  submissionAuthorId: string;
  currentUserId?: string;
};

export default function ReviewsList({ initialReviews, submissionId, submissionAuthorId, currentUserId }: Props) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);

  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;
    const channel = client.subscribe(`submission-${submissionId}`);
    channel.bind("new-review", (data: ReviewData) => {
      setReviews((prev) => {
        if (prev.some((r) => r.id === data.id)) return prev;
        return [data, ...prev];
      });
    });
    return () => {
      channel.unbind_all();
      client.unsubscribe(`submission-${submissionId}`);
    };
  }, [submissionId]);

  const handleReviewAdded = (review: ReviewData) => {
    setReviews((prev) => [review, ...prev]);
  };

  const handleResolve = async (reviewId: string) => {
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, isResolved: true }),
    });
    setReviews((prev) => prev.map((r) => r.id === reviewId ? { ...r, isResolved: true } : r));
  };

  const canReview = currentUserId && currentUserId !== submissionAuthorId &&
    !reviews.some((r) => r.reviewerId === currentUserId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Reviews ({reviews.length})</h2>
      </div>

      {canReview && (
        <ReviewForm submissionId={submissionId} onReviewAdded={handleReviewAdded} />
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={`bg-gray-900 border rounded-xl p-5 space-y-3 transition-all ${review.isResolved ? "border-green-800/50 opacity-75" : "border-gray-800"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {review.reviewer.avatarUrl ? (
                    <img src={review.reviewer.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-white">{review.reviewer.displayName}</span>
                    <span className="text-gray-500 text-sm ml-2">@{review.reviewer.username}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`} />
                    ))}
                  </div>
                  {review.isResolved && (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>
              </div>

              {review.lineReference && (
                <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded font-mono">
                  Line {review.lineReference}
                </div>
              )}

              <p className="text-gray-300 text-sm leading-relaxed">{review.content}</p>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{new Date(review.createdAt).toLocaleString()}</span>
                {currentUserId === submissionAuthorId && !review.isResolved && (
                  <button onClick={() => handleResolve(review.id)}
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
