import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, Award, MapPin } from "lucide-react";
import { toast } from "sonner";

export function VerificationQueue() {
  const { data: pendingProviders, isLoading } = trpc.providers.listVerified.useQuery({ limit: 100, offset: 0 }) as any;
  const approveProvider = trpc.providers.updateProfile.useMutation();
  const rejectProvider = trpc.providers.updateProfile.useMutation();
  const [rejectionReason, setRejectionReason] = useState<{ [key: number]: string }>({});

  const handleApprove = async (providerId: number) => {
    try {
      await approveProvider.mutateAsync({ bio: "Approved" } as any);
      toast.success("Provider approved!");
    } catch (error) {
      toast.error("Failed to approve provider");
    }
  };

  const handleReject = async (providerId: number) => {
    if (!rejectionReason[providerId]?.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await rejectProvider.mutateAsync({
        bio: rejectionReason[providerId],
      } as any);
      toast.success("Provider rejected");
      setRejectionReason((prev) => {
        const updated = { ...prev };
        delete updated[providerId];
        return updated;
      });
    } catch (error) {
      toast.error("Failed to reject provider");
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

  const pending = pendingProviders?.filter((p: any) => p.verificationStatus === "pending") || [];
  const approved = pendingProviders?.filter((p: any) => p.verificationStatus === "verified") || [];
  const rejected = pendingProviders?.filter((p: any) => p.verificationStatus === "rejected") || [];

  const ProviderCard = ({ provider, showActions = true }: { provider: any; showActions?: boolean }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{provider.user?.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{provider.bio}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {provider.yearsOfExperience && (
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-accent" />
                    <span>{provider.yearsOfExperience} years experience</span>
                  </div>
                )}
                {provider.specializations && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{provider.specializations.join(", ")}</span>
                  </div>
                )}
                {provider.serviceRadius && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    <span>{provider.serviceRadius} miles radius</span>
                  </div>
                )}
              </div>

              {provider.certifications && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm font-semibold mb-1">Certifications:</p>
                  <p className="text-sm text-muted-foreground">{provider.certifications}</p>
                </div>
              )}
            </div>
            <Badge variant="outline">{provider.verificationStatus}</Badge>
          </div>

          {showActions && provider.verificationStatus === "pending" && (
            <div className="pt-3 border-t space-y-3">
              <Textarea
                placeholder="Rejection reason (if applicable)..."
                value={rejectionReason[provider.id] || ""}
                onChange={(e) =>
                  setRejectionReason((prev) => ({
                    ...prev,
                    [provider.id]: e.target.value,
                  }))
                }
                className="min-h-20"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(provider.id)}
                  disabled={approveProvider.isPending}
                >
                  <CheckCircle size={16} className="mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(provider.id)}
                  disabled={rejectProvider.isPending}
                >
                  <XCircle size={16} className="mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
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
        <TabsTrigger value="approved">
          Approved ({approved.length})
        </TabsTrigger>
        <TabsTrigger value="rejected">
          Rejected ({rejected.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pending.length > 0 ? (
          pending.map((provider: any) => (
            <ProviderCard key={provider.id} provider={provider} showActions={true} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No pending verifications</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="approved" className="space-y-4">
        {approved.length > 0 ? (
          approved.map((provider: any) => (
            <ProviderCard key={provider.id} provider={provider} showActions={false} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No approved providers</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="rejected" className="space-y-4">
        {rejected.length > 0 ? (
          rejected.map((provider: any) => (
            <ProviderCard key={provider.id} provider={provider} showActions={false} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No rejected providers</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
