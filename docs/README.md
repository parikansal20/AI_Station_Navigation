# SAARTHI - Station AI & Crowd Analytics System

Welcome to the **SAARTHI** documentation repository. SAARTHI is a modern, fullstack AI-powered system designed for real-time crowd density analysis, video stream analytics, passenger guidance, and station monitoring.

---

## 📑 Quick Links & Table of Contents

- 🚀 [Setup & Quickstart Guide](file:///d:/Desktop/SAARTHI/docs/setup_and_usage.md)
  - Environment Requirements
  - Backend Installation & Running (FastAPI)
  - Frontend Installation & Running (Next.js)
  - Running via Docker
  - Testing APIs
- 🔌 [Crowd Analytics API Reference](file:///d:/Desktop/SAARTHI/docs/api/crowd_api.md)
  - `/crowd/analyze` (Image Crowd Analysis)
  - `/crowd/analyze-video` (Video File Analysis)
  - `/crowd/analyze-frame` (Real-time Stream/Webcam Frame Analysis)
  - `/crowd/rtsp-stream` (CCTV RTSP Ingestion)
  - `/crowd/status/{location_id}` (Cached Status Polling)
- 🏗️ [System Architecture & ML Pipeline](file:///d:/Desktop/SAARTHI/docs/architecture/system_overview.md)
  - Layered Architecture Overview
  - ML Model Pipeline (CSRNet, DMCount, Hybrid Detector, EMA Temporal Filter)
  - Frontend Component Design & State Management

---

## 📂 Repository Structure

```
SAARTHI/
├── backend/                  # FastAPI Python Backend Service
│   ├── alembic/              # Database migrations
│   ├── scripts/              # Helper & benchmark scripts
│   ├── src/                  # Application code
│   │   ├── api/v1/           # API routes & rate limiters
│   │   ├── core/             # Redis, DB, App configuration
│   │   ├── ml/               # Crowd counting ML models & detectors
│   │   ├── models/           # Pydantic schemas & response models
│   │   ├── services/         # Crowd analysis logic & video pipeline
│   │   └── main.py           # FastAPI entrypoint
│   ├── tests/                # Unit & Integration tests
│   ├── Dockerfile            # Container configuration
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js 16 + React 19 Frontend App
│   ├── src/
│   │   ├── app/              # App Router (/crowd-analyze, /crowd-monitor)
│   │   ├── components/       # VideoCrowdDashboard & Monitor viewports
│   │   ├── services/         # API Service client (crowdVideoService.ts)
│   │   ├── store/            # Zustand state stores
│   │   └── types/            # TypeScript interfaces
│   ├── public/               # Static assets & overlays
│   └── package.json          # Dependencies & npm scripts
│
└── docs/                     # Documentation Directory
    ├── README.md             # Master Index (This File)
    ├── setup_and_usage.md    # Environment Setup & Usage Guide
    ├── api/                  # API Endpoint Specs
    │   └── crowd_api.md
    └── architecture/         # System Architecture & ML Details
        └── system_overview.md
```
