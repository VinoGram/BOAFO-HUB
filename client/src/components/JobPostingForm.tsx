import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const jobPostingSchema = z.object({
  tradeCategoryId: z.number().min(1, "Please select a trade category"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  budget: z.string().optional(),
  location: z.string().optional(),
  preferredStartDate: z.string().optional(),
});

type JobPostingFormValues = z.infer<typeof jobPostingSchema>;

export function JobPostingForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();
  const createJobMutation = trpc.jobs.create.useMutation();

  const form = useForm<JobPostingFormValues>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      tradeCategoryId: 0,
      title: "",
      description: "",
      budget: "",
      location: "",
      preferredStartDate: "",
    },
  });

  async function onSubmit(values: JobPostingFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createJobMutation.mutateAsync({
        tradeCategoryId: values.tradeCategoryId,
        title: values.title,
        description: values.description,
        budget: values.budget,
        location: values.location,
        preferredStartDate: values.preferredStartDate ? new Date(values.preferredStartDate) : undefined,
      });

      if (result.success) {
        toast.success("Job posted successfully!");
        form.reset();
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to post job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Post a New Job</CardTitle>
        <CardDescription>Describe the work you need done and get matched with verified providers</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tradeCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Category</FormLabel>
                  <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trade category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="0" disabled>
                          Loading categories...
                        </SelectItem>
                      ) : (
                        categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fix leaky kitchen faucet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the work in detail..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St, City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Start Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Posting..." : "Post Job"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
