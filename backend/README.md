# 🏗️ SAARTHI Microservice Backend Architecture

SAARTHI follows a modular, polyglot microservice backend architecture separating heavy machine learning inference workloads from high-concurrency authentication and core API logic.

---

## 📂 Directory Structure

```
backend/
├── ml-service/             # 🐍 Python FastAPI Machine Learning Engine
│   ├── src/                # Hybrid Ensemble (CSRNet, DMCount, YOLO, Motion Detection)
│   ├── tests/              # Pytest test suite
│   ├── scripts/            # Dataset & model weight downloader scripts
│   ├── requirements.txt    # Python dependencies (PyTorch, OpenCV, FastAPI)
│   └── Dockerfile          # Container environment
│
└── auth-service/           # 🟢 Node.js / Express Auth & User Management Service
    ├── src/                # Controllers, Middlewares, Routes, Models, Services
    ├── package.json        # Node.js dependencies
    └── Dockerfile          # Container environment
```

---

## 🚦 Port Allocation

| Service | Technology | Default Port | Description |
| :--- | :--- | :--- | :--- |
| **`auth-service`** | Node.js / Express | `5000` | User Registration, Login, JWT Issuance & Verification |
| **`ml-service`** | Python / FastAPI | `8000` | Crowd Analytics, Image/Video Density Maps, RTSP Streams |

---

## ⚡ Quick Start

### 1. Run Node.js Auth Service
```bash
cd backend/auth-service
npm install
npm run dev
```

### 2. Run Python ML Service
```bash
cd backend/ml-service
pip install -r requirements.txt
python -m src.main
```
