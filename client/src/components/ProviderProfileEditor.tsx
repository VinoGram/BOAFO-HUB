import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign, MapPin, Award } from "lucide-react";

const profileSchema = z.object({
  bio: z.string().optional().default(""),
  hourlyRate: z.string().optional().default(""),
  yearsOfExperience: z.string().optional().default(""),
  serviceRadius: z.string().optional().default(""),
  certifications: z.string().optional().default(""),
  specializations: z.array(z.string()).default([]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const TRADE_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry",
  "Painting",
  "Roofing",
  "Masonry",
  "Welding",
  "Landscaping",
  "General Contracting",
];

export function ProviderProfileEditor() {
  const { data: profile } = trpc.providers.getProfile.useQuery() as any;
  const updateProfile = trpc.providers.updateProfile.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    defaultValues: {
      bio: profile?.bio || "",
      hourlyRate: profile?.hourlyRate?.toString() || "",
      yearsOfExperience: profile?.yearsOfExperience?.toString() || "",
      serviceRadius: profile?.serviceRadius?.toString() || "",
      certifications: profile?.certifications || "",
      specializations: profile?.specializations || [],
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        bio: data.bio,
        hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
        yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : undefined,
        serviceRadius: data.serviceRadius ? parseInt(data.serviceRadius) : undefined,
        certifications: data.certifications,
        specializations: data.specializations,
      } as any);

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Profile</CardTitle>
        <CardDescription>Manage your professional information and specializations</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell customers about your experience and expertise..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This appears on your public profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Specializations */}
            <FormField
              control={form.control}
              name="specializations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Specializations</FormLabel>
                  <FormDescription>
                    Select all trades you're qualified for
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {TRADE_CATEGORIES.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={field.value?.includes(category)}
                          onCheckedChange={(checked) => {
                            const updated = checked
                              ? [...(field.value || []), category]
                              : (field.value || []).filter((c) => c !== category);
                            field.onChange(updated);
                          }}
                        />
                        <label
                          htmlFor={category}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hourly Rate */}
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign size={16} className="text-accent" />
                    Hourly Rate
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your standard hourly rate in USD
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Years of Experience */}
            <FormField
              control={form.control}
              name="yearsOfExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Award size={16} className="text-accent" />
                    Years of Experience
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="70"
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How many years have you been in this trade?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Radius */}
            <FormField
              control={form.control}
              name="serviceRadius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    Service Radius (miles)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="25"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How far are you willing to travel for jobs?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Certifications */}
            <FormField
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certifications & Licenses</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List your relevant certifications, licenses, and credentials..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter one certification per line
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || updateProfile.isPending}
              className="w-full"
            >
              {isSubmitting || updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
