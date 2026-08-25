import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";

interface JobSearchFiltersProps {
  onFiltersChange: (filters: JobFilters) => void;
  categories: Array<{ id: number; name: string }>;
}

export interface JobFilters {
  searchQuery: string;
  categoryId?: number;
  minBudget?: number;
  maxBudget?: number;
  status?: "open" | "in_progress" | "completed";
  sortBy?: "newest" | "budget_high" | "budget_low" | "urgent";
  distance?: number;
}

export function JobSearchFilters({ onFiltersChange, categories }: JobSearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    searchQuery: "",
    sortBy: "newest",
  });

  const handleFilterChange = (newFilters: Partial<JobFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const handleReset = () => {
    const defaultFilters: JobFilters = { searchQuery: "", sortBy: "newest" };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.minBudget ||
    filters.maxBudget ||
    filters.status ||
    filters.distance ||
    (filters.searchQuery && filters.searchQuery.length > 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search jobs by title or description..."
          value={filters.searchQuery}
          onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className={hasActiveFilters ? "ring-2 ring-accent" : ""}
        >
          <Filter size={18} />
        </Button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-destructive"
              >
                <X size={16} className="mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <Label>Trade Category</Label>
              <Select
                value={filters.categoryId?.toString() || ""}
                onValueChange={(value) =>
                  handleFilterChange({ categoryId: value ? parseInt(value) : undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Job Status</Label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  handleFilterChange({ status: (value as any) || undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy || "newest"}
                onValueChange={(value) => handleFilterChange({ sortBy: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="budget_high">Highest Budget</SelectItem>
                  <SelectItem value="budget_low">Lowest Budget</SelectItem>
                  <SelectItem value="urgent">Most Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget Range */}
            <div className="space-y-4">
              <Label>Budget Range</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minBudget || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        minBudget: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBudget || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        maxBudget: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                {filters.minBudget && filters.maxBudget && (
                  <p className="text-sm text-muted-foreground">
                    ${filters.minBudget} - ${filters.maxBudget}
                  </p>
                )}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-4">
              <Label>Distance: {filters.distance || "Any"} miles</Label>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[filters.distance || 0]}
                onValueChange={(value) =>
                  handleFilterChange({ distance: value[0] || undefined })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Apply Button */}
          <Button
            onClick={() => setIsOpen(false)}
            className="w-full btn-cinematic"
          >
            Apply Filters
          </Button>
        </Card>
      )}
    </div>
  );
}
