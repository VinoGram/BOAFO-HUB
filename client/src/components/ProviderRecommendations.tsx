import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Zap, Heart } from "lucide-react";
import { toast } from "sonner";
import { ProviderDetailModal } from "./ProviderDetailModal";
import { VerificationBadge } from "./VerificationBadge";

interface ProviderRecommendationsProps {
  jobId?: number;
  category?: string;
  limit?: number;
}

export function ProviderRecommendations({
  jobId,
  category,
  limit = 6,
}: ProviderRecommendationsProps) {
  const { data: recommendations, isLoading } = trpc.matching.smartMatch.useQuery(
    { jobId: jobId || 0 },
    { enabled: !!jobId || !!category }
  ) as any;

  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-80 w-full" />
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mb-2">No providers found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search criteria or check back later
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((provider: any) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Header */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {provider.user?.name || "Provider"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {provider.specializations?.slice(0, 2).join(", ") || "General"}
                  </p>
                </div>
                <VerificationBadge status={provider.verificationStatus} size="sm" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.floor(provider.averageRating || 0)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold">{(provider.averageRating || 0).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({provider.reviewCount || 0})</span>
              </div>

              {/* Match Score */}
              {provider.matchScore && (
                <div className="flex items-center gap-2 p-2 bg-accent/10 rounded">
                  <Zap size={14} className="text-accent" />
                  <span className="text-xs font-semibold text-accent">
                    {Math.round(provider.matchScore)}% Match
                  </span>
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
                    <span>{provider.serviceAreaRadius} miles away</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {provider.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{provider.bio}</p>
              )}

              {/* Experience */}
              {provider.yearsOfExperience && (
                <Badge variant="outline" className="text-xs">
                  {provider.yearsOfExperience} years experience
                </Badge>
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
                  size="sm"
                  className="flex-1 btn-cinematic"
                  onClick={() => toast.success("Added to favorites!")}
                >
                  <Heart size={14} className="mr-1" />
                  Save
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
