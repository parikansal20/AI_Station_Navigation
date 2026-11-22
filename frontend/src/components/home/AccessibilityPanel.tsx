"use client";

import {
  Accessibility,
  Footprints,
  ArrowUpSquare,
  UserCheck,
  Zap,
  Volume2,
  CheckCircle2,
} from "lucide-react";
import { usePassengerStore, AccessibilityPreferences } from "@/store/usePassengerStore";

export function AccessibilityPanel({ compact = false }: { compact?: boolean }) {
  const { accessibilityPreferences, toggleAccessibilityPreference } = usePassengerStore();

  const options: {
    key: keyof AccessibilityPreferences;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
      {
        key: "wheelchairFriendly",
        title: "Wheelchair Friendly",
        description: "Step-free ramp and lift paths only",
        icon: <Accessibility className="w-5 h-5" />,
      },
      {
        key: "avoidStairs",
        title: "Avoid Stairs",
        description: "Priority for escalators and elevators",
        icon: <Footprints className="w-5 h-5" />,
      },
      {
        key: "preferLift",
        title: "Prefer Lift",
        description: "Direct elevator routing to platforms",
        icon: <ArrowUpSquare className="w-5 h-5" />,
      },
      {
        key: "seniorFriendly",
        title: "Senior Friendly",
        description: "Gentle slopes, frequent resting benches",
        icon: <UserCheck className="w-5 h-5" />,
      },
      {
        key: "lowWalkingDistance",
        title: "Low Walking Distance",
        description: "Shortest physical route through concourse",
        icon: <Zap className="w-5 h-5" />,
      },
      {
        key: "voiceGuidance",
        title: "Voice Guidance",
        description: "Turn-by-turn audio assistance alerts",
        icon: <Volume2 className="w-5 h-5" />,
      },
    ];

  return (
    <section className="w-full py-4" id="accessibility">
      <div className={`rounded-3xl bg-white border-2 border-[#134489]/30 shadow-lg ${compact ? "space-y-3 p-4" : "space-y-4 p-5 sm:p-7"}`}>

        {/* Header */}
        <div className={`flex flex-col justify-between gap-2 border-b border-[#134489]/20 pb-4 ${compact ? "" : "sm:flex-row sm:items-center"}`}>
          <div>
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-[#134489]" />
              <h3 className={`${compact ? "text-lg" : "text-xl sm:text-2xl"} font-black text-[#010105]`}>
                Accessibility Preferences
              </h3>
            </div>
            <p className="text-xs text-[#010105]/70 font-medium">
              Customize spatial routing for passengers with special mobility needs
            </p>
          </div>
          <span className={`${compact ? "text-[9px] px-2.5" : "text-[11px] px-3.5"} text-[#010105] bg-[#FAC24A] border border-[#010105]/20 py-1 rounded-xl font-black self-start sm:self-auto`}>
            Divyangjan & Senior Citizen Assist
          </span>
        </div>

        {/* Option Toggles */}
        <div className={`grid grid-cols-1 ${compact ? "gap-2" : "gap-3 sm:grid-cols-2 md:grid-cols-3"}`}>
          {options.map((opt) => {
            const isChecked = accessibilityPreferences[opt.key];
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleAccessibilityPreference(opt.key)}
                className={`${compact ? "p-2.5" : "p-4"} rounded-2xl border-2 text-left transition-all duration-200 flex items-start gap-3 focus:outline-none ${
                  isChecked
                    ? "bg-[#134489] text-[#E6E3DB] border-[#010105] shadow-md"
                    : "bg-[#EDEBB9]/40 border-[#134489]/20 hover:border-[#134489] hover:bg-[#EDEBB9]"
                }`}
              >
                <div
                  className={`${compact ? "p-2" : "p-2.5"} rounded-xl shrink-0 transition-colors ${
                    isChecked ? "bg-[#FAC24A] text-[#010105]" : "bg-[#134489] text-[#FAC24A]"
                  }`}
                >
                  {opt.icon}
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`${compact ? "text-xs" : "text-sm"} font-black ${isChecked ? "text-[#E6E3DB]" : "text-[#010105]"}`}>
                      {opt.title}
                    </h4>
                    {isChecked && (
                      <CheckCircle2 className="w-4 h-4 text-[#FAC24A]" />
                    )}
                  </div>
                  <p className={`${compact ? "text-[10px]" : "text-xs"} font-medium leading-tight ${isChecked ? "text-[#EDEBB9]" : "text-[#010105]/70"}`}>
                    {opt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Status Bar */}
        <div className={`pt-2 border-t border-[#134489]/20 text-xs text-[#010105]/80 flex font-bold ${compact ? "flex-col gap-1" : "items-center justify-between"}`}>
          <span>
            Active Filters:{" "}
            <strong className="text-[#134489] font-black">
              {Object.entries(accessibilityPreferences).filter(([, v]) => v).length} Enabled
            </strong>
          </span>
          <span className={`${compact ? "text-[9px]" : "text-[11px]"} text-[#010105]/60`}>
            Automatically adjusts journey planner calculations
          </span>
        </div>

      </div>
    </section>
  );
}
