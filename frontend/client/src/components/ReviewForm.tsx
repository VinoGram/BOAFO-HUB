import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Star } from "lucide-react";

const reviewSchema = z.object({
  bookingId: z.number(),
  providerId: z.number(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewForm({
  bookingId,
  providerId,
  onSuccess,
}: {
  bookingId: number;
  providerId: number;
  onSuccess?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);

  const createReviewMutation = trpc.reviews.create.useMutation();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      bookingId,
      providerId,
      rating: 5,
      title: "",
      comment: "",
    },
  });

  async function onSubmit(values: ReviewFormValues) {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await createReviewMutation.mutateAsync({
        bookingId,
        providerId,
        rating,
        title: values.title,
        comment: values.comment,
      });

      toast.success("Review submitted successfully!");
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>Share your experience with this provider</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <FormLabel>Rating</FormLabel>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      form.setValue("rating", star);
                    }}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && <p className="text-sm text-muted-foreground">{rating} out of 5 stars</p>}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Excellent work, highly recommend" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Share details about your experience..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting || rating === 0} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
