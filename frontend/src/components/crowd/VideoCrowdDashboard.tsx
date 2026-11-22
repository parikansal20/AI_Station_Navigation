"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  crowdVideoService,
  DEFAULT_CAMERA_VIEWS,
} from "@/services/crowdVideoService";
import type {
  VideoFrameAnalyzeResponse,
  VideoFileAnalyzeResponse,
  CameraView,
  CrowdTrendPoint,
  DensityLevel,
} from "@/types/crowd";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";

const densityTheme: Record<
  DensityLevel,
  {
    label: string;
    badgeBg: string;
    textColor: string;
    borderColor: string;
    gradient: string;
    icon: string;
  }
> = {
  Low: {
    label: "Low Density",
    badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    icon: "🟢",
  },
  Medium: {
    label: "Medium Density",
    badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    icon: "🟡",
  },
  High: {
    label: "High Density",
    badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
    textColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500",
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    icon: "🔴",
  },
};

export function VideoCrowdDashboard() {
  const { updateRealMetrics } = useCrowdMonitorStore();

  // ── State Management ────────────────────────────────────────────────────────
  const [selectedCamera, setSelectedCamera] = useState<CameraView>(DEFAULT_CAMERA_VIEWS[0]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Config parameters
  const [targetFps, setTargetFps] = useState<number>(10);
  const [frameSkip, setFrameSkip] = useState<number>(3);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [enableMotionDetection, setEnableMotionDetection] = useState<boolean>(true);

  // Live metrics
  const [latestFrame, setLatestFrame] = useState<VideoFrameAnalyzeResponse | null>(null);
  const [trendHistory, setTrendHistory] = useState<CrowdTrendPoint[]>([]);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState<boolean>(false);
  const [framesProcessedCount, setFramesProcessedCount] = useState<number>(0);

  // Video File Upload State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessingVideoFile, setIsProcessingVideoFile] = useState<boolean>(false);
  const [videoFileResult, setVideoFileResult] = useState<VideoFileAnalyzeResponse | null>(null);

  // RTSP State
  const [rtspUrl, setRtspUrl] = useState<string>("rtsp://192.168.1.100:554/stream1");
  const [isTestingRtsp, setIsTestingRtsp] = useState<boolean>(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);

  // ── Webcam Stream Handling ──────────────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    try {
      setStreamError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to access camera";
      setStreamError(`Camera error: ${errorMsg}. Please allow webcam permissions.`);
      setIsStreaming(false);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // ── Process Single Live Frame ────────────────────────────────────────────────
  const processLiveFrame = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    if (!videoRef.current && selectedCamera.type === "webcam") return;

    try {
      isAnalyzingRef.current = true;
      setIsAnalyzingFrame(true);

      let frameBlob: Blob | null = null;
      if (selectedCamera.type === "webcam" && videoRef.current) {
        frameBlob = await crowdVideoService.captureFrameBlob(videoRef.current);
      } else {
        // For simulated camera views, draw sample video canvas frame
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Generate active dynamic visual gradient simulation frame
          const gradient = ctx.createLinearGradient(0, 0, 640, 480);
          gradient.addColorStop(0, "#1e293b");
          gradient.addColorStop(1, "#0f172a");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 640, 480);
          
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 20px sans-serif";
          ctx.fillText(`SARTHI Station CCTV: ${selectedCamera.name}`, 30, 50);
          ctx.fillText(`Location ID: ${selectedCamera.locationId}`, 30, 85);
          
          // Simulated passenger shapes
          const simulatedPeopleCount = selectedCamera.id === "entrance" ? 18 : selectedCamera.id === "platform-3" ? 42 : 12;
          for (let i = 0; i < simulatedPeopleCount; i++) {
            const x = (Math.sin(Date.now() / 1000 + i) * 200) + 320;
            const y = (Math.cos(Date.now() / 800 + i) * 150) + 260;
            ctx.fillStyle = "#f43f5e";
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        frameBlob = await new Promise((res) => canvas.toBlob(res, "image/jpeg"));
      }

      if (!frameBlob) return;

      const res = await crowdVideoService.analyzeFrame(
        frameBlob,
        selectedCamera.locationId,
        frameSkip,
        showHeatmap,
        enableMotionDetection
      );

      setLatestFrame(res);
      setStreamError(null);
      setFramesProcessedCount((prev) => prev + 1);

      updateRealMetrics({
        currentCount: res.current_count,
        averageCount: res.average_count,
        densityLevel: res.density_level,
        confidence: res.confidence,
        summary: res.summary,
        advice: res.advice,
        heatmapBase64: res.heatmap_base64,
        processingTimeMs: res.processing_time_ms,
      });

      setTrendHistory((prev) =>
        crowdVideoService.updateTrendHistory(prev, res.current_count, res.average_count)
      );
    } catch (err: unknown) {
      console.error("Frame analysis error:", err);
      const msg = err instanceof Error ? err.message : "Frame analysis failed";
      setStreamError(`Inference Error: ${msg}`);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzingFrame(false);
    }
  }, [selectedCamera, frameSkip, showHeatmap, enableMotionDetection, updateRealMetrics]);

  // ── Streaming Timer Loop ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isStreaming) {
      const intervalMs = Math.max(100, Math.floor(1000 / targetFps));
      timerRef.current = setInterval(() => {
        processLiveFrame();
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStreaming, targetFps, processLiveFrame]);

  // Handle camera switch
  const handleCameraChange = (cam: CameraView) => {
    setSelectedCamera(cam);
    setLatestFrame(null);
    setTrendHistory([]);
    if (cam.type === "webcam") {
      startWebcam();
    } else {
      if (isStreaming && selectedCamera.type === "webcam") {
        stopWebcam();
      }
      setIsStreaming(true);
    }
  };

  // Handle Video File Upload Analysis
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setIsProcessingVideoFile(true);
    setVideoFileResult(null);

    try {
      const result = await crowdVideoService.analyzeVideoFile(
        file,
        selectedCamera.locationId,
        frameSkip,
        showHeatmap
      );
      setVideoFileResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Video file analysis failed";
      alert(msg);
    } finally {
      setIsProcessingVideoFile(false);
    }
  };

  // Handle RTSP Test
  const handleRtspTest = async () => {
    if (!rtspUrl) return;
    setIsTestingRtsp(true);
    try {
      const result = await crowdVideoService.analyzeRtspStream(
        rtspUrl,
        selectedCamera.locationId,
        showHeatmap
      );
      setLatestFrame(result);
      setTrendHistory((prev) =>
        crowdVideoService.updateTrendHistory(prev, result.current_count, result.average_count)
      );
      alert(`RTSP Stream Connected! Current Count: ${result.current_count}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "RTSP stream error";
      alert(msg);
    } finally {
      setIsTestingRtsp(false);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────────
  const currentDensity = latestFrame?.density_level || "Low";
  const activeTheme = densityTheme[currentDensity];

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Real-Time Video Crowd Monitor
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Powered by CSRNet Deep Learning & OpenCV Motion Tracking (5–15 FPS Pipeline)
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {selectedCamera.type === "webcam" ? (
            !isStreaming ? (
              <Button
                onClick={startWebcam}
                className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 rounded-xl px-5"
              >
                ▶ Start Webcam Feed
              </Button>
            ) : (
              <Button
                onClick={stopWebcam}
                variant="destructive"
                className="shadow-lg shadow-rose-600/30 rounded-xl px-5"
              >
                ⏹ Stop Webcam
              </Button>
            )
          ) : (
            <Button
              onClick={() => setIsStreaming(!isStreaming)}
              className={
                isStreaming
                  ? "bg-amber-600 hover:bg-amber-500 rounded-xl px-5"
                  : "bg-emerald-600 hover:bg-emerald-500 rounded-xl px-5"
              }
            >
              {isStreaming ? "⏸ Pause Stream" : "▶ Start Stream"}
            </Button>
          )}
        </div>
      </div>

      {/* Camera View Switcher Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 no-scrollbar">
        {DEFAULT_CAMERA_VIEWS.map((cam) => {
          const isActive = selectedCamera.id === cam.id;
          return (
            <button
              key={cam.id}
              onClick={() => handleCameraChange(cam)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{cam.type === "webcam" ? "📷" : "📹"}</span>
              <span>{cam.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Video Stream + Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Viewport & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl bg-slate-950 text-white relative">
            <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                  {selectedCamera.name}
                </Badge>
                {isStreaming && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    LIVE • {targetFps} FPS
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {isAnalyzingFrame && <span className="animate-spin text-indigo-400">⚡</span>}
                <span>Frames: {framesProcessedCount}</span>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center bg-black">
              {/* Webcam Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover max-h-[440px] ${
                  selectedCamera.type === "webcam" && isStreaming ? "block" : "hidden"
                }`}
              />

              {/* Simulated Camera View / Canvas Overlay */}
              {selectedCamera.type !== "webcam" && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-slate-950">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl mb-3 text-indigo-400">
                    🎥
                  </div>
                  <h3 className="text-lg font-semibold">{selectedCamera.name}</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    {selectedCamera.description}
                  </p>
                  {isStreaming ? (
                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Stream active • Processing frame pipeline
                    </div>
                  ) : (
                    <Button
                      onClick={() => setIsStreaming(true)}
                      size="sm"
                      className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
                    >
                      Connect Live Camera Stream
                    </Button>
                  )}
                </div>
              )}

              {/* Heatmap Overlay Display */}
              {showHeatmap && latestFrame?.heatmap_base64 && (
                <div className="absolute inset-0 pointer-events-none opacity-60 mix-blend-screen">
                  {/* Base64 heatmap image overlay */}
                  <img
                    src={`data:image/jpeg;base64,${latestFrame.heatmap_base64}`}
                    alt="Density Heatmap Overlay"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Error overlay */}
              {streamError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-rose-400">
                  <span className="text-3xl mb-2">⚠️</span>
                  <p className="text-sm font-medium">{streamError}</p>
                  <Button
                    onClick={startWebcam}
                    size="sm"
                    variant="outline"
                    className="mt-4 border-rose-500/40 text-rose-300 hover:bg-rose-950"
                  >
                    Retry Permission
                  </Button>
                </div>
              )}
            </CardContent>

            {/* Performance Controls Toolbar */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="heatmap-mode"
                    checked={showHeatmap}
                    onCheckedChange={setShowHeatmap}
                  />
                  <Label htmlFor="heatmap-mode" className="text-slate-300 cursor-pointer">
                    Density Heatmap
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="motion-mode"
                    checked={enableMotionDetection}
                    onCheckedChange={setEnableMotionDetection}
                  />
                  <Label htmlFor="motion-mode" className="text-slate-300 cursor-pointer">
                    Motion Detection
                  </Label>
                </div>
              </div>

              {/* FPS Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Target FPS:</span>
                <select
                  value={targetFps}
                  onChange={(e) => setTargetFps(Number(e.target.value))}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                >
                  <option value={5}>5 FPS (Low Power)</option>
                  <option value={10}>10 FPS (Balanced)</option>
                  <option value={15}>15 FPS (High Precision)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Real-Time Stats & Dashboard Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Stat Card */}
          <Card className={`border shadow-lg rounded-2xl transition-all duration-300 bg-card ${activeTheme.borderColor}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Station Crowd Count
                </span>
                <Badge className={activeTheme.badgeBg}>
                  {activeTheme.icon} {activeTheme.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${activeTheme.textColor}`}>
                    {latestFrame
                      ? (latestFrame.current_count >= 1
                          ? Math.round(latestFrame.current_count)
                          : Number(latestFrame.current_count.toFixed(1)))
                      : 0}
                  </div>
                  <span className="text-xs text-muted-foreground">Estimated People in Frame</span>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {latestFrame
                      ? (latestFrame.average_count >= 1
                          ? Math.round(latestFrame.average_count)
                          : Number(latestFrame.average_count.toFixed(1)))
                      : 0}
                  </div>
                  <span className="text-xs text-muted-foreground">2-Min Moving Avg</span>
                </div>
              </div>

              {/* Confidence & Latency Bar */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">AI Model Confidence</span>
                  <span>{latestFrame ? `${Math.round(latestFrame.confidence * 100)}%` : "--%"}</span>
                </div>
                <Progress
                  value={latestFrame ? latestFrame.confidence * 100 : 0}
                  className="h-2 rounded-full"
                />
              </div>

              {/* Summary & Passenger Advice */}
              {latestFrame?.advice && (
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <p className="font-semibold text-foreground">{latestFrame.summary}</p>
                  <p className="text-muted-foreground">{latestFrame.advice}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Features: Video File & RTSP Streaming Cards */}
          <Card className="border border-border shadow-md rounded-2xl bg-card p-4 space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Integration & Upload
            </h4>

            {/* Video File Upload */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
              <label className="text-xs font-medium text-foreground block">
                📹 Upload Video File (MP4, AVI, MOV)
              </label>
              <input
                type="file"
                accept="video/mp4,video/avi,video/quicktime,video/mkv,video/webm"
                onChange={handleVideoFileUpload}
                disabled={isProcessingVideoFile}
                className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
              {isProcessingVideoFile && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                  Processing video frames via OpenCV CSRNet pipeline...
                </p>
              )}
              {videoFileResult && (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ File processed: Avg {videoFileResult.average_count} people (Peak {videoFileResult.peak_count})
                </div>
              )}
            </div>

            {/* RTSP Stream Input */}
            <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-2">
              <label className="text-xs font-medium text-foreground block">
                🌐 RTSP / IP CCTV Camera URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  placeholder="rtsp://192.168.1.100:554/stream1"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none"
                />
                <Button
                  onClick={handleRtspTest}
                  disabled={isTestingRtsp}
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs"
                >
                  {isTestingRtsp ? "Connecting..." : "Test Stream"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 2-Minute Crowd Trend SVG Line Chart */}
      <Card className="border border-border shadow-lg rounded-2xl bg-card">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">2-Minute Crowd Density Trend</CardTitle>
            <p className="text-xs text-muted-foreground">
              Real-time trajectory tracking of crowd count vs 2-minute moving average
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {trendHistory.length} Datapoints (120s max)
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          {trendHistory.length < 2 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              Start webcam or stream to populate real-time trend chart data...
            </div>
          ) : (
            <div className="h-48 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 180">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 45, 90, 135, 180].map((y, idx) => (
                  <line
                    key={idx}
                    x1="0"
                    y1={y}
                    x2="800"
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Calculate points mapping */}
                {(() => {
                  const maxVal = Math.max(
                    20,
                    ...trendHistory.map((d) => Math.max(d.current_count, d.average_count))
                  );
                  const points = trendHistory.map((d, index) => {
                    const x = (index / (trendHistory.length - 1)) * 800;
                    const y = 170 - (d.current_count / maxVal) * 150;
                    const avgY = 170 - (d.average_count / maxVal) * 150;
                    return { x, y, avgY };
                  });

                  const currentPath = points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                    ""
                  );
                  const areaPath = `${currentPath} L 800 180 L 0 180 Z`;
                  const avgPath = points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.avgY}`,
                    ""
                  );

                  return (
                    <>
                      {/* Gradient Fill */}
                      <path d={areaPath} fill="url(#areaGradient)" />
                      {/* Instantaneous Count Line */}
                      <path
                        d={currentPath}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      {/* Moving Average Line */}
                      <path
                        d={avgPath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="5 3"
                      />
                    </>
                  );
                })()}
              </svg>

              {/* Chart Legend */}
              <div className="flex items-center justify-end gap-6 text-xs mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-indigo-500 rounded-full" />
                  <span className="text-muted-foreground">Current Count</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-1 bg-amber-500 rounded-full border-dashed" />
                  <span className="text-muted-foreground">Moving Average</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
