"use client";

import { useMemo } from "react";
import { MapPin, Clock } from "lucide-react";
import { STATION_INFO } from "@/lib/mock-data/home";

export function StationWelcome() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  return (
    <section className="w-full pt-4 pb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 p-5 sm:p-7 rounded-2xl md:rounded-3xl border-2 border-[#134489]/20 shadow-md backdrop-blur-md">
        
        {/* Welcome Text & Live Location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#134489] uppercase tracking-wider">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#134489] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#134489]"></span>
            </span>
            <span>{greeting} &bull; Live Passenger Assistance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#010105] tracking-tight">
            Welcome to <span className="text-[#134489]">{STATION_INFO.name}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-[#010105]/80">
            <div className="flex items-center gap-1.5 bg-[#EDEBB9]/70 px-3.5 py-1.5 rounded-xl border border-[#134489]/30">
              <MapPin className="w-4 h-4 text-[#134489] animate-bounce" />
              <span className="font-bold text-[#010105]">Current Location:</span>
              <span className="text-[#134489] font-black">{STATION_INFO.currentGate}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[#293442] text-xs font-semibold pl-2 border-l border-[#134489]/30">
              <Clock className="w-3.5 h-3.5 text-[#134489]" />
              <span>Zone: {STATION_INFO.zone}</span>
            </div>
          </div>
        </div>

        {/* Authentic Railway Station Board (Compact Light Theme) */}
        <div className="self-start sm:self-auto shrink-0">
          <div className="bg-[#FAC24A] text-[#010105] rounded-xl px-5 py-3 shadow-md border-2 border-[#010105] flex flex-col items-center justify-center text-center min-w-[160px] sm:min-w-[180px] transform hover:scale-[1.02] transition-transform duration-200">
            <span className="text-xs font-black font-sans tracking-wide leading-none text-[#010105]">
              {STATION_INFO.hindiName}
            </span>
            <span className="text-base sm:text-xl font-black uppercase tracking-wider leading-tight my-0.5 text-[#010105]">
              {STATION_INFO.name}
            </span>
            <div className="w-full flex items-center justify-between border-t border-[#010105]/30 pt-1 mt-0.5 px-1">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#010105]">
                STATION CODE
              </span>
              <span className="text-xs font-black tracking-widest bg-[#010105] text-[#FAC24A] px-2 py-0.5 rounded">
                {STATION_INFO.code}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
