# Crowd Analytics API Reference

The **SAARTHI Crowd Analytics API** provides endpoints for single image crowd density estimation, uploaded video file analysis, real-time video stream frame evaluation, RTSP CCTV camera stream ingestion, and cached status polling.

---

## 📌 Base URL & Endpoints Overview

- **Base URL**: `http://localhost:8000`
- **API Prefix**: `/api/v1/crowd` or `/crowd` (Root alias)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/crowd/analyze` | Estimate crowd count & density from a single image |
| `POST` | `/crowd/analyze-video` | Full analytical breakdown of an uploaded video file |
| `POST` | `/crowd/analyze-frame` | Real-time stream/webcam frame analysis with motion detection & temporal smoothing |
| `POST` | `/crowd/rtsp-stream` | Ingest and evaluate an active RTSP / IP Camera stream frame |
| `GET` | `/crowd/status/{location_id}` | Retrieve cached crowd status for rapid client polling |

---

## 🛠️ Endpoint Specifications

### 1. Single Image Analysis (`POST /crowd/analyze`)

Analyzes a single uploaded image, estimates total crowd count, classifies crowd density level, provides practical passenger advice, and optionally returns a Base64-encoded density heatmap overlay.

#### Request Parameters
- **Form Data**:
  - `file` (File, Required): Image file (`JPEG`, `PNG`, `AVIF`).
  - `location_id` (String, Optional): Station location identifier (e.g., `"platform-3"`).
- **Query Parameters**:
  - `include_heatmap` (Boolean, Default: `false`): If `true`, returns a Base64 encoded JPEG overlay of the density heatmap.

#### Response Body (`200 OK`)
```json
{
  "location_id": "platform-3",
  "estimated_count": 42.5,
  "density_level": "Medium",
  "confidence": 0.88,
  "summary": "Moderate crowd detected at platform-3",
  "advice": "Platform is moderately busy. Maintain safe distance near yellow line.",
  "processing_time_ms": 145.2,
  "timestamp": "2026-07-27T12:00:00Z",
  "heatmap_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

---

### 2. Video File Analysis (`POST /crowd/analyze-video`)

Processes an uploaded video file frame-by-frame (with configurable frame skip) to generate aggregate crowd statistics, peak counts, frame samples, and temporal density trends.

#### Request Parameters
- **Form Data**:
  - `file` (File, Required): Video file (`MP4`, `AVI`, `MOV`, `MKV`, `WebM`).
  - `location_id` (String, Optional, Default: `"video-upload"`): Location identifier.
- **Query Parameters**:
  - `frame_skip` (Integer, Default: `5`, Min: `1`, Max: `15`): Process 1 frame every N frames.
  - `include_heatmap` (Boolean, Default: `true`): Include heatmaps for sampled frames.

#### Response Body (`200 OK`)
```json
{
  "filename": "cctv_entrance_sample.mp4",
  "total_frames": 300,
  "processed_frames": 60,
  "fps": 30.0,
  "duration_seconds": 10.0,
  "current_count": 35.0,
  "average_count": 28.4,
  "peak_count": 52.0,
  "density_level": "Medium",
  "confidence": 0.89,
  "timestamp": "2026-07-27T12:00:00Z",
  "sample_frames": [
    {
      "current_count": 22.0,
      "average_count": 22.0,
      "density_level": "Low",
      "confidence": 0.91,
      "timestamp": "2026-07-27T12:00:01Z",
      "motion_detected": true,
      "processing_time_ms": 32.1,
      "location_id": "video-upload",
      "yolo_count": 20.0,
      "csrnet_count": 24.0,
      "is_hybrid_mode": true
    }
  ],
  "is_hybrid_mode": true
}
```

---

### 3. Real-time Video Stream Frame Analysis (`POST /crowd/analyze-frame`)

Designed for live webcam feeds or web client stream frames. Features motion detection (skipping inference on static frames) and Exponential Moving Average (EMA) temporal smoothing for stable count reporting.

#### Request Parameters
- **Form Data**:
  - `file` (File, Required): Frame image file (`JPEG`, `PNG`).
  - `location_id` (String, Optional, Default: `"webcam"`): Stream identifier.
- **Query Parameters**:
  - `frame_skip` (Integer, Default: `3`, Min: `1`, Max: `10`): Inference step interval.
  - `motion_detection` (Boolean, Default: `true`): Enable motion detection frame filtering.
  - `include_heatmap` (Boolean, Default: `false`): Include density heatmap overlay.

#### Response Body (`200 OK`)
```json
{
  "current_count": 18.0,
  "average_count": 17.5,
  "density_level": "Low",
  "confidence": 0.92,
  "timestamp": "2026-07-27T12:00:00Z",
  "motion_detected": true,
  "processing_time_ms": 28.5,
  "location_id": "webcam-1",
  "summary": "Low crowd density",
  "advice": "Platform area is clear for boarding.",
  "heatmap_base64": null,
  "yolo_count": 17.0,
  "csrnet_count": 18.0,
  "detector_mode": "YOLOv8",
  "is_hybrid_mode": true
}
```

---

### 4. RTSP CCTV Stream Ingestion (`POST /crowd/rtsp-stream`)

Triggers real-time frame capture and inference directly from a network RTSP camera URL.

#### Request Parameters
- **Query Parameters**:
  - `rtsp_url` (String, Required): RTSP connection URL (e.g., `rtsp://admin:pass@192.168.1.50:554/stream1`).
  - `location_id` (String, Optional, Default: `"rtsp-cctv"`): Camera ID.
  - `include_heatmap` (Boolean, Default: `true`): Include density overlay.

#### Response Body (`200 OK`)
Returns a standard `VideoFrameAnalyzeResponse` object.

---

### 5. Get Cached Crowd Status (`GET /crowd/status/{location_id}`)

Retrieves the latest cached analysis for a location without triggering ML re-inference. Useful for lightweight frontend polling.

#### Response Body (`200 OK`)
```json
{
  "location_id": "platform-3",
  "status": "available",
  "data": {
    "location_id": "platform-3",
    "estimated_count": 42.5,
    "density_level": "Medium",
    "confidence": 0.88,
    "summary": "Moderate crowd detected at platform-3",
    "advice": "Platform is moderately busy.",
    "processing_time_ms": 145.2,
    "timestamp": "2026-07-27T12:00:00Z",
    "heatmap_base64": null
  }
}
```

---

## ⚡ Rate Limiting & HTTP Error Codes

| Status Code | Description | Reason |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid file type or invalid RTSP URL stream. |
| `429 Too Many Requests` | IP rate limit exceeded (Default: 60 requests/min). |
| `500 Internal Error` | ML inference engine failure or video decoding error. |
