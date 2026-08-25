import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Clock, DollarSign } from "lucide-react";

const bookingSchema = z.object({
  providerId: z.number(),
  jobId: z.number(),
  preferredDate: z.string(),
  preferredTime: z.string().optional(),
  estimatedDuration: z.string().optional(),
  notes: z.string().optional(),
  proposedBudget: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingRequestFormProps {
  jobId: number;
  providerId: number;
  jobBudget?: number;
  onSuccess?: () => void;
}

export function BookingRequestForm({
  jobId,
  providerId,
  jobBudget,
  onSuccess,
}: BookingRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createBooking = trpc.bookings.create.useMutation();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      providerId,
      jobId,
      preferredDate: new Date().toISOString().split("T")[0],
      preferredTime: "09:00",
      estimatedDuration: "2",
      proposedBudget: jobBudget?.toString(),
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    try {
      const startDate = new Date(data.preferredDate);
      if (data.preferredTime) {
        const [hours, minutes] = data.preferredTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
      }

      const endDate = new Date(startDate);
      if (data.estimatedDuration) {
        endDate.setHours(endDate.getHours() + parseInt(data.estimatedDuration));
      }

      await createBooking.mutateAsync({
        jobId: data.jobId,
        providerId: data.providerId,
        scheduledStartTime: startDate,
        scheduledEndTime: endDate,
        quotedPrice: data.proposedBudget,
        notes: data.notes,
      });

      toast.success("Booking request sent! The provider will review it shortly.");
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Booking</CardTitle>
        <CardDescription>Schedule a job with this provider</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent" />
                    Preferred Date
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    Preferred Time
                  </FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormDescription>What time works best for you?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Duration (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0.5" step="0.5" placeholder="2" {...field} />
                  </FormControl>
                  <FormDescription>How long do you expect this job to take?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Budget */}
            <FormField
              control={form.control}
              name="proposedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign size={16} className="text-accent" />
                    Proposed Budget
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  {jobBudget && (
                    <FormDescription>Original job budget: ${jobBudget}</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share any special requirements, access instructions, or other details..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help the provider understand your needs better
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || createBooking.isPending}
              className="w-full"
            >
              {isSubmitting || createBooking.isPending ? "Sending Request..." : "Send Booking Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
