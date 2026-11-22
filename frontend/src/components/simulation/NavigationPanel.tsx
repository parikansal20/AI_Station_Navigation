"use client";

import { useEffect, useState } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";
import { stationAudioService } from "@/utils/stationAudioService";
import {
  Compass,
  X,
  MapPin,
  Target,
  ArrowUpDown,
  Ruler,
  Clock,
  Accessibility,
  Navigation,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Eye,
  Footprints,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NavigationPanel() {
  const navigationSourceFacility = useSimulationStore((s) => s.navigationSourceFacility);
  const navigationTargetFacility = useSimulationStore((s) => s.navigationTargetFacility);
  const activePathResult = useSimulationStore((s) => s.activePathResult);
  const isAccessibleRouteMode = useSimulationStore((s) => s.isAccessibleRouteMode);
  const toggleAccessibleRouteMode = useSimulationStore((s) => s.toggleAccessibleRouteMode);
  const isVoiceEnabled = useSimulationStore((s) => s.isVoiceEnabled);
  const toggleVoiceEnabled = useSimulationStore((s) => s.toggleVoiceEnabled);
  const setNavigationRoute = useSimulationStore((s) => s.setNavigationRoute);
  const clearNavigation = useSimulationStore((s) => s.clearNavigation);
  const teleportTo = useSimulationStore((s) => s.teleportTo);

  const isLiveNavigating = useSimulationStore((s) => s.isLiveNavigating);
  const currentNavStepIndex = useSimulationStore((s) => s.currentNavStepIndex);
  const hasArrived = useSimulationStore((s) => s.hasArrived);
  const startLiveNavigation = useSimulationStore((s) => s.startLiveNavigation);
  const nextNavStep = useSimulationStore((s) => s.nextNavStep);
  const prevNavStep = useSimulationStore((s) => s.prevNavStep);
  const setNavStepIndex = useSimulationStore((s) => s.setNavStepIndex);

  const headBobEnabled = useSimulationStore((s) => s.headBobEnabled);
  const toggleHeadBob = useSimulationStore((s) => s.toggleHeadBob);
  const isAudioMuted = useSimulationStore((s) => s.isAudioMuted);
  const toggleAudioMuted = useSimulationStore((s) => s.toggleAudioMuted);

  const [isChangingSource, setIsChangingSource] = useState(false);
  const [isChangingTarget, setIsChangingTarget] = useState(false);

  useEffect(() => {
    if (activePathResult && (isLiveNavigating || hasArrived)) {
      stationAudioService.playStationChime();
    }

    if (
      isVoiceEnabled &&
      activePathResult &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();

      let textToSpeak = "";
      if (hasArrived) {
        textToSpeak = `You have arrived at ${navigationTargetFacility?.labelEnglish || "your destination"}.`;
      } else if (isLiveNavigating && activePathResult.instructionsEnglish[currentNavStepIndex]) {
        textToSpeak = activePathResult.instructionsEnglish[currentNavStepIndex];
      } else if (activePathResult.instructionsEnglish.length > 0) {
        textToSpeak = `Route to ${navigationTargetFacility?.labelEnglish}. ${activePathResult.instructionsEnglish[0]}`;
      }

      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [currentNavStepIndex, isLiveNavigating, hasArrived, isVoiceEnabled, activePathResult, navigationTargetFacility]);

  if (!navigationTargetFacility || !activePathResult) return null;

  const totalSteps = Math.max(1, activePathResult.nodes.length - 1);
  const progressPercent = Math.min(100, Math.round((currentNavStepIndex / totalSteps) * 100));

  const currentNode = activePathResult.nodes[Math.min(currentNavStepIndex, activePathResult.nodes.length - 1)];

  const activeEngInstruction =
    activePathResult.instructionsEnglish[currentNavStepIndex] ||
    activePathResult.instructionsEnglish[activePathResult.instructionsEnglish.length - 1] ||
    "Proceed to destination";

  const activeHinInstruction =
    activePathResult.instructionsHindi[currentNavStepIndex] ||
    activePathResult.instructionsHindi[activePathResult.instructionsHindi.length - 1] ||
    "गंतव्य की ओर बढ़ें";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="pointer-events-auto fixed bottom-6 left-6 z-30 flex max-w-md w-[calc(100vw-3rem)] md:w-96 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-overlay backdrop-blur-md"
    >
      <div className="mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 tracking-tight">
              Station Navigation Guidance
            </span>
          </div>
          <button
            onClick={clearNavigation}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Close Route"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <span>Start:</span>
            </div>
            <div className="relative flex-1 truncate text-right">
              {isChangingSource ? (
                <select
                  autoFocus
                  onChange={(e) => {
                    setNavigationRoute(e.target.value === "current" ? null : e.target.value, navigationTargetFacility.id);
                    setIsChangingSource(false);
                  }}
                  onBlur={() => setIsChangingSource(false)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 font-medium outline-none focus:border-blue-600"
                  defaultValue={navigationSourceFacility?.id || "current"}
                >
                  <option value="current">📍 Current Camera Location</option>
                  {LUCKNOW_STATION_FACILITIES.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.labelEnglish} ({fac.floor})
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsChangingSource(true)}
                  className="truncate font-semibold text-slate-900 hover:text-blue-600 transition-colors text-xs"
                >
                  {navigationSourceFacility ? navigationSourceFacility.labelEnglish : "Current Camera Location"}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center -my-1">
            <button
              onClick={() => {
                if (navigationSourceFacility) {
                  setNavigationRoute(navigationTargetFacility.id, navigationSourceFacility.id);
                }
              }}
              className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900 transition-colors shadow-subtle"
              title="Swap Start & Destination"
            >
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
              <Target className="h-3.5 w-3.5 text-rose-600" />
              <span>Goal:</span>
            </div>
            <div className="relative flex-1 truncate text-right">
              {isChangingTarget ? (
                <select
                  autoFocus
                  onChange={(e) => {
                    setNavigationRoute(navigationSourceFacility?.id || null, e.target.value);
                    setIsChangingTarget(false);
                  }}
                  onBlur={() => setIsChangingTarget(false)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 font-medium outline-none focus:border-blue-600"
                  defaultValue={navigationTargetFacility.id}
                >
                  {LUCKNOW_STATION_FACILITIES.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.labelEnglish} ({fac.floor})
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setIsChangingTarget(true)}
                  className="truncate font-bold text-blue-600 hover:text-blue-700 transition-colors text-xs"
                >
                  {navigationTargetFacility.labelEnglish}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-slate-700">
          <Ruler className="h-3.5 w-3.5 text-slate-400" />
          <span>{activePathResult.totalDistance} m</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{activePathResult.estimatedMinutes} min</span>
        </div>
        <button
          onClick={toggleAccessibleRouteMode}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
            isAccessibleRouteMode
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-subtle"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
          }`}
          title="Toggle Wheelchair Accessible Ramp/Elevator Route"
        >
          <Accessibility className="h-3.5 w-3.5" />
          <span>{isAccessibleRouteMode ? "Accessible" : "Fastest"}</span>
        </button>
      </div>

      {!isLiveNavigating && !hasArrived && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-left">
            <div className="text-xs font-semibold text-blue-900 mb-0.5 flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              Route calculated & ready
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Step-by-step 3D pathway generated. Click below to begin guided navigation.
            </p>
          </div>

          <button
            onClick={startLiveNavigation}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-blue-700 transition-colors"
          >
            <span>Start Interactive Navigation</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLiveNavigating && !hasArrived && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-900">
                Step {currentNavStepIndex + 1} of {activePathResult.nodes.length}
              </span>
              <span className="text-blue-600 font-mono text-[11px]">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200">
              <motion.div
                className="h-full rounded-full bg-blue-600"
                initial={{ width: "0%" }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-subtle">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500 border-b border-slate-200/60 pb-1">
              <span>Location: {currentNode?.labelEnglish || "Station Corridor"}</span>
              <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] text-slate-700 font-medium">
                {currentNode?.floor === "1F" ? "1st Floor" : "Ground Floor"}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 mb-0.5 leading-snug">
              {activeEngInstruction}
            </div>
            <div className="text-[11px] font-medium text-slate-600">
              {activeHinInstruction}
            </div>
          </div>

          <button
            onClick={nextNavStep}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-subtle hover:bg-blue-700 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>I Have Reached This Step</span>
          </button>

          <div className="max-h-28 overflow-y-auto pr-1 flex flex-col gap-1.5 scrollbar-thin">
            {activePathResult.instructionsEnglish.map((stepEng, idx) => (
              <div
                key={idx}
                onClick={() => setNavStepIndex(idx)}
                className={`cursor-pointer rounded-lg p-2 text-xs transition-all border ${
                  currentNavStepIndex === idx
                    ? "border-blue-600 bg-blue-50 font-semibold text-blue-900 shadow-subtle"
                    : idx < currentNavStepIndex
                    ? "border-slate-200 bg-slate-100/60 text-slate-400 line-through"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {idx < currentNavStepIndex ? "✓ " : `${idx + 1}. `}
                    {stepEng}
                  </span>
                  {currentNavStepIndex === idx && (
                    <span className="text-[10px] font-bold text-blue-600 shrink-0">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-2">
            <button
              onClick={prevNavStep}
              disabled={currentNavStepIndex <= 0}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous Step</span>
            </button>
          </div>
        </div>
      )}

      {hasArrived && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center shadow-subtle">
          <div className="flex justify-center mb-1 text-emerald-600">
            <PartyPopper className="h-6 w-6" />
          </div>
          <h4 className="text-xs font-bold text-emerald-900 mb-0.5">
            Destination Reached
          </h4>
          <p className="text-[11px] text-emerald-800 mb-3">
            You have arrived at {navigationTargetFacility.labelEnglish} ({navigationTargetFacility.labelHindi}).
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => teleportTo(navigationTargetFacility.id)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-subtle"
            >
              View Surroundings
            </button>
            <button
              onClick={clearNavigation}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleVoiceEnabled}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all ${
              isVoiceEnabled
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
            title="Toggle Voice Guidance Speech"
          >
            {isVoiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{isVoiceEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          <button
            onClick={toggleHeadBob}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-all ${
              headBobEnabled
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
            title="Toggle Walking Camera Motion (Gait Bobbing)"
          >
            <Footprints className="h-3.5 w-3.5" />
            <span>{headBobEnabled ? "Motion On" : "Motion Off"}</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (navigationTargetFacility) {
              teleportTo(navigationTargetFacility.id);
            }
          }}
          className="text-blue-600 hover:text-blue-700 text-xs font-semibold transition-colors"
        >
          Teleport Camera Here
        </button>
      </div>
    </motion.div>
  );
}
