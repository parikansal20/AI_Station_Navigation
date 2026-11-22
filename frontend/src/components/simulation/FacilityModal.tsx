"use client";

import { useSimulationStore } from "@/store/simulationStore";
import { X, Navigation, MapPin, Check, Layers, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FacilityModal() {
  const selectedFacility = useSimulationStore((s) => s.selectedFacility);
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);
  const teleportTo = useSimulationStore((s) => s.teleportTo);
  const setNavigationDestination = useSimulationStore((s) => s.setNavigationDestination);

  if (!selectedFacility) return null;

  const getCrowdBadgeStyle = (level: string) => {
    switch (level) {
      case "High":
        return "bg-red-50 text-red-700 border-red-200";
      case "Moderate":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <AnimatePresence>
      <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-overlay"
        >
          <button
            onClick={() => setSelectedFacility(null)}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-4 flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl border border-blue-100 shrink-0">
              {selectedFacility.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {selectedFacility.labelEnglish}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {selectedFacility.labelHindi}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span>{selectedFacility.floor === "1F" ? "1st Floor (FOB)" : "Ground Floor"}</span>
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold ${getCrowdBadgeStyle(
                selectedFacility.crowdLevel
              )}`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Crowd: {selectedFacility.crowdLevel}</span>
            </span>
          </div>

          <p className="mb-5 text-xs leading-relaxed text-slate-600">
            {selectedFacility.description}
          </p>

          <div className="mb-6">
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Services & Amenities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedFacility.amenities.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-medium"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              onClick={() => {
                teleportTo(selectedFacility.position);
                setSelectedFacility(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              <span>Teleport</span>
            </button>
            <button
              onClick={() => {
                setNavigationDestination(selectedFacility.id);
                setSelectedFacility(null);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-subtle hover:bg-blue-700 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Navigate Here</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
