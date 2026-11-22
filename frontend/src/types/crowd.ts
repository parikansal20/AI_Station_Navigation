// ── Crowd Analysis API Types ──────────────────────────────────────────────────
// Matches the FastAPI CrowdAnalyzeResponse Pydantic model exactly.

export type DensityLevel = "Low" | "Medium" | "High";

export interface CrowdAnalyzeResponse {
  location_id: string | null;
  estimated_count: number;
  density_level: DensityLevel;
  confidence: number;         // 0.0 – 1.0
  summary: string;
  advice: string;
  processing_time_ms: number;
  timestamp: string;          // ISO 8601 datetime string
  heatmap_base64: string | null;
}

export interface ApiError {
  detail: string;
}

// ── Upload state machine ──────────────────────────────────────────────────────
export type AnalysisStatus =
  | "idle"       // nothing uploaded yet
  | "preview"    // image selected, ready to analyze
  | "loading"    // waiting on API
  | "success"    // results received
  | "error";     // API or network error

export interface VideoFrameAnalyzeResponse {
  current_count: number;
  average_count: number;
  density_level: DensityLevel;
  confidence: number;
  timestamp: string;
  motion_detected: boolean;
  processing_time_ms: number;
  location_id: string | null;
  summary: string;
  advice: string;
  heatmap_base64: string | null;
  yolo_count?: number | null;
  csrnet_count?: number | null;
  detector_mode?: string | null;
  is_hybrid_mode?: boolean;
}

export interface VideoFileAnalyzeResponse {
  filename: string;
  total_frames: number;
  processed_frames: number;
  fps: number;
  duration_seconds: number;
  current_count: number;
  average_count: number;
  peak_count: number;
  density_level: DensityLevel;
  confidence: number;
  timestamp: string;
  sample_frames: VideoFrameAnalyzeResponse[];
  is_hybrid_mode?: boolean;
}

export interface CameraView {
  id: string;
  name: string;
  description: string;
  type: "webcam" | "rtsp" | "simulated";
  src?: string;
  locationId: string;
}

export interface CrowdTrendPoint {
  timestamp: string;
  timeLabel: string;
  current_count: number;
  average_count: number;
}

