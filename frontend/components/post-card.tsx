"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Recycle,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Post } from "@/lib/api";

interface PostCardProps {
  post: Post;
  showActions?: boolean;
}

export function PostCard({ post, showActions = true }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(Math.floor(Math.random() * 50) + 5);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState("");

  const initials = post.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleLike() {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  }

  function handleComment() {
    if (comment.trim()) {
      setComment("");
      setShowCommentInput(false);
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.user.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formattedDate}
              </div>
            </div>
          </div>
          <Badge
            variant={post.recycled ? "default" : "secondary"}
            className={
              post.recycled
                ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                : "bg-muted"
            }
          >
            {post.recycled ? (
              <>
                <Recycle className="h-3 w-3 mr-1" />
                Recycled
              </>
            ) : (
              <>
                <Trash2 className="h-3 w-3 mr-1" />
                Disposed
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-3">
        {/* Before/After Images */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={post.before_image}
              alt="Before"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded-md font-medium">
              Before
            </div>
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={post.after_image}
              alt="After"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="absolute bottom-2 left-2 bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs px-2 py-1 rounded-md font-medium">
              After
            </div>
          </div>
        </div>

        {/* Waste Type */}
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm">
            <span className="text-muted-foreground">Waste type:</span>{" "}
            <span className="font-medium capitalize">{post.waste_type}</span>
          </span>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="flex items-center gap-4 w-full">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setShowCommentInput(!showCommentInput)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Button>
          </div>

          {showCommentInput && (
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleComment}>
                Post
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
