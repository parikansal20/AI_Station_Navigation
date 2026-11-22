"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSimulationStore } from "@/store/simulationStore";
import { Train, Globe, Footprints, Flame, MousePointer, AlertTriangle, X, ArrowLeft, Maximize2, Compass, Eye } from "lucide-react";

// Dynamic imports with SSR disabled for WebGL canvas and Drei helpers
const SceneCanvas = dynamic(() => import("@/components/simulation/SceneCanvas"), { ssr: false });
const MiniMap = dynamic(() => import("@/components/simulation/MiniMap"), { ssr: false });
const WaypointSelector = dynamic(() => import("@/components/simulation/WaypointSelector"), { ssr: false });
const SearchBar = dynamic(() => import("@/components/simulation/SearchBar"), { ssr: false });
const NavigationPanel = dynamic(() => import("@/components/simulation/NavigationPanel"), { ssr: false });
const FacilityModal = dynamic(() => import("@/components/simulation/FacilityModal"), { ssr: false });
const TouchControls = dynamic(() => import("@/components/simulation/TouchControls"), { ssr: false });
const LoadingScreen = dynamic(() => import("@/components/ui/LoadingScreen"), { ssr: false });

interface Interactive3DMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDestination?: string;
}

export function Interactive3DMapModal({ isOpen, onClose, initialDestination }: Interactive3DMapModalProps) {
  const controlMode = useSimulationStore((s) => s.controlMode);
  const setControlMode = useSimulationStore((s) => s.setControlMode);
  const navigationMode = useSimulationStore((s) => s.navigationMode);
  const setNavigationMode = useSimulationStore((s) => s.setNavigationMode);
  const isPointerLocked = useSimulationStore((s) => s.isPointerLocked);
  const showCrowdHeatmap = useSimulationStore((s) => s.showCrowdHeatmap);
  const toggleCrowdHeatmap = useSimulationStore((s) => s.toggleCrowdHeatmap);
  const setIsMobile = useSimulationStore((s) => s.setIsMobile);
  const isNearObstacle = useSimulationStore((s) => s.isNearObstacle);
  const obstacleName = useSimulationStore((s) => s.obstacleName);
  const setNavigationDestination = useSimulationStore((s) => s.setNavigationDestination);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    if (isOpen && initialDestination) {
      setNavigationDestination(initialDestination);
    }
  }, [isOpen, initialDestination, setNavigationDestination]);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* 3D WebGL Canvas Viewport */}
      <div className="relative h-full w-full overflow-hidden">
        {/* Loading Screen */}
        <LoadingScreen />

        {/* 3D WebGL Canvas */}
        <SceneCanvas />

        {/* Touch Controls Overlay for Mobile */}
        <TouchControls />

        {/* TOP HEADER NAVIGATION BAR OVERLAY */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
          {/* Left: Close & Station Title */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-amber-400 hover:text-slate-950 transition-all"
              title="Return to 2D Station Map"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to 2D Map</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-900/80 px-3.5 py-2 text-white backdrop-blur-md">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm">
                <Train className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-xs font-bold tracking-tight text-white leading-tight">
                  Lucknow Junction 3D Simulation
                </h1>
                <p className="text-[10px] font-medium text-amber-300">
                  Interactive Spatial Twin & AR Navigation
                </p>
              </div>
            </div>
          </div>

          {/* Center Search Subsystem */}
          <div className="pointer-events-auto flex items-center gap-2">
            <SearchBar />
          </div>

          {/* Control Mode Switcher & Tools */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {/* Guided vs Free Explore Mode Switcher */}
            <div className="flex rounded-xl border border-amber-400/20 bg-slate-900/90 p-1 backdrop-blur-md text-xs font-medium">
              <button
                onClick={() => setNavigationMode("guided")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  navigationMode === "guided"
                    ? "bg-amber-400 text-slate-950 shadow-sm font-extrabold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Guided Mode: Landmark-based turn-by-turn navigation"
              >
                <Compass className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Guided Mode</span>
              </button>
              <button
                onClick={() => setNavigationMode("explore")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  navigationMode === "explore"
                    ? "bg-amber-400 text-slate-950 shadow-sm font-extrabold"
                    : "text-slate-300 hover:text-white"
                }`}
                title="Explore Mode: Free 3D walking & station familiarization"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Free Explore</span>
              </button>
            </div>

            {/* Orbit vs 1st Person Control Mode Switcher */}
            <div className="flex rounded-xl border border-white/10 bg-slate-900/80 p-1 backdrop-blur-md text-xs font-medium">
              <button
                onClick={() => setControlMode("orbit")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  controlMode === "orbit"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Orbit View</span>
              </button>
              <button
                onClick={() => setControlMode("fps")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  controlMode === "fps"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Footprints className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">1st Person Walk</span>
              </button>
            </div>

            <button
              onClick={toggleCrowdHeatmap}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-md transition-all ${
                showCrowdHeatmap
                  ? "border-emerald-400 bg-emerald-950/80 text-emerald-300"
                  : "border-white/10 bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Flame className={`h-3.5 w-3.5 ${showCrowdHeatmap ? "text-emerald-400" : "text-slate-400"}`} />
              <span className="hidden md:inline">{showCrowdHeatmap ? "Heatmap On" : "Heatmap Off"}</span>
            </button>

            <WaypointSelector />

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white border border-red-500/50 shadow-md backdrop-blur-md"
              title="Close 3D Simulation Modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* OBSTACLE PROXIMITY ALERT HUD */}
        {isNearObstacle && (
          <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center px-4">
            <div className="flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-950/90 px-4 py-2 text-amber-200 shadow-xl backdrop-blur-md">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-bounce" />
              <span className="text-xs font-bold">
                Proximity Warning: Approaching {obstacleName || "Physical Surface"} (Passing Blocked)
              </span>
            </div>
          </div>
        )}

        {/* ACTIVE TURN-BY-TURN NAVIGATION PANEL */}
        <NavigationPanel />

        {/* POINTER LOCK DESKTOP HINT BANNER */}
        {controlMode === "fps" && !isPointerLocked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-20 flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-white/20 bg-slate-900/90 px-4 py-2 text-white shadow-xl backdrop-blur-md">
              <MousePointer className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Click screen to lock mouse look (ESC to unlock). Use WASD to walk.
              </span>
            </div>
          </div>
        )}

        {/* BOTTOM RIGHT MINI-MAP */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-20">
          <MiniMap />
        </div>

        {/* INTERACTIVE FACILITY DETAIL MODAL */}
        <FacilityModal />
      </div>
    </div>
  );
}
