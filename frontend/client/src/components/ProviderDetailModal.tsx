import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Award, DollarSign, Phone, Mail, ExternalLink } from "lucide-react";
import { VerificationBadge } from "./VerificationBadge";

interface ProviderDetailModalProps {
  providerId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookNow?: () => void;
}

export function ProviderDetailModal({
  providerId,
  open,
  onOpenChange,
  onBookNow,
}: ProviderDetailModalProps) {
  const { data: provider, isLoading } = trpc.providers.getById.useQuery({ id: providerId }, { enabled: open });
  const { data: reviews } = trpc.providers.getReviews.useQuery({ providerId }, { enabled: open });
  const { data: portfolio } = trpc.providers.getPortfolio.useQuery({ providerId }, { enabled: open });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!provider) return null;

  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{(provider as any).user?.name || "Provider"}</span>
            <VerificationBadge status={provider.verificationStatus} size="md" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating & Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < Math.floor(parseFloat(averageRating.toString())) ? "fill-accent text-accent" : "text-muted-foreground"}
                />
              ))}
            </div>
            <div>
              <p className="font-semibold">{averageRating} out of 5</p>
              <p className="text-sm text-muted-foreground">{reviews?.length || 0} reviews</p>
            </div>
          </div>

          {/* Bio */}
          {provider.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{provider.bio}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {provider.yearsOfExperience && (
              <div className="flex items-center gap-2">
                <Award size={16} className="text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="font-semibold">{provider.yearsOfExperience} years</p>
                </div>
              </div>
            )}
            {provider.hourlyRate && (
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                  <p className="font-semibold">${provider.hourlyRate}</p>
                </div>
              </div>
            )}
            {provider.serviceAreaRadius && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Service Radius</p>
                  <p className="font-semibold">{provider.serviceAreaRadius} miles</p>
                </div>
              </div>
            )}
          </div>

          {/* Certifications */}
          {(provider as any).certifications && (
            <div>
              <h3 className="font-semibold mb-2">Certifications</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{(provider as any).certifications}</p>
            </div>
          )}

          {/* Portfolio */}
          {portfolio && portfolio.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Portfolio</h3>
              <div className="grid grid-cols-3 gap-2">
                {portfolio.slice(0, 6).map((item) => (
                  <div key={item.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {item.mediaUrl && (
                      <img
                        src={item.mediaUrl}
                        alt={item.title || "Portfolio"}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          {reviews && reviews.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Recent Reviews</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {reviews.slice(0, 3).map((review) => (
                  <Card key={review.id} className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-sm">Customer</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? "fill-accent text-accent" : "text-muted-foreground"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1">
              <Mail size={16} className="mr-2" />
              Message
            </Button>
            <Button onClick={onBookNow} className="flex-1 btn-cinematic">
              <ExternalLink size={16} className="mr-2" />
              Book Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
