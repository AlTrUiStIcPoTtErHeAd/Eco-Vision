"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
import { createPost, ApiError } from "@/lib/api";
import { toast } from "sonner";

export default function CreatePostPage() {
  const router = useRouter();
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [wasteType, setWasteType] = useState("");
  const [recycled, setRecycled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!beforeImage || !afterImage) {
      toast.error("Please upload both before and after images");
      return;
    }

    if (!wasteType.trim()) {
      toast.error("Please enter the waste type");
      return;
    }

    setIsLoading(true);

    try {
      await createPost({
        before_image: beforeImage,
        after_image: afterImage,
        waste_type: wasteType,
        recycled,
      });
      toast.success("Post created successfully!", {
        description: "Your recycling journey has been shared with the community.",
      });
      router.push("/dashboard/explore");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          toast.error("Server not reachable", {
            description: "Please check your connection and try again.",
          });
        } else {
          toast.error("Failed to create post", {
            description: error.message,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
          <PlusCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <p className="text-muted-foreground">
            Share your recycling journey with the community
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Before & After Images</CardTitle>
            <CardDescription>
              Upload images showing the waste before and after your recycling
              effort
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Uploads */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    1
                  </div>
                  <span className="text-sm font-medium">Before Image</span>
                </div>
                <ImageUpload
                  value={beforeImage}
                  onChange={setBeforeImage}
                  disabled={isLoading}
                  label=""
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    2
                  </div>
                  <span className="text-sm font-medium">After Image</span>
                </div>
                <ImageUpload
                  value={afterImage}
                  onChange={setAfterImage}
                  disabled={isLoading}
                  label=""
                />
              </div>
            </div>

            {/* Arrow indicator for mobile */}
            <div className="flex justify-center md:hidden">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Before</span>
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm">After</span>
              </div>
            </div>

            {/* Waste Type */}
            <div className="space-y-2">
              <Label htmlFor="wasteType">Waste Type</Label>
              <Input
                id="wasteType"
                placeholder="e.g., Plastic bottles, Paper, Electronics..."
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Recycled Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="recycled" className="text-base cursor-pointer">
                  Recycled Successfully
                </Label>
                <p className="text-sm text-muted-foreground">
                  Toggle this if you successfully recycled the waste
                </p>
              </div>
              <Switch
                id="recycled"
                checked={recycled}
                onCheckedChange={setRecycled}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Post...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Post
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
