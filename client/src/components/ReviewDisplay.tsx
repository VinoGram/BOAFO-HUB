import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ThumbsUp, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewDisplayProps {
  providerId: number;
  limit?: number;
}

export function ReviewDisplay({ providerId, limit = 5 }: ReviewDisplayProps) {
  const { data: reviews, isLoading } = trpc.providers.getReviews.useQuery({ providerId });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No reviews yet</p>
      </Card>
    );
  }

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  const ratingDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{averageRating}</span>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(parseFloat(averageRating)) ? "fill-accent text-accent" : "text-muted-foreground"}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-4">{rating}★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${(ratingDistribution[rating as keyof typeof ratingDistribution] / reviews.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">
                {ratingDistribution[rating as keyof typeof ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-3">
        <h3 className="font-semibold">Latest Reviews</h3>
        {reviews.slice(0, limit).map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{review.rating} out of 5</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              {review.isVerified && (
                <Badge variant="outline" className="text-xs">
                  Verified Purchase
                </Badge>
              )}
            </div>

            {review.title && (
              <p className="font-semibold text-sm mb-1">{review.title}</p>
            )}

            {review.comment && (
              <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
            )}

            {/* Review Actions */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" className="text-xs">
                <ThumbsUp size={14} className="mr-1" />
                Helpful
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-destructive">
                <Flag size={14} className="mr-1" />
                Report
              </Button>
            </div>
          </Card>
        ))}

        {reviews.length > limit && (
          <Button variant="outline" className="w-full">
            View all {reviews.length} reviews
          </Button>
        )}
      </div>
    </div>
  );
}
