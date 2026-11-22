import { create } from "zustand";
import type { DensityLevel } from "@/types/crowd";

export interface RealInferenceLogItem {
  id: string;
  timestamp: string;
  timeLabel: string;
  count: number;
  averageCount: number;
  densityLevel: DensityLevel;
  confidence: number;
  processingTimeMs: number;
  summary: string;
  heatmapBase64?: string | null;
}

export interface TrendPoint {
  timestamp: string;
  timeLabel: string;
  current_count: number;
  average_count: number;
}

interface CrowdMonitorState {
  mode: "webcam" | "upload";
  showHeatmap: boolean;
  isStreaming: boolean;
  targetFps: number;
  
  // Real-time AI Output State (Populated by Hybrid CSRNet + YOLO Engine)
  hasAnalyzed: boolean;
  currentCount: number;
  averageCount: number;
  densityLevel: DensityLevel;
  confidence: number;
  summary: string;
  advice: string;
  heatmapBase64: string | null;
  processingTimeMs: number;
  yoloCount: number | null;
  csrnetCount: number | null;
  detectorMode: string;
  isHybridMode: boolean;
  
  // Video File Analysis Result
  videoFileResult: {
    filename: string;
    totalFrames: number;
    processedFrames: number;
    durationSeconds: number;
    peakCount: number;
  } | null;

  // Real Inferences History & Trend
  trendHistory: TrendPoint[];
  inferenceLogs: RealInferenceLogItem[];

  // Actions
  setMode: (mode: "webcam" | "upload") => void;
  setShowHeatmap: (show: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  setTargetFps: (fps: number) => void;
  
  updateRealMetrics: (data: {
    currentCount: number;
    averageCount: number;
    densityLevel: DensityLevel;
    confidence: number;
    summary: string;
    advice: string;
    heatmapBase64?: string | null;
    processingTimeMs?: number;
    yoloCount?: number | null;
    csrnetCount?: number | null;
    detectorMode?: string | null;
    isHybridMode?: boolean;
  }) => void;

  setVideoFileResult: (res: {
    filename: string;
    totalFrames: number;
    processedFrames: number;
    durationSeconds: number;
    peakCount: number;
  } | null) => void;

  resetSession: () => void;
  exportReport: () => void;
}

export const useCrowdMonitorStore = create<CrowdMonitorState>((set, get) => ({
  mode: "webcam",
  showHeatmap: true,
  isStreaming: false,
  targetFps: 10,

  // Initial Real State (0 / Idle - No fake dummy numbers)
  hasAnalyzed: false,
  currentCount: 0,
  averageCount: 0,
  densityLevel: "Low",
  confidence: 0,
  summary: "Ready to analyze real video input",
  advice: "Start live webcam or upload a video file to begin CSRNet AI crowd estimation.",
  heatmapBase64: null,
  processingTimeMs: 0,
  yoloCount: null,
  csrnetCount: null,
  detectorMode: "YOLOv8",
  isHybridMode: true,

  videoFileResult: null,
  trendHistory: [],
  inferenceLogs: [],

  setMode: (mode) => set({ mode, isStreaming: false }),
  setShowHeatmap: (showHeatmap) => set({ showHeatmap }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setTargetFps: (targetFps) => set({ targetFps }),

  updateRealMetrics: (data) =>
    set((state) => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
      
      const newTrendPoint: TrendPoint = {
        timestamp: now.toISOString(),
        timeLabel,
        current_count: Number(data.currentCount.toFixed(1)),
        average_count: Number(data.averageCount.toFixed(1)),
      };

      const newLogItem: RealInferenceLogItem = {
        id: `inf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now.toISOString(),
        timeLabel,
        count: data.currentCount,
        averageCount: data.averageCount,
        densityLevel: data.densityLevel,
        confidence: data.confidence,
        processingTimeMs: data.processingTimeMs ?? 0,
        summary: data.summary,
        heatmapBase64: data.heatmapBase64,
      };

      const updatedTrend = [...state.trendHistory, newTrendPoint].slice(-300);
      const updatedLogs = [newLogItem, ...state.inferenceLogs].slice(0, 50);

      return {
        ...state,
        hasAnalyzed: true,
        currentCount: data.currentCount,
        averageCount: data.averageCount,
        densityLevel: data.densityLevel,
        confidence: data.confidence,
        summary: data.summary,
        advice: data.advice,
        heatmapBase64: data.heatmapBase64 !== undefined ? data.heatmapBase64 : state.heatmapBase64,
        processingTimeMs: data.processingTimeMs ?? state.processingTimeMs,
        yoloCount: data.yoloCount !== undefined ? data.yoloCount : state.yoloCount,
        csrnetCount: data.csrnetCount !== undefined ? data.csrnetCount : state.csrnetCount,
        detectorMode: data.detectorMode ?? state.detectorMode,
        isHybridMode: data.isHybridMode ?? true,
        trendHistory: updatedTrend,
        inferenceLogs: updatedLogs,
      };
    }),

  setVideoFileResult: (res) => set({ videoFileResult: res }),

  resetSession: () =>
    set({
      hasAnalyzed: false,
      currentCount: 0,
      averageCount: 0,
      densityLevel: "Low",
      confidence: 0,
      summary: "Ready to analyze real video input",
      advice: "Start live webcam or upload a video file to begin CSRNet AI crowd estimation.",
      heatmapBase64: null,
      processingTimeMs: 0,
      trendHistory: [],
      inferenceLogs: [],
      videoFileResult: null,
      isStreaming: false,
    }),

  exportReport: () => {
    const state = get();
    const reportData = {
      title: "SARTHI Station AI - Real AI Crowd Analysis Report",
      generatedAt: new Date().toISOString(),
      mode: state.mode,
      hasAnalyzed: state.hasAnalyzed,
      latestMetrics: {
        estimatedCount: state.currentCount,
        movingAverageCount: state.averageCount,
        densityLevel: state.densityLevel,
        confidenceRating: `${Math.round(state.confidence * 100)}%`,
        inferenceLatencyMs: state.processingTimeMs,
        summary: state.summary,
        advice: state.advice,
      },
      videoFileMetadata: state.videoFileResult,
      inferenceHistoryLogs: state.inferenceLogs,
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SARTHI_Real_AI_Report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
