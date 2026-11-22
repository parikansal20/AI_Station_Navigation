"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, LogIn } from "lucide-react";
import { MonitorHeader } from "@/components/crowd-monitor/MonitorHeader";
import { VideoFeedViewport } from "@/components/crowd-monitor/VideoFeedViewport";
import { AnalyticsSidebar } from "@/components/crowd-monitor/AnalyticsSidebar";
import { LocationSelectorPanel } from "@/components/crowd-monitor/LocationSelectorPanel";
import { usePassengerStore } from "@/store/usePassengerStore";

export default function CrowdMonitorPage() {
  const { isLoggedIn, userRole, initAuth, authInitialized } = usePassengerStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const isStationAdmin = isLoggedIn && ["admin", "stationadmin", "operator"].includes(userRole);

  if (authInitialized && !isStationAdmin) {
    return (
      <div className="min-h-screen bg-[#E6E3DB] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border-2 border-[#134489] rounded-3xl p-8 shadow-2xl space-y-4 text-center">
          <div className="w-16 h-16 bg-red-100 border border-red-300 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[#010105]">Station Admin Access Only</h2>
            <p className="text-xs font-medium text-[#010105]/70 leading-relaxed">
              Real-time CCTV Crowd Viewport and Camera Feeds are restricted to Station Master and Admin personnel. General passengers do not have access.
            </p>
          </div>
          <div className="pt-2 space-y-2">
            <Link
              href="/"
              className="w-full py-3 rounded-xl bg-[#134489] text-white font-black text-xs hover:bg-[#0d2f61] transition-all flex items-center justify-center gap-2 shadow-md"
            >
              Return to Passenger Home
            </Link>
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl border-2 border-[#134489]/30 text-[#010105] font-black text-xs hover:border-[#134489] transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#134489]" />
              Log In as Station Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: "#E6E3DB" }}>
      {/* ── Header Bar ────────────────────────────────────────────── */}
      <MonitorHeader />

      {/* ── Dashboard Core Layout ──────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Main Grid: Video Feed Viewport + Analytics Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Viewport (7 Cols on desktop) */}
          <section aria-label="Live Video Camera Feed" className="lg:col-span-7">
            <VideoFeedViewport />
          </section>

          {/* Right Sidebar Analytics (5 Cols on desktop) */}
          <section aria-label="Real-Time Analytics & Trends" className="lg:col-span-5">
            <AnalyticsSidebar />
          </section>
        </div>

        {/* Bottom Control Panel: Location Selector & System Alerts */}
        <section aria-label="Location Feeds and Alert Log">
          <LocationSelectorPanel />
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md py-4 px-4 sm:px-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            SARTHI Station AI &nbsp;&bull;&nbsp; Lucknow Junction Central &nbsp;&bull;&nbsp; Real-Time Crowd Intelligence
          </p>
          <p className="font-mono text-[11px] text-[#134489] dark:text-[#FAC24A]">
            Active Endpoint: /api/v1/crowd/analyze-frame
          </p>
        </div>
      </footer>
    </div>
  );
}
