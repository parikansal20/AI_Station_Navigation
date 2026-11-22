import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowRight, Sparkles, Navigation, Layers, ShieldCheck } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StationWelcome } from "@/components/home/StationWelcome";
import { AccessibilityPanel } from "@/components/home/AccessibilityPanel";
import { PassengerServices } from "@/components/home/PassengerServices";
import { EmergencyAssistance } from "@/components/home/EmergencyAssistance";
import { ComplaintSubmission } from "@/components/home/ComplaintSubmission";
import { TravelTips } from "@/components/home/TravelTips";
import { MobileBottomNav } from "@/components/home/MobileBottomNav";
import { ChatbotLauncher } from "@/components/home/ChatbotLauncher";

export const metadata: Metadata = {
  title: "SAARTHI | AI Station Navigation & Passenger Assistance (Lucknow Junction)",
  description:
    "Primary passenger interface for intelligent station navigation, live crowd density analysis, accessible routes, train tracking, and passenger assistance at Lucknow Junction.",
};

export default function PassengerHomePage() {
  return (
    <div className="min-h-screen bg-[#E6E3DB] text-[#010105] selection:bg-[#FAC24A] selection:text-[#010105] font-sans antialiased relative">
      {/* Responsive Glass Header */}
      <HomeHeader />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 py-4 sm:py-6 pb-24 md:pb-12">
        {/* 1. Station Welcome & Context */}
        <StationWelcome />

        {/* 4. Station Spatial Map CTA Banner Card */}
        <section className="w-full py-2" id="station-map-cta">
          <div className="rounded-3xl bg-gradient-to-r from-[#134489] via-[#103873] to-[#010105] border border-[#134489] p-6 sm:p-8 text-[#E6E3DB] shadow-xl relative overflow-hidden group">
            {/* Background Accent Graphics */}
            <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-[#FAC24A]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/30 bg-white/10 text-white shadow-xs">
                    Live Spatial CAD &bull; 2D Digital Twin
                  </span>
                  <span className="text-xs font-bold text-[#FAC24A] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Turn-by-Turn Auto-Nav
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  SAARTHI &bull; Smart Station Digital Twin Map
                </h2>

                <p className="text-xs sm:text-sm text-[#F4F6F8] font-medium leading-relaxed">
                  Interactive 2D spatial floor plan for Lucknow Junction (LJN). Features Dijkstra turn-by-turn auto navigation, wheelchair accessible lifts/ramps, golf cart shuttles, and live crowd density telemetry across Platforms 1–8.
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 text-xs font-extrabold text-white">
                  <span className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">
                    <Navigation className="w-3.5 h-3.5" /> Auto Turn-by-Turn
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">
                    <Layers className="w-3.5 h-3.5" /> 8 Platforms Covered
                  </span>
                  <span className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> Emergency Evacuation
                  </span>
                </div>
              </div>

              {/* Action Button to Open Map Page */}
              <Link
                href="/station-map"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl border-2 border-white/80 bg-transparent hover:bg-white/10 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all shrink-0"
              >
                <Compass className="w-5 h-5 text-white" />
                <span>Open Digital Twin Map</span>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <PassengerServices />
          <EmergencyAssistance />
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-stretch">
            <div className="flex flex-col gap-3">
              <ComplaintSubmission compact />
              <TravelTips />
            </div>
            <aside className="rounded-[30px] border border-[#134489]/20 bg-[#DCEAF7] p-3 shadow-[0_16px_40px_rgba(19,68,137,.1)] sm:p-4">
              <AccessibilityPanel compact />
            </aside>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#134489]/20 bg-[#E6E3DB] py-8 text-center text-xs text-[#010105]/70 pb-28 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-extrabold text-[#134489]">
            SARTHI &bull; Station AI for Routing, Transit &amp; Helpful Information
          </p>
          <p className="font-medium">
            Lucknow Junction (LJN) &bull; North Eastern Railway (NER) &bull; Indian Railways
          </p>
          <p className="text-[10px] text-[#010105]/60 font-mono font-bold pt-1">
            Powered by Hybrid CSRNet + YOLO Crowd Intelligence &amp; Spatial Routing Engines
          </p>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating RAG Chatbot Widget — client-only, loaded via ChatbotLauncher */}
      <ChatbotLauncher />
    </div>
  );
}
