# System Architecture & ML Pipeline - SAARTHI

This document presents the detailed architectural design and machine learning pipeline powering the **SAARTHI Crowd Prediction & Video Analytics System**.

---

## 🏗️ High-Level System Architecture

SAARTHI follows a modular, decoupled fullstack architecture consisting of a **Next.js 16 (React 19) Frontend**, a high-performance **FastAPI Python Backend**, an **In-Memory Redis Caching & Rate-Limiting Layer**, and a **PyTorch ML Inference Engine**.

```
 +-------------------------------------------------------------------------+
 |                            USER INTERFACE                               |
 |                    Next.js 16 + React 19 Frontend                       |
 |  - Analytics Dashboard (/crowd-analyze)                                 |
 |  - Station Camera Monitor (/crowd-monitor)                              |
 |  - Interactive Base64 Heatmap Overlay & Video Viewport                  |
 +------------------------------------+------------------------------------+
                                      |
                                      | HTTP REST / Form-Data
                                      v
 +-------------------------------------------------------------------------+
 |                           FASTAPI BACKEND                               |
 |  - API Layer (/api/v1/crowd): Input Validation & IP Rate Limiting       |
 |  - Service Layer: CrowdService, VideoCrowdService                       |
 |  - Background Scheduler: APScheduler periodic cleanup tasks             |
 +------------------+------------------------------------+------------------+
                    |                                    |
     Redis Lookup   |                                    | Inference Call
     & Caching      v                                    v
 +----------------------+                 +-------------------------------+
 |  REDIS CACHE STORE   |                 |      ML INFERENCE PIPELINE    |
 | - Fast status lookup |                 | - Hybrid Ensemble Detector    |
 | - Rate limiting keys |                 | - CSRNet (Density Mapping)    |
 | - Sliding EMA count  |                 | - DMCount / YOLO / OpenCV HOG |
 +----------------------+                 | - Motion Detection & Smoothing|
                                          +-------------------------------+
```

---

## 🧩 Backend Decoupled Polyglot Microservices Architecture

The backend (`backend/`) is structured into decoupled services separating Machine Learning workloads from Authentication:

```
backend/
├── ml-service/                   # 🐍 Python FastAPI Machine Learning Engine (Port 8000)
│   ├── src/
│   │   ├── api/v1/               # Controller Layer for image, video & RTSP evaluation
│   │   ├── core/                 # App Settings & Redis Cache Connections
│   │   ├── ml/                   # Crowd models (CSRNet, DMCount, Hybrid Ensemble)
│   │   ├── models/               # Pydantic schemas
│   │   └── services/             # Crowd density & video temporal inference logic
│   └── tests/                    # Pytest suite
│
└── auth-service/                 # 🟢 Node.js / Express Auth Service (Port 5000)
    └── src/
        ├── controllers/          # Registration, Login & Profile controllers
        ├── middlewares/          # JWT Verification & Error handling
        ├── models/               # User schema
        ├── routes/               # /api/v1/auth REST routes
        └── services/             # Password hashing & JWT token issuance
```

---

## 🧠 Machine Learning Model Pipeline

SAARTHI employs a **Hybrid Ensemble Architecture** for crowd estimation to achieve high precision across both sparse (few people) and extremely dense (heavy station congestion) scenes.

```
                  +-----------------------------------+
                  |        Input Image / Frame        |
                  +-----------------+-----------------+
                                    |
                         +----------+----------+
                         | Motion Filter Check |
                         +----------+----------+
                                    | (If Motion Detected)
                                    v
                   +---------------------------------+
                   |     Hybrid Ensemble Detector    |
                   +----------------+----------------+
                                    |
           +------------------------+------------------------+
           |                                                 |
           v                                                 v
+-----------------------+                         +-----------------------+
|     CSRNet / DMCount  |                         |  YOLOv8 / OpenCV HOG  |
|  Density Map Model    |                         |  Bounding Box Detector|
|  (Best for High Crowds)|                        |  (Best for Low Crowds)|
+-----------+-----------+                         +-----------+-----------+
            |                                                 |
            +-----------------------+-------------------------+
                                    v
                  +-----------------------------------+
                  |    Weighted Adaptive Blending     |
                  +-----------------+-----------------+
                                    v
                  +-----------------------------------+
                  | Temporal EMA Filter (Video Feeds) |
                  +-----------------+-----------------+
                                    v
                  +-----------------------------------+
                  |  Base64 Heatmap Overlay Generator |
                  +-----------------------------------+
```

### 1. CSRNet (Congested Scene Recognition Network)
- Uses a VGG-16 feature extraction front-end coupled with dilated convolutional layers in the back-end.
- Generates a continuous **2D Density Map** where the spatial integral over any region yields the exact estimated count.
- Highly accurate for dense platform crowds where individual bounding box detection suffers from heavy occlusion.

### 2. YOLOv8 / OpenCV HOG Bounding Box Detector
- Performs direct object detection for human figures.
- Excels in low to moderate crowd densities where individuals are clearly separated.

### 3. Adaptive Hybrid Blending
- If estimated count is low (< 15 people), higher weight is assigned to the Bounding Box Detector.
- If density increases, higher weight transitions adaptively to the CSRNet density map engine.

### 4. Exponential Moving Average (EMA) Temporal Smoothing
- For real-time video feeds and webcam streams, frame-by-frame raw predictions can fluctuate due to camera noise.
- EMA calculates a smoothed running count:
  $$\text{Count}_{\text{smoothed}} = \alpha \cdot \text{Count}_{\text{current}} + (1 - \alpha) \cdot \text{Count}_{\text{previous}}$$
- Keeps UI charts and status badges stable without jitter.

---

## 🎨 Frontend Architecture & State Management

The Next.js 16 frontend (`frontend/src`) is built with React 19, Tailwind CSS, Shadcn UI components, and Zustand for state management.

### Key Pages
- **`/crowd-analyze`**: Interactive portal for single image and video file upload analysis. Supports live model selection (CSRNet, DMCount, SCAR), density heatmaps, and timeline analytics.
- **`/crowd-monitor`**: Multi-camera grid dashboard for live CCTV RTSP feeds, displaying instantaneous density metrics, station warnings, and real-time graphs.

### Core Components & Services
- **`VideoCrowdDashboard.tsx`**: Main analytics container handling file upload drops, video timeline scrubbing, and analytical metric cards.
- **`crowdVideoService.ts`**: Frontend API client wrapper communicating with the FastAPI backend via `fetch` and handling Base64 canvas overlay rendering.
