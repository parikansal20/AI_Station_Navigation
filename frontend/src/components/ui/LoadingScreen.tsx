"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Train, Footprints, MousePointer, Compass, Sparkles } from "lucide-react";

export default function LoadingScreen() {
  const { progress, active } = useProgress();
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!show) return null;

  const getStepText = (prog: number) => {
    if (prog < 30) return "Loading 3D station geometry…";
    if (prog < 70) return "Preparing crowd density simulation…";
    if (prog < 95) return "Configuring station navigation graph…";
    return "Finalizing architectural view…";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-900"
      >
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shadow-subtle">
            <Train className="h-7 w-7" />
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 mb-2 border border-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Lucknow Junction Central · G+1
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              SARTHI Station AI
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Interactive 3D Navigation & Crowd Simulation
            </p>
          </div>

          <div className="mt-6 w-full space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(8, progress)}%` }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-0.5">
              <span>{getStepText(progress)}</span>
              <span className="font-mono text-slate-700 font-semibold">{Math.round(progress)}%</span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4 w-full">
            <div className="flex items-center gap-1.5">
              <Footprints className="h-3.5 w-3.5 text-slate-400" />
              <span>WASD to Walk</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <MousePointer className="h-3.5 w-3.5 text-slate-400" />
              <span>Mouse Look</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-slate-400" />
              <span>Orbit View</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
