import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProviderDetailModal } from "./ProviderDetailModal";
import { VerificationBadge } from "./VerificationBadge";

export function SavedProviders() {
  const { data: savedProviders, isLoading } = trpc.providers.listVerified.useQuery({ limit: 100, offset: 0 }) as any;
  const removeSaved = trpc.providers.updateProfile.useMutation();
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRemove = async (providerId: number) => {
    try {
      await removeSaved.mutateAsync({ bio: "" } as any);
      toast.success("Provider removed from saved");
    } catch (error) {
      toast.error("Failed to remove provider");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (!savedProviders || savedProviders.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-4">No saved providers yet</p>
        <p className="text-sm text-muted-foreground">
          Save providers to quickly access their profiles and book jobs
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedProviders.map((provider: any) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{(provider as any).user?.name || "Provider"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {(provider as any).specializations?.join(", ") || "General"}
                  </p>
                </div>
                <VerificationBadge status={provider.verificationStatus} size="sm" />
              </div>

              {/* Rating */}
              {(provider as any).averageRating && (
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.floor((provider as any).averageRating) ? "fill-accent text-accent" : "text-muted-foreground"}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{(provider as any).averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({(provider as any).reviewCount || 0})</span>
                </div>
              )}

              {/* Details */}
              <div className="space-y-1 text-sm">
                {provider.hourlyRate && (
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">${provider.hourlyRate}</span>/hour
                  </p>
                )}
                {provider.serviceAreaRadius && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin size={14} />
                    <span>{provider.serviceAreaRadius} miles radius</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {provider.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProviderId(provider.id);
                    setModalOpen(true);
                  }}
                >
                  View Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(provider.id)}
                  disabled={removeSaved.isPending}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedProviderId && (
        <ProviderDetailModal
          providerId={selectedProviderId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </>
  );
}
