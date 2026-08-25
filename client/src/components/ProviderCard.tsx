import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle, Award, Users } from "lucide-react";

interface ProviderCardProps {
  id: number;
  name: string;
  title: string;
  profilePictureUrl?: string;
  averageRating: number;
  totalReviews: number;
  verificationStatus: "unverified" | "pending" | "id_verified" | "certified" | "community_vouched";
  location: string;
  hourlyRate?: number;
  bio?: string;
  onClick?: () => void;
}

export function ProviderCard({
  id,
  name,
  title,
  profilePictureUrl,
  averageRating,
  totalReviews,
  verificationStatus,
  location,
  hourlyRate,
  bio,
  onClick,
}: ProviderCardProps) {
  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "certified":
        return (
          <div className="badge-certified">
            <Award className="w-4 h-4" />
            <span>Certified</span>
          </div>
        );
      case "id_verified":
        return (
          <div className="badge-verified">
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </div>
        );
      case "community_vouched":
        return (
          <div className="badge-community">
            <Users className="w-4 h-4" />
            <span>Community Vouched</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="card-cinematic overflow-hidden cursor-pointer" onClick={onClick}>
      {/* Header with image */}
      <div className="relative h-40 bg-gradient-to-br from-accent/20 to-destructive/20">
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            👤
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Name and verification */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
          {getVerificationBadge()}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(averageRating)
                    ? "fill-accent text-accent"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{bio}</p>
        )}

        {/* Footer with rate and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-border/20">
          {hourlyRate && (
            <div className="text-sm">
              <span className="text-accent font-bold">${hourlyRate}</span>
              <span className="text-muted-foreground">/hour</span>
            </div>
          )}
          <Button
            size="sm"
            className="btn-cinematic"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
