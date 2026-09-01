import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { providersApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Trash2, Edit2, Plus, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PortfolioManager() {
  const qc = useQueryClient();
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["my-provider-portfolio"],
    queryFn: providersApi.getMyPortfolio,
  });

  const addPortfolioItem = useMutation({
    mutationFn: (formData: FormData) => providersApi.uploadPortfolioItem(formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-provider-portfolio"] }),
  });

  const deletePortfolioItem = useMutation({
    mutationFn: (itemId: number) => providersApi.deletePortfolioItem(itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-provider-portfolio"] }),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddItem = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) {
      toast.error("Please enter a title");
      return;
    }
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("mediaType", mediaType);
      formData.append("file", file);

      await addPortfolioItem.mutateAsync(formData);
      toast.success("Portfolio item added");
      setTitle("");
      setDescription("");
      setFile(null);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to add portfolio item");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deletePortfolioItem.mutateAsync(itemId);
      toast.success("Portfolio item deleted");
    } catch (error) {
      toast.error("Failed to delete portfolio item");
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add New Item */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="btn-cinematic">
            <Plus size={16} className="mr-2" />
            Add Portfolio Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Portfolio Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="e.g., Kitchen Renovation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Describe the project, materials used, timeline, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Media Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mediaType === "image" ? "default" : "outline"}
                  onClick={() => setMediaType("image")}
                  className="flex-1"
                >
                  <ImageIcon size={16} className="mr-2" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant={mediaType === "video" ? "default" : "outline"}
                  onClick={() => setMediaType("video")}
                  className="flex-1"
                >
                  <Video size={16} className="mr-2" />
                  Video
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Upload File</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition">
                <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select an image or video file (video only one item allowed)</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-3 w-full text-sm"
                />
              </div>
            </div>
            <Button type="submit" disabled={isUploading} className="w-full btn-cinematic">
              {isUploading ? "Uploading..." : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Portfolio Grid */}
      {portfolio && portfolio.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              {/* Media Preview */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {item.mediaUrl ? (
                  item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title || "Portfolio"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <video
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.mediaType === "image" ? (
                      <ImageIcon size={48} className="text-muted-foreground" />
                    ) : (
                      <Video size={48} className="text-muted-foreground" />
                    )}
                  </div>
                )}
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement edit
                    }}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <div>
                  <p className="font-semibold text-sm line-clamp-1">{item.title}</p>
                  <Badge variant="outline" className="text-xs capitalize mt-1">
                    {item.mediaType}
                  </Badge>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-4">No portfolio items yet</p>
          <p className="text-sm text-muted-foreground">
            Add photos and videos of your completed projects to showcase your work
          </p>
        </Card>
      )}
    </div>
  );
}
