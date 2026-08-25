import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const providerProfileSchema = z.object({
  bio: z.string().min(10, "Bio must be at least 10 characters").optional().or(z.literal("")),
  yearsOfExperience: z.string().optional(),
  hourlyRate: z.string().optional(),
  serviceAreaRadius: z.string().optional(),
  serviceAreaLatitude: z.string().optional(),
  serviceAreaLongitude: z.string().optional(),
});

type ProviderProfileFormValues = z.infer<typeof providerProfileSchema>;

export function ProviderProfileForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingProfile } = trpc.providers.getProfile.useQuery();
  const createProfileMutation = trpc.providers.createProfile.useMutation();
  const updateProfileMutation = trpc.providers.updateProfile.useMutation();

  const form = useForm<ProviderProfileFormValues>({
    resolver: zodResolver(providerProfileSchema),
    defaultValues: {
      bio: existingProfile?.bio || "",
      yearsOfExperience: existingProfile?.yearsOfExperience?.toString() || "",
      hourlyRate: existingProfile?.hourlyRate?.toString() || "",
      serviceAreaRadius: existingProfile?.serviceAreaRadius?.toString() || "",
      serviceAreaLatitude: existingProfile?.serviceAreaLatitude?.toString() || "",
      serviceAreaLongitude: existingProfile?.serviceAreaLongitude?.toString() || "",
    },
  });

  async function onSubmit(values: ProviderProfileFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        bio: values.bio || undefined,
        yearsOfExperience: values.yearsOfExperience ? parseInt(values.yearsOfExperience) : undefined,
        hourlyRate: values.hourlyRate || undefined,
        serviceAreaRadius: values.serviceAreaRadius ? parseInt(values.serviceAreaRadius) : undefined,
        serviceAreaLatitude: values.serviceAreaLatitude || undefined,
        serviceAreaLongitude: values.serviceAreaLongitude || undefined,
      };

      if (existingProfile) {
        await updateProfileMutation.mutateAsync(payload);
        toast.success("Profile updated successfully!");
      } else {
        await createProfileMutation.mutateAsync(payload);
        toast.success("Profile created successfully!");
      }

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Provider Profile</CardTitle>
        <CardDescription>Build your professional profile to attract customers</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell customers about your experience and expertise..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 75" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="serviceAreaRadius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Area Radius (km)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceAreaLatitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00000001" placeholder="e.g., 40.7128" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceAreaLongitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.00000001" placeholder="e.g., -74.0060" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
