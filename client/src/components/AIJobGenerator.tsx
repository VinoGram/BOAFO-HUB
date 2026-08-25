import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Upload, Sparkles, RefreshCw, Check, AlertCircle } from "lucide-react";

interface GeneratedJob {
  title: string;
  description: string;
  issueType: string;
  severity: "low" | "medium" | "high";
  estimatedBudget: {
    min: number;
    max: number;
  };
  suggestedCategories: string[];
  materials: string[];
  timeEstimate: string;
  confidence: number;
  warnings: string[];
}

export function AIJobGenerator() {
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [generated, setGenerated] = useState<GeneratedJob | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [alternatives, setAlternatives] = useState<Array<{ title: string; description: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = trpc.aiGenerator.generateFromPhoto.useMutation();
  const refineMutation = trpc.aiGenerator.refineDescription.useMutation();
  const alternativesMutation = trpc.aiGenerator.generateAlternatives.useMutation();
  const createJobMutation = trpc.jobs.create.useMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!imageUrl) {
      toast.error("Please upload a photo first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateMutation.mutateAsync({
        imageUrl,
        location: location || undefined,
      });

      if (result.success && result.analysis) {
        setGenerated(result.analysis);
        setEditedTitle(result.analysis.title);
        setEditedDescription(result.analysis.description);
        toast.success("Job description generated!");
      }
    } catch (error) {
      toast.error("Failed to generate job description");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (request: string) => {
    if (!editedTitle || !editedDescription) return;

    try {
      const result = await refineMutation.mutateAsync({
        currentTitle: editedTitle,
        currentDescription: editedDescription,
        refinementRequest: request,
      });

      if (result.success && result.refined) {
        setEditedTitle(result.refined.title);
        setEditedDescription(result.refined.description);
        toast.success("Description refined!");
      }
    } catch (error) {
      toast.error("Failed to refine description");
    }
  };

  const handleGenerateAlternatives = async () => {
    if (!generated || !imageUrl) return;

    try {
      const result = await alternativesMutation.mutateAsync({
        imageUrl,
        originalAnalysis: {
          title: generated.title,
          description: generated.description,
          issueType: generated.issueType,
        },
      });

      if (result.success && result.alternatives) {
        setAlternatives(result.alternatives);
        setShowAlternatives(true);
        toast.success("Alternatives generated!");
      }
    } catch (error) {
      toast.error("Failed to generate alternatives");
    }
  };

  const selectAlternative = (alt: { title: string; description: string }) => {
    setEditedTitle(alt.title);
    setEditedDescription(alt.description);
    setShowAlternatives(false);
    toast.success("Alternative selected!");
  };

  const handlePostJob = async () => {
    if (!editedTitle || !editedDescription || !generated) {
      toast.error("Please generate a job description first");
      return;
    }

    setIsPosting(true);
    try {
      await createJobMutation.mutateAsync({
        title: editedTitle,
        description: editedDescription,
        tradeCategoryId: 1,
        budget: String((generated.estimatedBudget.min + generated.estimatedBudget.max) / 2),
        latitude: "0",
        longitude: "0",
      });

      toast.success("Job posted successfully!");
      setImageUrl("");
      setGenerated(null);
      setEditedTitle("");
      setEditedDescription("");
    } catch (error) {
      toast.error("Failed to post job");
    } finally {
      setIsPosting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Job Description Generator
        </h3>

        <div className="space-y-4">
          {/* Image Preview */}
          {imageUrl && (
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Issue preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setImageUrl("");
                  setGenerated(null);
                }}
                className="absolute top-2 right-2 bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {imageUrl ? "Change Photo" : "Upload Photo of Issue"}
            </Button>
          </div>

          {/* Location Input */}
          <Input
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!imageUrl || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Analyzing..." : "Generate Job Description"}
          </Button>
        </div>
      </Card>

      {/* Generated Content */}
      {generated && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Issue Type</h4>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{generated.issueType}</Badge>
                <Badge variant={getSeverityColor(generated.severity)}>
                  {generated.severity.toUpperCase()}
                </Badge>
                <Badge variant={generated.confidence >= 0.8 ? "outline" : "secondary"} className="flex items-center gap-1">
                  {generated.confidence >= 0.8 ? "✓" : <AlertCircle className="w-3 h-3" />}
                  {Math.round(generated.confidence * 100)}% confident
                </Badge>
              </div>
            </div>
          </div>

          {/* Editable Title */}
          <div>
            <label className="text-sm font-medium">Job Title</label>
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Editable Description */}
          <div>
            <label className="text-sm font-medium">Job Description</label>
            <Textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="mt-1 min-h-24"
            />
          </div>

          {/* Budget & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Estimated Budget</label>
              <div className="mt-1 p-2 bg-muted rounded">
                ${generated.estimatedBudget.min} - ${generated.estimatedBudget.max}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Time Estimate</label>
              <div className="mt-1 p-2 bg-muted rounded">{generated.timeEstimate}</div>
            </div>
          </div>

          {/* Suggested Categories */}
          {generated.suggestedCategories.length > 0 && (
            <div>
              <label className="text-sm font-medium">Suggested Categories</label>
              <div className="flex gap-2 flex-wrap mt-2">
                {generated.suggestedCategories.map((cat) => (
                  <Badge key={cat} variant="secondary">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Materials */}
          {generated.materials.length > 0 && (
            <div>
              <label className="text-sm font-medium">Likely Materials Needed</label>
              <div className="flex gap-2 flex-wrap mt-2">
                {generated.materials.map((mat) => (
                  <Badge key={mat} variant="outline">
                    {mat}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {generated.warnings.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-1">⚠️ Important Notes:</p>
              <ul className="text-sm text-destructive/80 space-y-1">
                {generated.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleGenerateAlternatives}
              disabled={alternativesMutation.isPending}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              See Alternatives
            </Button>
            <Button
              onClick={handlePostJob}
              disabled={isPosting || createJobMutation.isPending}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              {isPosting ? "Posting..." : "Post This Job"}
            </Button>
          </div>

          {/* Quick Refinement Suggestions */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Quick Refinements:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefine("Make it more detailed and specific")}
              >
                More Detail
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefine("Make it shorter and more concise")}
              >
                Shorter
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRefine("Make it more professional and formal")}
              >
                Professional Tone
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alternatives Display */}
      {showAlternatives && alternatives.length > 0 && (
        <Card className="p-6 space-y-4">
          <h4 className="font-semibold">Alternative Descriptions</h4>
          {alternatives.map((alt, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 cursor-pointer transition">
              <h5 className="font-medium">{alt.title}</h5>
              <p className="text-sm text-muted-foreground">{alt.description}</p>
              <Button size="sm" onClick={() => selectAlternative(alt)}>
                Use This Version
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
