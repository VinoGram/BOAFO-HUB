import { CheckCircle, Award, Users, AlertCircle } from "lucide-react";

interface VerificationBadgeProps {
  status: "unverified" | "pending" | "id_verified" | "certified" | "community_vouched";
  size?: "sm" | "md" | "lg";
}

export function VerificationBadge({ status, size = "md" }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSize = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  switch (status) {
    case "certified":
      return (
        <div className={`badge-certified ${sizeClasses[size]} inline-flex items-center gap-1`}>
          <Award className={iconSize[size]} />
          <span>Certified Professional</span>
        </div>
      );
    case "id_verified":
      return (
        <div className={`badge-verified ${sizeClasses[size]} inline-flex items-center gap-1`}>
          <CheckCircle className={iconSize[size]} />
          <span>ID Verified</span>
        </div>
      );
    case "community_vouched":
      return (
        <div className={`badge-community ${sizeClasses[size]} inline-flex items-center gap-1`}>
          <Users className={iconSize[size]} />
          <span>Community Vouched</span>
        </div>
      );
    case "pending":
      return (
        <div className={`${sizeClasses[size]} inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-sm font-medium`}>
          <AlertCircle className={iconSize[size]} />
          <span>Verification Pending</span>
        </div>
      );
    default:
      return (
        <div className={`${sizeClasses[size]} inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-sm font-medium`}>
          <AlertCircle className={iconSize[size]} />
          <span>Unverified</span>
        </div>
      );
  }
}
