import type { NextConfig } from "next";

const configuredBackendUrl =
  process.env.AUTH_API_URL ||
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.VERCEL
    ? "https://saarthi-auth-service.onrender.com"
    : "http://127.0.0.1:5000");

// Accept either the service origin or its full /api/v1 URL. The deployment
// templates expose NEXT_PUBLIC_API_BASE_URL, while local setups commonly use
// AUTH_API_URL, so normalizing here keeps every /backend-api call consistent.
const backendApiUrl = `${configuredBackendUrl.replace(/\/+$/, "")}${
  /\/api\/v1$/.test(configuredBackendUrl.replace(/\/+$/, "")) ? "" : "/api/v1"
}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
