import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, DollarSign, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface JobRecommendationsProps {
  providerId?: number;
  limit?: number;
}

export function JobRecommendations({ providerId, limit = 6 }: JobRecommendationsProps) {
  const { data: recommendations, isLoading } = trpc.matching.searchJobs.useQuery(
    { tradeCategoryId: 0, limit, offset: 0 },
    { enabled: true }
  ) as any;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No matching jobs at the moment</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.slice(0, limit).map((job: any) => (
        <Card key={job.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between gap-4">
            {/* Job Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{job.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {job.description}
                  </p>
                </div>
                {job.matchScore && (
                  <Badge className="ml-2 whitespace-nowrap">
                    <Zap size={12} className="mr-1" />
                    {Math.round(job.matchScore)}% Match
                  </Badge>
                )}
              </div>

              {/* Details Grid */}
              <div className="flex flex-wrap gap-3 text-xs">
                {job.budget && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign size={14} />
                    <span>${job.budget}</span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                )}
                {job.status && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {job.status}
                  </Badge>
                )}
              </div>

              {/* Posted Time */}
              <p className="text-xs text-muted-foreground">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="btn-cinematic whitespace-nowrap"
                onClick={() => toast.success("Bid submitted!")}
              >
                <Clock size={14} className="mr-1" />
                Bid Now
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Job saved!")}
              >
                Save
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {recommendations.length > limit && (
        <Button variant="outline" className="w-full">
          View all {recommendations.length} recommendations
        </Button>
      )}
    </div>
  );
}
