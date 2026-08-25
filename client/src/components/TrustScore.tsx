import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Award, Users, TrendingUp, Shield } from "lucide-react";

interface TrustScoreProps {
  score: number; // 0-100
  verificationStatus: "unverified" | "pending" | "id_verified" | "certified" | "community_vouched";
  averageRating: number;
  reviewCount: number;
  completedJobs: number;
  yearsOfExperience?: number;
}

export function TrustScore({
  score,
  verificationStatus,
  averageRating,
  reviewCount,
  completedJobs,
  yearsOfExperience,
}: TrustScoreProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-blue-500";
    if (s >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (s: number) => {
    if (s >= 80) return "bg-green-500/10";
    if (s >= 60) return "bg-blue-500/10";
    if (s >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Main Score */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Trust Score</p>
          <p className="text-3xl font-bold">{score}/100</p>
          <p className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </p>
        </div>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreBgColor(score)}`}>
          <div className="text-center">
            <Shield className={`w-8 h-8 mx-auto mb-1 ${getScoreColor(score)}`} />
            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <p className="font-semibold text-sm">Score Factors</p>
        <div className="space-y-2">
          {/* Rating */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-accent" />
              <span className="text-sm">Rating</span>
            </div>
            <Badge variant="outline">{averageRating.toFixed(1)} ★</Badge>
          </div>

          {/* Verification */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-accent" />
              <span className="text-sm">Verification</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {verificationStatus.replace("_", " ")}
            </Badge>
          </div>

          {/* Completed Jobs */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <span className="text-sm">Completed Jobs</span>
            </div>
            <Badge variant="outline">{completedJobs}</Badge>
          </div>

          {/* Reviews */}
          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-accent" />
              <span className="text-sm">Reviews</span>
            </div>
            <Badge variant="outline">{reviewCount}</Badge>
          </div>

          {/* Experience */}
          {yearsOfExperience && (
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-accent" />
                <span className="text-sm">Experience</span>
              </div>
              <Badge variant="outline">{yearsOfExperience} years</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Score Info */}
      <div className="p-3 bg-muted/50 rounded text-sm text-muted-foreground">
        <p className="font-semibold mb-1">How Trust Score is Calculated</p>
        <ul className="space-y-1 text-xs">
          <li>• Rating: 30% (customer reviews)</li>
          <li>• Verification: 25% (ID, certifications)</li>
          <li>• Experience: 20% (years in trade)</li>
          <li>• Completed Jobs: 15% (job history)</li>
          <li>• Response Time: 10% (booking acceptance)</li>
        </ul>
      </div>
    </Card>
  );
}
