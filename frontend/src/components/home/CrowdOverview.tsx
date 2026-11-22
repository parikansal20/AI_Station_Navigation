"use client";

import Link from "next/link";
import { Users, Eye, Sparkles, ShieldCheck } from "lucide-react";
import { LIVE_CROWD_SUMMARY, CROWD_AI_INSIGHT } from "@/lib/mock-data/home";
import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";

export function CrowdOverview() {
  const { currentCount, densityLevel, hasAnalyzed } = useCrowdMonitorStore();

  return (
    <section className="w-full py-4" id="live-crowd-overview">
      <div className="rounded-3xl bg-white border-2 border-[#134489]/30 p-5 sm:p-7 shadow-lg space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#134489]/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                Live CSRNet AI Feed
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#010105] tracking-tight">
              Station Crowd Status
            </h3>
            <p className="text-xs text-[#010105]/70 font-medium">
              AI-powered station crowd density monitoring & spatial analytics
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-[#010105] font-bold bg-[#EDEBB9] px-3 py-1 rounded-xl border border-[#134489]/30 font-mono">
              Updated {CROWD_AI_INSIGHT.lastUpdated}
            </span>
            <Link
              href="/crowd-monitor"
              className="px-4 py-2 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] font-extrabold text-xs flex items-center gap-1.5 transition-colors shadow-md border border-[#010105]"
            >
              <Eye className="w-3.5 h-3.5 text-[#FAC24A]" />
              <span>View Live Crowd</span>
            </Link>
          </div>
        </div>

        {/* Real-time Platform Crowd Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LIVE_CROWD_SUMMARY.map((item) => (
            <div
              key={item.location}
              className="p-4 rounded-2xl bg-[#EDEBB9]/40 border-2 border-[#134489]/20 space-y-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#010105] uppercase tracking-wider">
                  {item.location}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    item.densityLevel === "Low"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                      : item.densityLevel === "Moderate"
                      ? "bg-amber-100 text-amber-800 border-amber-400"
                      : "bg-red-100 text-red-800 border-red-400"
                  }`}
                >
                  {item.densityLevel} Density
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-2xl sm:text-3xl font-black text-[#010105]">
                  {item.peopleCount} <span className="text-xs font-bold text-[#010105]/70">people</span>
                </span>
                <span className="text-[11px] text-[#134489] font-black flex items-center gap-0.5">
                  <Users className="w-3 h-3 text-[#134489]" />
                  <span>Real-time</span>
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-[#134489]/20 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.densityLevel === "Low"
                      ? "bg-emerald-600 w-1/4"
                      : item.densityLevel === "Moderate"
                      ? "bg-amber-500 w-2/3"
                      : "bg-red-600 w-11/12 animate-pulse"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Real Stream Store Integration Notice if active */}
        {hasAnalyzed && (
          <div className="p-3 rounded-xl bg-[#EDEBB9] border border-[#134489]/30 text-xs flex items-center justify-between text-[#010105] font-bold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#134489]" />
              <span>Active CSRNet Stream Estimate: <strong>{currentCount} people</strong> ({densityLevel} density)</span>
            </div>
            <Link href="/crowd-monitor" className="text-[#134489] font-black underline">
              Monitor Camera Feed →
            </Link>
          </div>
        )}

        {/* AI Insight Box */}
        <div className="p-4 rounded-2xl bg-[#FAC24A] border-2 border-[#010105] flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-[#010105] text-[#FAC24A] font-bold shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-black text-[#010105] uppercase tracking-wider block">
              SAARTHI AI Congestion Recommendation
            </span>
            <p className="text-xs sm:text-sm text-[#010105] font-extrabold leading-relaxed">
              &quot;{CROWD_AI_INSIGHT.text}&quot;
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
