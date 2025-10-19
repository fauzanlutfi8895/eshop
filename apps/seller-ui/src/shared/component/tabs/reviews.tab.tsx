import React from "react";
import { Star, MessageSquare } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

const mockReviews: Review[] = [
  {
    id: "1",
    reviewerName: "John Doe",
    reviewerAvatar: "https://via.placeholder.com/50",
    rating: 5,
    comment:
      "Excellent service and high-quality products! Will definitely shop again.",
    date: "2025-10-15",
  },
  {
    id: "2",
    reviewerName: "Sarah Smith",
    reviewerAvatar: "https://via.placeholder.com/50",
    rating: 4,
    comment:
      "Great products, fast shipping. The packaging could be better but overall satisfied.",
    date: "2025-10-12",
  },
  {
    id: "3",
    reviewerName: "Mike Johnson",
    reviewerAvatar: "https://via.placeholder.com/50",
    rating: 5,
    comment:
      "Amazing shop! Products are exactly as described. Customer service is top-notch.",
    date: "2025-10-10",
  },
  {
    id: "4",
    reviewerName: "Emily Brown",
    reviewerAvatar: "https://via.placeholder.com/50",
    rating: 4,
    comment: "Good quality and reasonable prices. Delivery was on time.",
    date: "2025-10-08",
  },
  {
    id: "5",
    reviewerName: "David Wilson",
    reviewerAvatar: "https://via.placeholder.com/50",
    rating: 5,
    comment: "Best seller I've dealt with! Professional and reliable.",
    date: "2025-10-05",
  },
];

const ReviewsTab = () => {
  const reviews = mockReviews;

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <MessageSquare size={64} className="text-gray-600 mb-4" />
        <h3 className="text-xl text-gray-400 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Customer reviews will appear here</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-600"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
          tabIndex={0}
          role="article"
          aria-label={`Review by ${review.reviewerName}`}
        >
          <div className="flex items-start gap-4">
            <img
              src={review.reviewerAvatar}
              alt={review.reviewerName}
              className="w-12 h-12 rounded-full bg-gray-700"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-white font-medium">
                    {review.reviewerName}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-gray-400 text-sm">
                      {formatDate(review.date)}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mt-3">{review.comment}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewsTab;
