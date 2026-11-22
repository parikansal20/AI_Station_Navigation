# Setup & Usage Guide - SAARTHI

This guide provides comprehensive instructions for setting up, configuring, running, and testing both the **SAARTHI Backend (FastAPI)** and **SAARTHI Frontend (Next.js)**.

---

## 📋 System Prerequisites

Before starting, ensure you have the following installed on your machine:

1. **Python**: Python 3.10 or higher
2. **Node.js**: Node.js 18.x or higher (npm 9+)
3. **Redis** *(Optional but Recommended)*: Redis server running on `localhost:6379` for response caching and rate limiting. (The system includes fallback caching if Redis is offline).
4. **OpenCV Dependencies**: Standard system libraries for image processing.

---

## 🐍 Python ML Service Setup (`backend/ml-service`)

### 1. Navigate to the ML backend directory
```bash
cd backend/ml-service
```

### 2. Create and Activate a Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the ML Development Server
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```
- ML Backend API: `http://localhost:8000`
- Interactive Swagger API Documentation: `http://localhost:8000/docs`

---

## 🟢 Node.js Auth Service Setup (`backend/auth-service`)

### 1. Navigate to the Auth service directory
```bash
cd backend/auth-service
```

### 2. Install NPM Packages
```bash
npm install
```

### 3. Run the Auth Development Server
```bash
npm run dev
```
- Auth Service API: `http://localhost:5000`
- Health check: `http://localhost:5000/health`

---

## ⚛️ Frontend Setup (Next.js 16 & Shadcn UI)

### 1. Navigate to the frontend directory
```bash
cd frontend
```

### 2. Configure Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3. Install NPM Packages
```bash
npm install
```

### 4. Run the Frontend Development Server
```bash
npm run dev
```
- The frontend web application will be accessible at: `http://localhost:3000`
- **Crowd Analytics Dashboard**: `http://localhost:3000/crowd-analyze`
- **Live Station Monitor**: `http://localhost:3000/crowd-monitor`

---

## 🐳 Running via Docker

You can containerize and run the backend service using Docker:

### Build Docker Image
```bash
cd backend
docker build -t saarthi-backend .
```

### Run Docker Container
```bash
docker run -d -p 8000:8000 --name saarthi-backend-container saarthi-backend
```

---

## 🧪 Testing the APIs

### 1. Using Interactive Swagger Docs
Open `http://localhost:8000/docs` in your browser to test endpoints directly.

### 2. Testing Image Analysis via cURL
```bash
curl -X 'POST' \
  'http://localhost:8000/crowd/analyze?include_heatmap=true' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/station_image.jpg' \
  -F 'location_id=platform-3'
```

### 3. Testing Real-time Frame Analysis via cURL
```bash
curl -X 'POST' \
  'http://localhost:8000/crowd/analyze-frame?frame_skip=3&motion_detection=true&include_heatmap=true' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/webcam_frame.jpg' \
  -F 'location_id=webcam-1'
```
