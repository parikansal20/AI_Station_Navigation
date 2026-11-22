"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";
import { crowdVideoService } from "@/services/crowdVideoService";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const apiBase = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const densityColorMap = {
  Low: {
    bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  Medium: {
    bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  High: {
    bg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    text: "text-rose-400",
    dot: "bg-rose-400",
  },
};

export function VideoFeedViewport() {
  const {
    mode,
    showHeatmap,
    setShowHeatmap,
    isStreaming,
    setIsStreaming,
    targetFps,
    setTargetFps,
    hasAnalyzed,
    currentCount,
    densityLevel,
    confidence,
    heatmapBase64,
    processingTimeMs,
    updateRealMetrics,
    setVideoFileResult,
  } = useCrowdMonitorStore();

  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef<boolean>(false);

  // ── Webcam Access ────────────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null);

  // Stop webcam and close WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Stop the camera on the backend if it was streaming
      fetch(`${apiBase}/api/v1/crowd/3d/stop-camera`, { method: "POST" }).catch(() => {});
    };
  }, []);

  // ── Webcam Access (Delegated to Backend 3D Video Analyzer + WebSocket updates) ──
  const startWebcam = useCallback(async () => {
    try {
      setWebcamError(null);
      
      // 1. Tell backend to start camera
      const res = await fetch(`${apiBase}/api/v1/crowd/3d/start-camera`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webcam_index: 0 }),
      });
      
      if (!res.ok) {
        throw new Error(`Failed to start camera on backend (HTTP ${res.status})`);
      }

      // 2. Open WebSocket connection for real-time counts and logs
      const wsBase = apiBase.replace(/^http/, "ws");
      const ws = new WebSocket(`${wsBase}/api/v1/crowd/3d/ws/crowd-updates`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          if (typeof event.data === "string") {
            const message = JSON.parse(event.data);
            if (message.type === "crowd_update") {
              const currentCount = message.current_count;
              const densityLevel = currentCount > 35 ? "High" : currentCount > 15 ? "Medium" : "Low";
              const summary = currentCount > 35 ? "Heavy crowd at Platform" : currentCount > 15 ? "Moderate crowd at Platform" : "Low crowd at Platform";
              const advice = currentCount > 35 ? "Please allow extra time for boarding and mind your belongings." : currentCount > 15 ? "Proceed normally, but expect some wait times." : "Quick and easy access. Have a safe journey!";
              const confidence = currentCount < 1 ? 0.95 : currentCount > 150 ? 0.85 : 0.92;
              
              updateRealMetrics({
                currentCount,
                averageCount: currentCount,
                densityLevel,
                confidence,
                summary,
                advice,
                detectorMode: "YOLOv8",
                yoloCount: currentCount,
                isHybridMode: true
              });
            }
          }
        } catch (err) {
          console.error("Error reading websocket message:", err);
        }
      };

      ws.onerror = () => {
        setWebcamError("WebSocket connection error. Counts might not update in real-time.");
      };

      setIsStreaming(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Backend camera start failed";
      setWebcamError(`Webcam Error: ${msg}. Please ensure the server camera is available.`);
      setIsStreaming(false);
    }
  }, [setIsStreaming, updateRealMetrics]);

  const stopWebcam = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    try {
      await fetch(`${apiBase}/api/v1/crowd/3d/stop-camera`, { method: "POST" });
    } catch (err) {
      console.error("Error stopping backend camera:", err);
    }
    
    setIsStreaming(false);
  }, [setIsStreaming]);

  // ── Process Real Live Frame from Webcam or Video File via CSRNet Backend API ──
  const captureAndAnalyzeRealFrame = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    if (mode === "upload" && (videoRef.current.paused || videoRef.current.ended)) return;

    try {
      isAnalyzingRef.current = true;
      setIsAnalyzingFrame(true);

      const frameBlob = await crowdVideoService.captureFrameBlob(videoRef.current, 0.85);
      if (!frameBlob) return;

      const locId = mode === "webcam" ? "live-webcam" : "uploaded-video";
      // Call Backend API Endpoint POST /api/v1/crowd/analyze-frame
      const res = await crowdVideoService.analyzeFrame(
        frameBlob,
        locId,
        3,
        showHeatmap,
        true
      );

      // Update store with REAL AI output
      setWebcamError(null);
      updateRealMetrics({
        currentCount: res.current_count,
        averageCount: res.average_count,
        densityLevel: res.density_level,
        confidence: res.confidence,
        summary: res.summary,
        advice: res.advice,
        heatmapBase64: res.heatmap_base64,
        processingTimeMs: res.processing_time_ms,
        yoloCount: res.yolo_count,
        csrnetCount: res.csrnet_count,
        detectorMode: res.detector_mode,
        isHybridMode: res.is_hybrid_mode ?? true,
      });
    } catch (err: unknown) {
      console.error("Real frame inference error:", err);
      const msg = err instanceof Error ? err.message : "Frame analysis failed";
      setWebcamError(`Inference Error: ${msg}`);
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzingFrame(false);
    }
  }, [mode, showHeatmap, updateRealMetrics]);

  // Real-time loop timer for webcam OR playing uploaded video file
  useEffect(() => {
    const shouldRun = (mode === "upload" && Boolean(uploadedVideoUrl) && isVideoPlaying);
    if (shouldRun) {
      const intervalMs = Math.max(150, Math.floor(1000 / targetFps));
      captureAndAnalyzeRealFrame();
      intervalRef.current = setInterval(captureAndAnalyzeRealFrame, intervalMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode, isStreaming, isVideoPlaying, uploadedVideoUrl, targetFps, captureAndAnalyzeRealFrame]);

  // ── Video File Analysis via CSRNet Backend API ──────────────────────────────
  const processUploadedVideoFile = async (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setIsProcessingVideo(true);

    try {
      // Call Backend API Endpoint POST /api/v1/crowd/analyze-video
      const res = await crowdVideoService.analyzeVideoFile(
        file,
        "video-file-analysis",
        5,
        showHeatmap
      );

      setVideoFileResult({
        filename: res.filename,
        totalFrames: res.total_frames,
        processedFrames: res.processed_frames,
        durationSeconds: res.duration_seconds,
        peakCount: res.peak_count,
      });

      const firstSampleHeatmap = res.sample_frames.find((f) => f.heatmap_base64)?.heatmap_base64 ?? null;

      updateRealMetrics({
        currentCount: res.current_count,
        averageCount: res.average_count,
        densityLevel: res.density_level,
        confidence: res.confidence,
        summary: `Video Processing Complete (${res.processed_frames}/${res.total_frames} frames evaluated)`,
        advice: `Average crowd count: ${res.average_count} passengers. Peak crowd: ${res.peak_count}`,
        heatmapBase64: firstSampleHeatmap,
        processingTimeMs: 0,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process video file via CSRNet";
      alert(`Video Analysis Error: ${msg}`);
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedVideoFile(file);
    }
  };

  const densityTheme = densityColorMap[densityLevel];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Viewport Header Bar */}
      <div className="p-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-slate-800 text-[#FAC24A] border-slate-700 font-mono text-xs">
            {mode === "webcam" ? "INPUT: WEBCAM FEED" : "INPUT: VIDEO FILE"}
          </Badge>
          <h2 className="text-sm font-bold text-white tracking-wide">
            {mode === "webcam" ? "Real-Time Camera Viewport" : selectedFile?.name || "Uploaded Video Viewport"}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {hasAnalyzed && (
            <>
              <Badge variant="outline" className="bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-xs">
                ⚡ CSRNet + YOLO Hybrid Active
              </Badge>
              <Badge className={densityTheme.bg}>
                <span className={`w-2 h-2 rounded-full ${densityTheme.dot} animate-pulse mr-1.5`} />
                {densityLevel} Density
              </Badge>
            </>
          )}

          {isStreaming && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs">
              STREAM LIVE • {targetFps} FPS
            </Badge>
          )}
        </div>
      </div>

      {/* Main Video Viewport Screen */}
      <div className="relative min-h-[380px] sm:min-h-[460px] w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Mode 1: Live Webcam Stream */}
        {mode === "webcam" && (
          <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] flex items-center justify-center bg-slate-950">
            {isStreaming ? (
              <img
                src={`${apiBase}/api/v1/crowd/3d/video-feed?t=${Date.now()}`}
                alt="3D live detection feed"
                className="w-full h-full object-contain max-h-[480px] block"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                className="hidden"
              />
            )}

            {!isStreaming && !webcamError && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#134489]/20 border border-[#134489]/40 flex items-center justify-center text-3xl mx-auto text-[#FAC24A]">
                  📷
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Live Camera Feed Offline</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Click Start to stream real video frames directly to the backend CSRNet AI model.
                  </p>
                </div>
                <Button
                  onClick={startWebcam}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs px-6 shadow-lg shadow-emerald-600/30"
                >
                  ▶ Start Live Camera Stream
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Upload Video File Player */}
        {mode === "upload" && (
          <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] flex items-center justify-center bg-slate-950">
            {uploadedVideoUrl ? (
              <video
                ref={videoRef}
                src={uploadedVideoUrl}
                controls
                autoPlay
                loop
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
                onLoadedData={() => {
                  setIsVideoPlaying(true);
                  captureAndAnalyzeRealFrame();
                }}
                className="w-full h-full object-cover max-h-[480px]"
              />
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-[#FAC24A]/10 border border-[#FAC24A]/30 flex items-center justify-center text-3xl mx-auto text-[#FAC24A]">
                  📁
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Select Video File for Real AI Analysis</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Upload MP4, AVI, MOV, or WebM video. The backend CSRNet model will analyze all frames.
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#FAC24A] hover:bg-[#e5b140] text-slate-950 font-bold rounded-xl text-xs px-6 shadow-lg shadow-[#FAC24A]/20"
                >
                  Browse Video File
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/mkv,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Base64 Density Heatmap Overlay */}
        {showHeatmap && heatmapBase64 && (
          <div className="absolute inset-0 pointer-events-none opacity-65 mix-blend-screen">
            <img
              src={`data:image/jpeg;base64,${heatmapBase64}`}
              alt="CSRNet Base64 Heatmap Overlay"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Processing Spinner Overlay */}
        {(isProcessingVideo || isAnalyzingFrame) && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <span className="animate-spin text-indigo-400 text-sm">⚡</span>
            <span>Evaluating CSRNet Inference...</span>
          </div>
        )}

        {/* Webcam Error Message */}
        {webcamError && mode === "webcam" && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-rose-400 space-y-3">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-semibold max-w-md">{webcamError}</p>
            <Button
              onClick={startWebcam}
              size="sm"
              variant="outline"
              className="border-rose-500/40 text-rose-300 hover:bg-rose-950 rounded-xl"
            >
              Retry Camera Access
            </Button>
          </div>
        )}

        {/* Real AI Floating On-Screen Output HUD */}
        {hasAnalyzed && (
          <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/15 flex items-center justify-between text-white shadow-2xl">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Actual Estimated People
              </span>
              <div className={`text-3xl sm:text-4xl font-black tracking-tight ${densityTheme.text}`}>
                {currentCount >= 1 ? Math.round(currentCount) : Number(currentCount.toFixed(1))} <span className="text-xs font-normal text-slate-300">Passengers</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Confidence / Latency
              </span>
              <div className="text-base font-bold text-white">
                {Math.round(confidence * 100)}% &bull; <span className="text-xs text-slate-300">{processingTimeMs}ms</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewport Bottom Controls Toolbar */}
      <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-2">
            <Switch id="heatmap-switch" checked={showHeatmap} onCheckedChange={setShowHeatmap} />
            <Label htmlFor="heatmap-switch" className="text-slate-300 cursor-pointer font-medium">
              Density Heatmap Overlay
            </Label>
          </div>

          {mode === "webcam" && (
            <div className="flex items-center space-x-2">
              {isStreaming ? (
                <Button onClick={stopWebcam} size="sm" variant="destructive" className="h-7 text-xs rounded-lg px-3">
                  ⏹ Stop Stream
                </Button>
              ) : (
                <Button onClick={startWebcam} size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg px-3">
                  ▶ Start Stream
                </Button>
              )}
            </div>
          )}

          {mode === "upload" && (
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="outline"
              className="h-7 border-slate-700 text-slate-200 text-xs rounded-lg px-3"
            >
              📂 Change Video File
            </Button>
          )}
        </div>

        {mode === "webcam" && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target FPS:</span>
            <select
              value={targetFps}
              onChange={(e) => setTargetFps(Number(e.target.value))}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none"
            >
              <option value={5}>5 FPS (Low Latency)</option>
              <option value={10}>10 FPS (Balanced)</option>
              <option value={15}>15 FPS (High Precision)</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
