"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Users,
  Accessibility,
  Footprints,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { usePassengerStore, RoutePreference } from "@/store/usePassengerStore";
import { QUICK_DESTINATIONS } from "@/lib/mock-data/home";
import { logNavigationRequest } from "@/lib/operations-api";

export function JourneyPlanner() {
  const {
    originLocation,
    setOriginLocation,
    selectedDestination,
    setSelectedDestination,
    routePreference,
    setRoutePreference,
    accessibilityPreferences,
  } = usePassengerStore();

  const [isNavigating, setIsNavigating] = useState(false);

  const preferences: { label: RoutePreference; icon: React.ReactNode; desc: string }[] = [
    { label: "Fastest", icon: <Clock className="w-3.5 h-3.5" />, desc: "Minimizes total walking time" },
    { label: "Least Crowded", icon: <Users className="w-3.5 h-3.5" />, desc: "Avoids congested FOBs & stairs" },
    { label: "Accessible", icon: <Accessibility className="w-3.5 h-3.5" />, desc: "100% step-free lift access" },
    { label: "Avoid Stairs", icon: <Footprints className="w-3.5 h-3.5" />, desc: "Escalator & ramp priority" },
  ];

  const handleStartNav = () => {
    const destination = selectedDestination || "Platform 5";
    if (!selectedDestination) setSelectedDestination(destination);
    void logNavigationRequest({
      origin: originLocation,
      destination,
      preference: routePreference,
      source: "journey-planner",
    }).catch((error) => {
      console.error("Unable to record navigation request:", error);
    });
    setIsNavigating(true);
    setTimeout(() => {
      setIsNavigating(false);
      const mapEl = document.getElementById("station-map");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);
  };

  return (
    <section className="w-full py-4" id="journey-planner">
      <div className="rounded-3xl bg-white border-2 border-[#134489]/30 p-6 sm:p-8 shadow-lg space-y-6">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#134489]/20 pb-4">
          <div>
            <span className="text-xs font-black text-[#134489] uppercase tracking-wider block">
              Station Navigation Engine
            </span>
            <h3 className="text-2xl font-black text-[#010105] tracking-tight">
              Journey Planner
            </h3>
          </div>
          <div className="text-xs text-[#010105] font-bold flex items-center gap-1.5 bg-[#EDEBB9] px-3.5 py-1.5 rounded-xl border border-[#134489]/30 self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#134489]" />
            <span>AI Real-time Route Optimizer Active</span>
          </div>
        </div>

        {/* Origin and Destination Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* FROM */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#010105]/80 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#134489]" />
              <span>FROM (Origin)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={originLocation}
                onChange={(e) => setOriginLocation(e.target.value)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#EDEBB9]/30 border-2 border-[#134489]/30 text-[#010105] font-bold text-sm focus:outline-none focus:border-[#134489]"
              />
              <span className="absolute right-3 top-3.5 text-[10px] font-black text-[#010105] uppercase bg-[#FAC24A] px-2 py-0.5 rounded border border-[#010105]/20">
                Current Location
              </span>
            </div>
          </div>

          {/* TO */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[#010105]/80 uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#134489]" />
              <span>TO (Destination)</span>
            </label>
            <div className="relative">
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#EDEBB9]/40 border-2 border-[#134489]/40 text-[#010105] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#134489]"
              >
                <option value="" disabled className="bg-white text-[#010105]/60">
                  Select Destination...
                </option>
                {QUICK_DESTINATIONS.map((dest) => (
                  <option key={dest.id} value={dest.name} className="bg-white text-[#010105]">
                    {dest.name} ({dest.locationDetails})
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Route Preferences Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#010105]/80 uppercase tracking-wider">
              Route Preference:
            </span>
            {accessibilityPreferences.wheelchairFriendly && (
              <span className="text-[11px] text-[#134489] font-black">
                &bull; Accessible Mode Enforced by Preferences
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {preferences.map((pref) => {
              const isSelected = routePreference === pref.label;
              return (
                <button
                  key={pref.label}
                  type="button"
                  onClick={() => setRoutePreference(pref.label)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all duration-200 flex flex-col gap-1 items-start text-left focus:outline-none ${
                    isSelected
                      ? "bg-[#134489] text-[#E6E3DB] border-[#010105] shadow-md"
                      : "bg-white text-[#010105] border-[#134489]/20 hover:border-[#134489] hover:bg-[#EDEBB9]/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-1.5 font-black">
                      {pref.icon}
                      {pref.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FAC24A]" />}
                  </div>
                  <span
                    className={`text-[10px] font-medium leading-tight ${
                      isSelected ? "text-[#EDEBB9]" : "text-[#010105]/70"
                    }`}
                  >
                    {pref.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Action CTA */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#134489]/20">
          <div className="text-xs text-[#010105]/80 space-y-0.5 text-center sm:text-left">
            <p className="font-bold">
              Selected Target:{" "}
              <strong className="text-[#134489]">
                {selectedDestination || "Platform 5"}
              </strong>
            </p>
            <p className="text-[11px] text-[#010105]/70">
              Est. Walking Time: <span className="text-[#010105] font-bold">~3 mins</span> &bull; Crowd Level:{" "}
              <span className="text-emerald-700 font-black">Low</span>
            </p>
          </div>

          <button
            onClick={handleStartNav}
            disabled={isNavigating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#FAC24A] text-[#010105] font-black text-base border-2 border-[#010105] shadow-md hover:bg-[#d4a028] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isNavigating ? (
              <span>Calculating Route...</span>
            ) : (
              <>
                <Navigation className="w-5 h-5 text-[#134489]" />
                <span>Start Navigation</span>
                <ArrowRight className="w-5 h-5 text-[#134489]" />
              </>
            )}
          </button>
        </div>

      </div>
    </section>
  );
}
