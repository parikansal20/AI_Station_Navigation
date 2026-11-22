"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HclTechMark } from "@/components/HclTechMark";

export function MonitorHeader() {
  const {
    mode,
    setMode,
    exportReport,
    resetSession,
    hasAnalyzed,
  } = useCrowdMonitorStore();

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#134489] text-white border-b border-[#134489]/50 shadow-xl relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Station Info & Branding */}
        <div className="flex items-center gap-3.5">
          <Link href="/" className="w-11 h-11 rounded-2xl bg-[#FAC24A] text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-[#FAC24A]/20 shrink-0 hover:scale-105 transition-transform">
            🚉
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-[0.2em] text-[#FAC24A] uppercase">
                SARTHI Station AI • CSRNet Deep Learning Engine
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Real-Time Video Crowd Monitor
            </h1>
          </div>
        </div>

        {/* Live Clock & Date */}
        <div className="hidden 2xl:flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
          <div className="text-right">
            <div className="font-mono text-sm font-bold text-[#FAC24A]">
              {currentTime || "15:40:54 PM"}
            </div>
            <div className="text-slate-300 text-[11px]">{currentDate}</div>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
            AI CORE ACTIVE
          </Badge>
        </div>

        {/* Controls & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 xl:ml-auto">
          {/* Mode Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center bg-slate-900/80 p-1 rounded-xl border border-white/15 text-xs font-semibold">
            <button
              onClick={() => setMode("webcam")}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                mode === "webcam"
                  ? "bg-[#FAC24A] text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              📹 Live Webcam
            </button>
            <button
              onClick={() => setMode("upload")}
              className={`px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
                mode === "upload"
                  ? "bg-[#FAC24A] text-slate-950 shadow-md font-bold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              📁 Upload Video
            </button>
            <Link
              href="/crowd-analyze"
              className="px-3.5 py-2 rounded-lg transition-all text-center whitespace-nowrap text-slate-300 hover:text-white hover:bg-white/10"
            >
              🖼️ Single Snapshot
            </Link>
          </div>

          {/* Reset Session Button */}
          {hasAnalyzed && (
            <Button
              onClick={resetSession}
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs rounded-xl"
            >
              🔄 Reset
            </Button>
          )}

          {/* Export Report Button */}
          <Button
            onClick={exportReport}
            disabled={!hasAnalyzed}
            size="sm"
            className="w-full sm:w-auto bg-[#FAC24A] hover:bg-[#e5b140] text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-[#FAC24A]/20 disabled:opacity-50"
          >
            📥 Export AI Report
          </Button>

          <HclTechMark />
        </div>
      </div>
    </header>
  );
}
