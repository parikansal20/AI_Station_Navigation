"use client";

import React from "react";
import { useCrowdMonitorStore } from "@/store/useCrowdMonitorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function LocationSelectorPanel() {
  const { inferenceLogs, hasAnalyzed } = useCrowdMonitorStore();

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Live CSRNet Inference Session Log
        </h3>
        {hasAnalyzed && (
          <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 font-mono">
            {inferenceLogs.length} Predictions Logged
          </Badge>
        )}
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl bg-card overflow-hidden">
        <CardContent className="p-4">
          {!hasAnalyzed || inferenceLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No inferences evaluated yet. Start webcam stream or upload a video file to view real-time prediction logs.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto no-scrollbar">
              {inferenceLogs.map((log) => {
                const densityBadgeStyle = {
                  Low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                  Medium: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                  High: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
                }[log.densityLevel];

                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-2xl bg-muted/50 border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-muted-foreground font-bold">
                          {log.timeLabel}
                        </span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${densityBadgeStyle}`}>
                          {log.densityLevel}
                        </Badge>
                      </div>
                      <div className="text-base font-extrabold text-foreground">
                        {log.count} <span className="text-[10px] font-normal text-muted-foreground">Passengers</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Latency: {log.processingTimeMs}ms
                      </div>
                    </div>

                    {log.heatmapBase64 && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0 bg-black">
                        <img
                          src={`data:image/jpeg;base64,${log.heatmapBase64}`}
                          alt="Heatmap Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
