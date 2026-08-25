import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, MapPin, DollarSign, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function ProviderBookingManager() {
  const { data: bookings, isLoading } = trpc.bookings.getByProvider.useQuery();
  const acceptBooking = trpc.bookings.accept.useMutation();
  const declineBooking = trpc.bookings.decline.useMutation();
  const completeBooking = trpc.bookings.complete.useMutation();

  const handleAccept = async (bookingId: number) => {
    try {
      await acceptBooking.mutateAsync({ bookingId });
      toast.success("Booking accepted!");
    } catch (error) {
      toast.error("Failed to accept booking");
    }
  };

  const handleDecline = async (bookingId: number) => {
    try {
      await declineBooking.mutateAsync({ bookingId });
      toast.success("Booking declined");
    } catch (error) {
      toast.error("Failed to decline booking");
    }
  };

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

  const pending = bookings?.filter((b) => b.status === "pending") || [];
  const active = bookings?.filter((b) => b.status === "accepted") || [];
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
            </div>
            <Badge variant="outline">{booking.status}</Badge>
          </div>

          {booking.notes && (
            <div className="pt-3 border-t">
              <p className="text-sm font-semibold mb-1">Notes:</p>
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t">
            {booking.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleAccept(booking.id)}
                  disabled={acceptBooking.isPending}
                >
                  <CheckCircle size={16} className="mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(booking.id)}
                  disabled={declineBooking.isPending}
                >
                  <XCircle size={16} className="mr-1" />
                  Decline
                </Button>
              </>
            )}

            {booking.status === "accepted" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleComplete(booking.id)}
                  disabled={completeBooking.isPending}
                >
                  <CheckCircle size={16} className="mr-1" />
                  Mark Complete
                </Button>
              </>
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
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending">
          Pending ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Active ({active.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completed.length})
        </TabsTrigger>
      </TabsList>

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
  );
}
