import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface DisputeResolutionProps {
  disputeId: number;
  onResolved?: () => void;
}

export function DisputeResolution({ disputeId, onResolved }: DisputeResolutionProps) {
  const { data: dispute, isLoading } = trpc.bookings.getById.useQuery({ id: disputeId }) as any;
  const resolveDispute = trpc.bookings.complete.useMutation();
  const [resolution, setResolution] = useState<"refund_customer" | "pay_provider" | "split_payment" | "dismiss">();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResolve = async () => {
    if (!resolution) {
      toast.error("Please select a resolution");
      return;
    }

    setIsSubmitting(true);
    try {
      await resolveDispute.mutateAsync({
        bookingId: disputeId,
      });
      toast.success("Dispute resolved successfully");
      onResolved?.();
    } catch (error) {
      toast.error("Failed to resolve dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (!dispute) return null;

  const statusIcon = {
    open: <AlertCircle className="w-5 h-5 text-destructive" />,
    in_review: <Clock className="w-5 h-5 text-yellow-500" />,
    resolved: <CheckCircle className="w-5 h-5 text-green-500" />,
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {statusIcon[dispute.status as keyof typeof statusIcon]}
            <h3 className="font-semibold text-lg">Dispute #{dispute.id}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Created {new Date(dispute.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className="capitalize">{dispute.status.replace("_", " ")}</Badge>
      </div>

      {/* Dispute Details */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Booking ID</p>
          <p className="font-semibold">#{dispute.bookingId}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Amount</p>
          <p className="font-semibold flex items-center gap-1">
            <DollarSign size={14} />
            {(dispute as any).amount || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Customer</p>
          <p className="font-semibold">{(dispute as any).customerName || "Unknown"}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Provider</p>
          <p className="font-semibold">{(dispute as any).providerName || "Unknown"}</p>
        </div>
      </div>

      {/* Issue Description */}
      <div>
        <p className="font-semibold text-sm mb-2">Issue Description</p>
        <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
          {dispute.reason || "No description provided"}
        </p>
      </div>

      {/* Customer Evidence */}
      {(dispute as any).customerEvidence && (
        <div>
          <p className="font-semibold text-sm mb-2">Customer Evidence</p>
          <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
            {(dispute as any).customerEvidence}
          </p>
        </div>
      )}

      {/* Provider Response */}
      {(dispute as any).providerResponse && (
        <div>
          <p className="font-semibold text-sm mb-2">Provider Response</p>
          <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
            {(dispute as any).providerResponse}
          </p>
        </div>
      )}

      {/* Resolution Section */}
      {dispute.status !== "resolved" && (
        <div className="space-y-4 p-4 bg-accent/5 rounded border border-accent/20">
          <p className="font-semibold text-sm">Resolution</p>

          {/* Resolution Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Resolution</label>
            <Select value={resolution} onValueChange={(val: any) => setResolution(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose resolution..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refund_customer">Full Refund to Customer</SelectItem>
                <SelectItem value="pay_provider">Full Payment to Provider</SelectItem>
                <SelectItem value="split_payment">Split Payment (50/50)</SelectItem>
                <SelectItem value="dismiss">Dismiss Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution Notes</label>
            <Textarea
              placeholder="Explain the reasoning behind this resolution..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleResolve}
              disabled={!resolution || isSubmitting}
              className="flex-1 btn-cinematic"
            >
              {isSubmitting ? "Resolving..." : "Resolve Dispute"}
            </Button>
          </div>
        </div>
      )}

      {/* Resolved Info */}
      {dispute.status === "resolved" && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Dispute Resolved</p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {dispute?.status || "N/A"}
              </p>
              {notes && (
                <p className="text-xs text-muted-foreground mt-2">{notes}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
