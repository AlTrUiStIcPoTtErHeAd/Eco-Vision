"use client";

import { useEffect, useState } from "react";
import { Compass, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/post-card";
import { getPosts, ApiError, type Post } from "@/lib/api";
import { toast } from "sonner";

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchPosts(showRefreshToast = false) {
    try {
      const data = await getPosts();
      setPosts(data);
      if (showRefreshToast) {
        toast.success("Feed refreshed!");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          toast.error("Server not reachable", {
            description: "Please check your connection and try again.",
          });
        } else {
          toast.error("Failed to load posts", {
            description: error.message,
          });
        }
      }
    }
  }

  useEffect(() => {
    async function loadPosts() {
      setIsLoading(true);
      await fetchPosts();
      setIsLoading(false);
    }
    loadPosts();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchPosts(true);
    setIsRefreshing(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Compass className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Explore Feed</h1>
            <p className="text-muted-foreground">
              Discover recycling posts from the community
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="aspect-square rounded-lg" />
                  <Skeleton className="aspect-square rounded-lg" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Compass className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Be the first to share your recycling journey with the community!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load More Indicator */}
      {posts.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            You&apos;ve reached the end of the feed
          </p>
        </div>
      )}
    </div>
  );
}
