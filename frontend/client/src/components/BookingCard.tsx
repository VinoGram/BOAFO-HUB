import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";
// Type will be inferred from API response

interface BookingCardProps {
  booking: any; // Booking type from API
  isProvider?: boolean;
  onStatusChange?: () => void;
}

export function BookingCard({ booking, isProvider = false, onStatusChange }: BookingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const acceptMutation = trpc.bookings.accept.useMutation();
  const declineMutation = trpc.bookings.decline.useMutation();
  const completeMutation = trpc.bookings.complete.useMutation();

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-blue-100 text-blue-800",
    declined: "bg-red-100 text-red-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  async function handleAccept() {
    setIsLoading(true);
    try {
      await acceptMutation.mutateAsync({ bookingId: booking.id });
      toast.success("Booking accepted!");
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept booking");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDecline() {
    setIsLoading(true);
    try {
      await declineMutation.mutateAsync({ bookingId: booking.id });
      toast.success("Booking declined");
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to decline booking");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleComplete() {
    setIsLoading(true);
    try {
      await completeMutation.mutateAsync({ bookingId: booking.id });
      toast.success("Job marked as complete!");
      onStatusChange?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete job");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{booking.job?.title || "Job"}</CardTitle>
            <CardDescription>{booking.job?.description?.substring(0, 100)}...</CardDescription>
          </div>
          <Badge className={statusColors[booking.status] || "bg-gray-100"}>
            {booking.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {booking.quotedPrice && (
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-muted-foreground" />
              <span>${booking.quotedPrice}</span>
            </div>
          )}

          {booking.scheduledStartTime && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-muted-foreground" />
              <span>{new Date(booking.scheduledStartTime).toLocaleDateString()}</span>
            </div>
          )}

          {booking.job?.location && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin size={16} className="text-muted-foreground" />
              <span>{booking.job.location}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-semibold mb-1">Notes:</p>
            <p>{booking.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isProvider && booking.status === "pending" && (
            <>
              <Button
                onClick={handleAccept}
                disabled={isLoading}
                className="flex-1"
                variant="default"
              >
                Accept
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isLoading}
                className="flex-1"
                variant="outline"
              >
                Decline
              </Button>
            </>
          )}

          {!isProvider && booking.status === "completed" && (
            <Button onClick={handleComplete} disabled={isLoading} className="w-full">
              Confirm Completion
            </Button>
          )}

          {booking.status === "accepted" && (
            <Button variant="outline" className="w-full">
              Message Provider
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
