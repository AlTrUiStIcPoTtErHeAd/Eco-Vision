"use client";

import { useState } from "react";
import {
  Brain,
  Loader2,
  Recycle,
  Trash2,
  Lightbulb,
  MapPin,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/image-upload";
import { predictWaste, ApiError, type PredictionResult } from "@/lib/api";
import { toast } from "sonner";

export default function PredictPage() {
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  async function handlePredict() {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const prediction = await predictWaste(image);
      setResult(prediction);
      toast.success("Prediction complete!");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 0) {
          toast.error("Server not reachable", {
            description: "Please check your connection and try again.",
          });
        } else {
          toast.error("Prediction failed", {
            description: error.message,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }

  function resetPrediction() {
    setImage(null);
    setResult(null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
          <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Waste Prediction</h1>
          <p className="text-muted-foreground">
            Upload an image to identify the waste type and get disposal
            instructions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Waste Image</CardTitle>
            <CardDescription>
              Take a clear photo of the waste item for accurate prediction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              value={image}
              onChange={setImage}
              disabled={isLoading}
              label=""
            />
            <div className="flex gap-3">
              <Button
                onClick={handlePredict}
                disabled={!image || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Predict Waste Type
                  </>
                )}
              </Button>
              {(image || result) && (
                <Button variant="outline" onClick={resetPrediction}>
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className={result ? "" : "border-dashed"}>
          <CardHeader>
            <CardTitle className="text-lg">Prediction Result</CardTitle>
            <CardDescription>
              {result
                ? "Here's what we found"
                : "Results will appear here after analysis"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                {/* Waste Type */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Trash2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Waste Type</p>
                    <p className="text-xl font-semibold capitalize">
                      {result.waste_type}
                    </p>
                  </div>
                </div>

                {/* Recyclable Status */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    result.recyclable
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  {result.recyclable ? (
                    <>
                      <CheckCircle2 className="h-6 w-6" />
                      <div>
                        <p className="font-semibold">Recyclable</p>
                        <p className="text-sm opacity-80">
                          This item can be recycled
                        </p>
                      </div>
                      <Badge className="ml-auto bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30">
                        <Recycle className="h-3 w-3 mr-1" />
                        Recycle
                      </Badge>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6" />
                      <div>
                        <p className="font-semibold">Not Recyclable</p>
                        <p className="text-sm opacity-80">
                          This item cannot be recycled
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-red-500/20 text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Dispose
                      </Badge>
                    </>
                  )}
                </div>

                {/* Disposal Instructions */}
                {result.disposal_instructions && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Disposal Instructions
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                      {result.disposal_instructions}
                    </p>
                  </div>
                )}

                {/* Ideas */}
                {result.ideas && result.ideas.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Recycling Ideas
                    </div>
                    <ul className="space-y-1 pl-6">
                      {result.ideas.map((idea, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-1.5">•</span>
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Upload an image and click predict to see results
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map Placeholder */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Nearby Disposal Centers</CardTitle>
            </div>
            <CardDescription>
              Find recycling centers and disposal facilities near you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-[21/9] rounded-xl bg-muted flex items-center justify-center border-2 border-dashed">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Map integration coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
