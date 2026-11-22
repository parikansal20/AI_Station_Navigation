import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, MapPin, Sparkles } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StationMapPreview } from "@/components/home/StationMapPreview";
import { MobileBottomNav } from "@/components/home/MobileBottomNav";

export const metadata: Metadata = {
  title: "Station Digital Twin Map | SAARTHI Lucknow Junction",
  description:
    "Interactive spatial digital twin map for Lucknow Junction (LJN) featuring turn-by-turn auto navigation, live crowd telemetry, accessible paths, and platform tracking.",
};

export default function StationMapPage() {
  return (
    <div className="min-h-screen bg-[#E6E3DB] text-[#010105] selection:bg-[#FAC24A] selection:text-[#010105] font-sans antialiased relative flex flex-col">
      {/* 1. Global Navigation Navbar */}
      <HomeHeader />

      {/* 2. Main Enterprise Digital Twin Workspace */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-4 pb-20 md:pb-8 flex flex-col">
        {/* Primary Digital Twin Interface Component */}
        <StationMapPreview />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#134489]/15 bg-[#E6E3DB] py-6 text-center text-xs text-[#010105]/70 pb-24 md:pb-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-extrabold text-[#134489]">
            SAARTHI &bull; Station AI for Routing, Transit &amp; Helpful Information
          </p>
          <p className="font-medium text-[11px]">
            Lucknow Junction (LJN) &bull; North Eastern Railway (NER) &bull; Indian Railways
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
