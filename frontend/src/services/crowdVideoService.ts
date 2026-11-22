import type {
  VideoFrameAnalyzeResponse,
  VideoFileAnalyzeResponse,
  CameraView,
  CrowdTrendPoint,
} from "@/types/crowd";

const API_BASE = process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const DEFAULT_CAMERA_VIEWS: CameraView[] = [
  {
    id: "webcam",
    name: "Live Webcam Feed",
    description: "Local camera device feed for active monitoring",
    type: "webcam",
    locationId: "webcam-station",
  },
  {
    id: "entrance",
    name: "Main Entrance Gate",
    description: "CCTV Cam 01 - Station Concourse Entrance",
    type: "simulated",
    locationId: "entrance-gate",
  },
  {
    id: "platform-3",
    name: "Platform 3 (Express Line)",
    description: "CCTV Cam 04 - Track & Boarding Area",
    type: "simulated",
    locationId: "platform-3",
  },
  {
    id: "waiting-hall",
    name: "Executive Waiting Hall",
    description: "CCTV Cam 07 - Passenger Seating Area",
    type: "simulated",
    locationId: "waiting-hall",
  },
  {
    id: "ticket-counter",
    name: "Ticket Counter / UTS",
    description: "CCTV Cam 02 - Queue Management & Booking Hall",
    type: "simulated",
    locationId: "ticket-counter",
  },
];

class CrowdVideoService {
  private apiBase: string;

  constructor() {
    this.apiBase = API_BASE;
  }

  /**
   * Helper to capture a frame from an HTMLVideoElement onto a temporary HTMLCanvasElement.
   */
  public async captureFrameBlob(
    videoElement: HTMLVideoElement,
    quality: number = 0.85
  ): Promise<Blob | null> {
    if (!videoElement || videoElement.readyState < 2) {
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    });
  }

  /**
   * Submit a single video stream frame for real-time crowd analysis.
   */
  public async analyzeFrame(
    frameBlob: Blob,
    locationId: string = "webcam",
    frameSkip: number = 3,
    includeHeatmap: boolean = false,
    motionDetection: boolean = true
  ): Promise<VideoFrameAnalyzeResponse> {
    const formData = new FormData();
    formData.append("file", frameBlob, "frame.jpg");
    formData.append("location_id", locationId);

    const queryParams = new URLSearchParams({
      frame_skip: frameSkip.toString(),
      motion_detection: motionDetection.toString(),
      include_heatmap: includeHeatmap.toString(),
    });

    const primaryUrl = `${this.apiBase}/api/v1/crowd/analyze-frame?${queryParams.toString()}`;
    const fallbackUrl = `${this.apiBase}/crowd/analyze-frame?${queryParams.toString()}`;

    let res: Response;
    try {
      res = await fetch(primaryUrl, {
        method: "POST",
        body: formData,
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(fallbackUrl, {
          method: "POST",
          body: formData,
        });
      }
    } catch {
      res = await fetch(fallbackUrl, {
        method: "POST",
        body: formData,
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Frame analysis failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as VideoFrameAnalyzeResponse;
  }

  /**
   * Upload and process a complete video file.
   */
  public async analyzeVideoFile(
    file: File,
    locationId: string = "video-upload",
    frameSkip: number = 5,
    includeHeatmap: boolean = true
  ): Promise<VideoFileAnalyzeResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("location_id", locationId);

    const queryParams = new URLSearchParams({
      frame_skip: frameSkip.toString(),
      include_heatmap: includeHeatmap.toString(),
    });

    const primaryUrl = `${this.apiBase}/api/v1/crowd/analyze-video?${queryParams.toString()}`;
    const fallbackUrl = `${this.apiBase}/crowd/analyze-video?${queryParams.toString()}`;

    let res: Response;
    try {
      res = await fetch(primaryUrl, {
        method: "POST",
        body: formData,
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(fallbackUrl, {
          method: "POST",
          body: formData,
        });
      }
    } catch {
      res = await fetch(fallbackUrl, {
        method: "POST",
        body: formData,
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Video file analysis failed (${res.status}): ${errText}`);
    }

    return (await res.json()) as VideoFileAnalyzeResponse;
  }


  /**
   * Trigger frame extraction on an RTSP stream URL.
   */
  public async analyzeRtspStream(
    rtspUrl: string,
    locationId: string = "rtsp-cctv",
    includeHeatmap: boolean = true
  ): Promise<VideoFrameAnalyzeResponse> {
    const queryParams = new URLSearchParams({
      rtsp_url: rtspUrl,
      location_id: locationId,
      include_heatmap: includeHeatmap.toString(),
    });

    const primaryUrl = `${this.apiBase}/api/v1/crowd/rtsp-stream?${queryParams.toString()}`;
    const fallbackUrl = `${this.apiBase}/crowd/rtsp-stream?${queryParams.toString()}`;

    let res: Response;
    try {
      res = await fetch(primaryUrl, { method: "POST" });
    } catch {
      res = await fetch(fallbackUrl, { method: "POST" });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`RTSP stream analysis failed: ${errText}`);
    }

    return (await res.json()) as VideoFrameAnalyzeResponse;
  }

  /**
   * Helper to format time labels for trend charts (e.g., "15:14:02").
   */
  public formatTimeLabel(date: Date = new Date()): string {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }

  /**
   * Maintains a 2-minute (max 120 items) trend history buffer.
   */
  public updateTrendHistory(
    existing: CrowdTrendPoint[],
    currentCount: number,
    averageCount: number,
    maxPoints: number = 120
  ): CrowdTrendPoint[] {
    const now = new Date();
    const newPoint: CrowdTrendPoint = {
      timestamp: now.toISOString(),
      timeLabel: this.formatTimeLabel(now),
      current_count: Number(currentCount.toFixed(1)),
      average_count: Number(averageCount.toFixed(1)),
    };

    const updated = [...existing, newPoint];
    if (updated.length > maxPoints) {
      return updated.slice(updated.length - maxPoints);
    }
    return updated;
  }
}

export const crowdVideoService = new CrowdVideoService();
