"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Award,
  Leaf,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserStats, ApiError, type UserStats } from "@/lib/api";
import { toast } from "sonner";

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getUserStats();
        setStats(data);
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 0) {
            toast.error("Server not reachable", {
              description: "Please check your connection and try again.",
            });
          } else {
            toast.error("Failed to load stats", {
              description: error.message,
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statsCards = stats
    ? [
        {
          title: "Total Posts",
          value: stats.total_posts,
          description: "Recycling posts shared",
          icon: FileText,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        },
        {
          title: "Points Earned",
          value: stats.points,
          description: "Keep recycling to earn more!",
          icon: Award,
          color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        {
          title: "CO₂ Saved",
          value: `${stats.co2_saved.toFixed(1)} kg`,
          description: "Carbon footprint reduced",
          icon: Leaf,
          color: "bg-green-500/10 text-green-600 dark:text-green-400",
        },
      ]
    : [];

  // Calculate level based on points
  const currentLevel = stats ? Math.floor(stats.points / 100) + 1 : 1;
  const pointsInLevel = stats ? stats.points % 100 : 0;
  const progressToNextLevel = pointsInLevel;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
          <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Your Impact</h1>
          <p className="text-muted-foreground">
            Track your environmental contribution
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl" />
              <CardContent className="pt-6 relative">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} mb-4`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-foreground mt-1">
                  {stat.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Level Progress */}
      {!isLoading && stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Level Progress</CardTitle>
                <CardDescription>
                  Earn points by recycling to level up
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {currentLevel}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Level {currentLevel}
                </span>
                <span className="text-muted-foreground">
                  Level {currentLevel + 1}
                </span>
              </div>
              <Progress value={progressToNextLevel} className="h-3" />
              <p className="text-xs text-center text-muted-foreground">
                {pointsInLevel}/100 points to next level
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {stats.total_posts * 2}
                </p>
                <p className="text-xs text-muted-foreground">Items Recycled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {(stats.co2_saved * 2.5).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Trees Equivalent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentLevel}
                </p>
                <p className="text-xs text-muted-foreground">Current Level</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environmental Impact */}
      {!isLoading && stats && (
        <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                Your Environmental Impact
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-background">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <Leaf className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {stats.co2_saved.toFixed(1)} kg CO₂
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Carbon emissions prevented
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  That&apos;s equivalent to driving{" "}
                  <span className="font-semibold text-foreground">
                    {(stats.co2_saved * 4).toFixed(0)} km
                  </span>{" "}
                  less in a car!
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {stats.points}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Total Eco Points
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
