"use client";

import { useState, useRef, useEffect } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WaypointSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const teleportTo = useSimulationStore((s) => s.teleportTo);
  const setNavigationDestination = useSimulationStore((s) => s.setNavigationDestination);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-auto relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
      >
        <MapPin className="h-3.5 w-3.5 text-blue-600" />
        <span>Quick Teleport</span>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 md:left-0 top-11 z-40 flex max-h-[60vh] w-72 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-dropdown scrollbar-thin"
          >
            <div className="mb-1.5 border-b border-slate-100 px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Station Waypoints</span>
              <span className="text-[10px] text-slate-400 font-normal">Teleport Camera</span>
            </div>

            <div className="flex flex-col gap-1">
              {LUCKNOW_STATION_FACILITIES.map((fac) => (
                <button
                  key={fac.id}
                  onClick={() => {
                    setNavigationDestination(fac.id);
                    teleportTo(fac.id);
                    setIsOpen(false);
                  }}
                  className="group flex items-center justify-between rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-700 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {fac.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {fac.labelEnglish}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {fac.labelHindi}
                      </div>
                    </div>
                  </div>

                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0 border border-slate-200">
                    {fac.floor === "1F" ? "1F" : "Ground"}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
