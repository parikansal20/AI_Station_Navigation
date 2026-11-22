"use client";

import React from "react";
import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AnalyticsSidebar() {
  const {
    hasAnalyzed,
    currentCount,
    averageCount,
    densityLevel,
    confidence,
    summary,
    advice,
    processingTimeMs,
    trendHistory,
    videoFileResult,
    yoloCount,
    csrnetCount,
    detectorMode,
    isHybridMode,
  } = useCrowdMonitorStore();

  const densityConfig = {
    Low: {
      badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      textColor: "text-emerald-600 dark:text-emerald-400",
      riskText: "LOW DENSITY • UNHINDERED MOVEMENT",
      icon: "🟢",
    },
    Medium: {
      badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      textColor: "text-amber-600 dark:text-amber-400",
      riskText: "MODERATE DENSITY • MINOR QUEUES EXPECTED",
      icon: "🟡",
    },
    High: {
      badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      textColor: "text-rose-600 dark:text-rose-400",
      riskText: "HIGH DENSITY • CROWD CONTROL ADVISED",
      icon: "🔴",
    },
  }[densityLevel];

  return (
    <div className="space-y-5 w-full">
      {/* Real AI Analysis Output Window */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl bg-card overflow-hidden">
        <CardHeader className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <CardTitle className="text-sm font-bold tracking-wide">
                Real CSRNet AI Analysis Output
              </CardTitle>
            </div>
            {hasAnalyzed && (
              <Badge className={densityConfig.badgeBg}>
                {densityConfig.icon} {densityLevel}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {!hasAnalyzed ? (
            <div className="py-12 text-center space-y-2 text-muted-foreground">
              <div className="text-4xl opacity-40">📊</div>
              <p className="text-sm font-semibold">No active analysis data yet</p>
              <p className="text-xs">Start live webcam stream or upload a video file to run real AI inference.</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className={`text-4xl font-black tracking-tight ${densityConfig.textColor}`}>
                    {currentCount >= 1 ? Math.round(currentCount) : Number(currentCount.toFixed(1))}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Instantaneous Estimated People
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-foreground">
                    {averageCount >= 1 ? Math.round(averageCount) : Number(averageCount.toFixed(1))}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    Moving Average Count
                  </span>
                </div>
              </div>

              {/* Density Risk Level */}
              <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] font-bold text-center tracking-wider text-muted-foreground uppercase">
                {densityConfig.riskText}
              </div>

              {/* Confidence & Inference Speed */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Model Confidence</span>
                  <span className="text-foreground">{Math.round(confidence * 100)}%</span>
                </div>
                <Progress value={confidence * 100} className="h-2 rounded-full" />
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Inference Latency:</span>
                  <span className="font-mono font-medium text-foreground">{processingTimeMs} ms</span>
                </div>
              </div>

              {/* Hybrid AI Model Breakdown */}
              {isHybridMode && (csrnetCount !== null || yoloCount !== null) && (
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <span>⚡</span> Hybrid AI Ensemble
                    </span>
                    <Badge variant="outline" className="text-[9px] text-indigo-300 border-indigo-500/40 font-mono">
                      12-Frame EMA + Hampel Filter
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">CSRNet Density Map</span>
                      <span className="font-bold font-mono text-indigo-400">
                        {csrnetCount !== null ? csrnetCount.toFixed(1) : "--"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">{detectorMode || "YOLOv8"} Detection</span>
                      <span className="font-bold font-mono text-emerald-400">
                        {yoloCount !== null ? yoloCount.toFixed(0) : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Backend Summary & Advice */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 text-xs space-y-1">
                <p className="font-semibold text-[#FAC24A]">{summary}</p>
                <p className="text-slate-300 leading-relaxed">{advice}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Video File Metadata (If video file analyzed) */}
      {videoFileResult && (
        <Card className="border border-indigo-500/30 bg-slate-900 text-white shadow-xl rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-[#FAC24A] uppercase tracking-wider">
              Uploaded Video File Stats
            </h4>
            <Badge variant="outline" className="text-[10px] text-indigo-300 border-indigo-500/40">
              CSRNet Processed
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Total Video Frames</span>
              <span className="font-bold">{videoFileResult.totalFrames}</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Evaluated Frames</span>
              <span className="font-bold text-indigo-400">{videoFileResult.processedFrames}</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Video Duration</span>
              <span className="font-bold">{videoFileResult.durationSeconds}s</span>
            </div>

            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Peak Crowd Count</span>
              <span className="font-bold text-rose-400">{videoFileResult.peakCount}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Real-Time Inference Trajectory Line Chart */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Real Inference Trajectory Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          {trendHistory.length < 2 ? (
            <div className="h-36 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-2xl">
              Real inference data will populate line chart...
            </div>
          ) : (
            <div className="h-40 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                <defs>
                  <linearGradient id="realChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#134489" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#134489" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 37, 75, 112, 150].map((y, i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={y}
                    x2="500"
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeDasharray="3 3"
                  />
                ))}

                {/* Plot Paths */}
                {(() => {
                  const maxVal = Math.max(
                    10,
                    ...trendHistory.map((d) => Math.max(d.current_count, d.average_count))
                  );
                  const points = trendHistory.map((d, index) => {
                    const x = (index / (trendHistory.length - 1)) * 500;
                    const y = 140 - (d.current_count / maxVal) * 120;
                    const avgY = 140 - (d.average_count / maxVal) * 120;
                    return { x, y, avgY };
                  });

                  const linePath = points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`,
                    ""
                  );
                  const areaPath = `${linePath} L 500 150 L 0 150 Z`;
                  const avgPath = points.reduce(
                    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.avgY}`,
                    ""
                  );

                  return (
                    <>
                      <path d={areaPath} fill="url(#realChartGrad)" />
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#134489"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d={avgPath}
                        fill="none"
                        stroke="#FAC24A"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                      />
                    </>
                  );
                })()}
              </svg>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-[#134489] rounded-full" /> Actual Count
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-[#FAC24A] rounded-full" /> Moving Average
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
