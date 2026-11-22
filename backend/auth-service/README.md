# 🟢 SAARTHI Auth & Core Node.js Service

This microservice provides Authentication, User Management, JWT Token verification, and Core API endpoints for SAARTHI.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation & Setup
Get-ChildItem -Force
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

Server will run at `http://localhost:5000`.

## 📌 API Endpoints

- `GET /health` - Health check status
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login & JWT issuance
- `GET /api/v1/auth/me` - Authenticated user profile (Requires Bearer token)
