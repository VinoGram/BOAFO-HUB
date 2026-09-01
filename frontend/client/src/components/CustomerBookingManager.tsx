import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewForm } from "./ReviewForm";
import { Clock, MapPin, DollarSign, MessageSquare, Star, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function CustomerBookingManager() {
  const { data: bookings, isLoading } = trpc.bookings.getByCustomer.useQuery();
  const completeBooking = trpc.bookings.complete.useMutation();
  const [reviewingBookingId, setReviewingBookingId] = useState<number | null>(null);

  const handleComplete = async (bookingId: number) => {
    try {
      await completeBooking.mutateAsync({ bookingId });
      toast.success("Job marked as complete!");
    } catch (error) {
      toast.error("Failed to complete booking");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const active = bookings?.filter((b) => b.status === "accepted") || [];
  const pending = bookings?.filter((b) => b.status === "pending") || [];
  const completed = bookings?.filter((b) => b.status === "completed") || [];

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{booking.job?.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{booking.job?.description}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {booking.scheduledStartTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    <span>{new Date(booking.scheduledStartTime).toLocaleDateString()}</span>
                  </div>
                )}
                {booking.job?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    <span>{booking.job.location}</span>
                  </div>
                )}
                {booking.quotedPrice && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-accent" />
                    <span>${booking.quotedPrice}</span>
                  </div>
                )}
              </div>

              {booking.provider && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold mb-1">Provider:</p>
                  <p className="text-sm text-muted-foreground">{booking.provider.bio || "Professional"}</p>
                </div>
              )}
            </div>
            <Badge variant="outline">{booking.status}</Badge>
          </div>

          <div className="flex gap-2 pt-3 border-t">
            {booking.status === "accepted" && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleComplete(booking.id)}
                disabled={completeBooking.isPending}
              >
                <CheckCircle size={16} className="mr-1" />
                Mark Complete
              </Button>
            )}

            {booking.status === "completed" && !booking.review && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setReviewingBookingId(booking.id)}
              >
                <Star size={16} className="mr-1" />
                Leave Review
              </Button>
            )}

            <Button size="sm" variant="outline">
              <MessageSquare size={16} className="mr-1" />
              Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {active.length > 0 ? (
            active.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No active bookings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pending.length > 0 ? (
            pending.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No pending bookings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completed.length > 0 ? (
            completed.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No completed bookings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {reviewingBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
              <CardDescription>Share your experience with this provider</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm
                bookingId={reviewingBookingId}
                providerId={bookings?.find(b => b.id === reviewingBookingId)?.providerId || 0}
                onSuccess={() => setReviewingBookingId(null)}
              />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setReviewingBookingId(null)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
