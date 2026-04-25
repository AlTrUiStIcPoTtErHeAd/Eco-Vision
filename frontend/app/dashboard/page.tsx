"use client";

import Link from "next/link";
import {
  Brain,
  PlusCircle,
  Compass,
  BarChart3,
  Leaf,
  Recycle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const quickActions = [
  {
    title: "AI Prediction",
    description: "Upload an image to identify waste type",
    icon: Brain,
    href: "/dashboard/predict",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Create Post",
    description: "Share your recycling journey",
    icon: PlusCircle,
    href: "/dashboard/create-post",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    title: "Explore Feed",
    description: "Discover community posts",
    icon: Compass,
    href: "/dashboard/explore",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "View Stats",
    description: "Track your environmental impact",
    icon: BarChart3,
    href: "/dashboard/stats",
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back, {user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-muted-foreground">
                Ready to make a positive impact today?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-2">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} mb-2`}
                >
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 h-auto" asChild>
                  <Link
                    href={action.href}
                    className="flex items-center gap-2 text-primary"
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">AI-Powered Detection</CardTitle>
                <CardDescription>
                  Our AI can identify waste types instantly
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Upload any image of waste and our machine learning model will
              classify it, tell you if it&apos;s recyclable, and provide disposal
              instructions.
            </p>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Recycle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Track Your Impact</CardTitle>
                <CardDescription>
                  See how you&apos;re helping the environment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every post you create earns points and tracks the CO₂ you&apos;ve
              helped save. View your stats to see your contribution to a
              greener planet.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
