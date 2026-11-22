"use client";

import {
  TrainTrack,
  Bath,
  LogOut,
  ArrowUpRight,
  Utensils,
  Droplets,
  Armchair,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { QUICK_DESTINATIONS, DestinationItem } from "@/lib/mock-data/home";
import { usePassengerStore } from "@/store/usePassengerStore";

export function QuickDestinations() {
  const { selectedDestination, setSelectedDestination } = usePassengerStore();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "TrainTrack":
        return <TrainTrack className="w-6 h-6 text-[#FAC24A]" />;
      case "Restroom":
        return <Bath className="w-6 h-6 text-[#FAC24A]" />;
      case "LogOut":
        return <LogOut className="w-6 h-6 text-[#FAC24A]" />;
      case "Elevator":
        return <ArrowUpRight className="w-6 h-6 text-[#FAC24A]" />;
      case "Utensils":
        return <Utensils className="w-6 h-6 text-[#FAC24A]" />;
      case "Droplets":
        return <Droplets className="w-6 h-6 text-[#FAC24A]" />;
      case "Armchair":
        return <Armchair className="w-6 h-6 text-[#FAC24A]" />;
      case "Ticket":
        return <Ticket className="w-6 h-6 text-[#FAC24A]" />;
      default:
        return <TrainTrack className="w-6 h-6 text-[#FAC24A]" />;
    }
  };

  const handleSelect = (item: DestinationItem) => {
    setSelectedDestination(item.name);
    const plannerEl = document.getElementById("journey-planner");
    if (plannerEl) {
      plannerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full py-4" id="quick-destinations">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#010105] tracking-tight">
            Quick Destinations
          </h3>
          <p className="text-xs text-[#010105]/70 font-medium">
            One-tap navigation to key station facilities & platforms
          </p>
        </div>
        <span className="text-xs font-black text-[#134489] bg-[#EDEBB9] px-3 py-1 rounded-xl border border-[#134489]/20 hidden sm:inline-block">
          8 Popular Locations
        </span>
      </div>

      {/* Desktop Grid / Mobile Horizontal Scroll Container */}
      <div className="flex md:grid md:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto snap-x no-scrollbar pb-2 pt-1">
        {QUICK_DESTINATIONS.map((dest) => {
          const isSelected = selectedDestination === dest.name;
          return (
            <button
              key={dest.id}
              onClick={() => handleSelect(dest)}
              className={`snap-start shrink-0 min-w-[200px] md:min-w-0 p-4.5 rounded-2xl border-2 text-left transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#134489] ${
                isSelected
                  ? "bg-[#EDEBB9] border-[#134489] shadow-md shadow-[#134489]/10"
                  : "bg-white border-[#134489]/20 hover:border-[#134489] hover:bg-[#EDEBB9]/40 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#134489] border border-[#010105] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  {getIcon(dest.iconName)}
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      dest.crowdLevel === "Low"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : dest.crowdLevel === "Moderate"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {dest.crowdLevel} Crowd
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-[#010105] group-hover:text-[#134489] transition-colors flex items-center justify-between">
                  <span>{dest.name}</span>
                  <ChevronRight className="w-4 h-4 text-[#134489] group-hover:translate-x-1 transition-all" />
                </h4>
                <p className="text-xs text-[#010105]/70 font-medium truncate">
                  {dest.locationDetails}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-[#134489]/20 flex items-center justify-between text-[11px]">
                <span className="text-[#010105]/60 font-bold font-mono">{dest.floor}</span>
                {dest.isAccessible && (
                  <span className="text-[#134489] font-black text-[10px] bg-[#FAC24A] text-[#010105] px-1.5 py-0.5 rounded border border-[#010105]/20">
                    Wheelchair Accessible
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
