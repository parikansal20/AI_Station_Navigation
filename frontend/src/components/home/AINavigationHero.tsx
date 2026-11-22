"use client";

import { useState } from "react";
import {
  Mic,
  Send,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import { AI_SUGGESTION_CHIPS } from "@/lib/mock-data/home";
import { usePassengerStore } from "@/store/usePassengerStore";
import { logNavigationRequest } from "@/lib/operations-api";

export function AINavigationHero() {
  const {
    aiQuery,
    setAiQuery,
    isListening,
    setIsListening,
    setSelectedDestination,
    originLocation,
    routePreference,
  } = usePassengerStore();

  const [aiResponse, setAiResponse] = useState<{
    query: string;
    route: string;
    eta: string;
    crowdLevel: string;
    accessibility: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const handleChipClick = (chipQuery: string, label: string) => {
    setAiQuery(chipQuery);
    setSelectedDestination(label);
    simulateAiRoute(chipQuery, label);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setAiQuery("Listening for voice command...");
      setTimeout(() => {
        setIsListening(false);
        const sampleQuery = "Take me to Platform 5 via least crowded route";
        setAiQuery(sampleQuery);
        simulateAiRoute(sampleQuery, "Platform 5");
      }, 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    simulateAiRoute(aiQuery, aiQuery);
  };

  const simulateAiRoute = (queryText: string, targetName: string) => {
    void logNavigationRequest({
      origin: originLocation,
      destination: targetName,
      preference: routePreference,
      source: "ai-navigator",
    }).catch((error) => {
      console.error("Unable to record AI navigation request:", error);
    });
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAiResponse({
        query: queryText,
        route: `Main Entrance (Gate 1) → Concourse A → FOB B → ${targetName}`,
        eta: "3 mins (210 meters)",
        crowdLevel: "Low Congestion",
        accessibility: routePreference === "Accessible" ? "100% Step-Free Lift Access" : "Fastest Path",
      });
      setSelectedDestination(targetName);
    }, 600);
  };

  return (
    <section className="w-full py-4" id="ai-hero">
      {/* Primary Hero Card (Steel Azure #134489 with Sunflower Gold #FAC24A accents) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#134489] text-[#E6E3DB] border-4 border-[#FAC24A] p-6 sm:p-8 md:p-10 shadow-xl backdrop-blur-xl">
        
        {/* Soft Ambient Light Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FAC24A]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#EDEBB9]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header Badge & Title */}
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAC24A] text-[#010105] text-xs font-black border border-[#010105]">
              <Sparkles className="w-3.5 h-3.5 text-[#010105] animate-pulse" />
              <span>SAARTHI AI Voice & Spatial Navigator</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#E6E3DB] tracking-tight leading-tight">
              Where would you like to go?
            </h2>

            <p className="text-sm sm:text-base text-[#E6E3DB]/90 leading-relaxed font-medium">
              Ask SAARTHI to find the <strong className="text-[#FAC24A] font-bold">fastest</strong>,{" "}
              <strong className="text-[#FAC24A] font-bold">least crowded</strong>, or{" "}
              <strong className="text-[#FAC24A] font-bold">accessible route</strong> through Lucknow Junction.
            </p>
          </div>

          {/* AI Command Input Form (Crisp Light Input) */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex items-center rounded-2xl bg-white border-3 border-[#010105] focus-within:ring-4 focus-within:ring-[#FAC24A] transition-all duration-300 shadow-lg">
              
              {/* Left Navigation Icon */}
              <div className="pl-4 sm:pl-5 text-[#134489]">
                {isProcessing ? (
                  <Compass className="w-6 h-6 animate-spin text-[#134489]" />
                ) : (
                  <Navigation className="w-6 h-6 text-[#134489]" />
                )}
              </div>

              {/* Text Input */}
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask me to navigate anywhere in the station... (e.g., 'Take me to Platform 5')"
                className="w-full py-4 sm:py-5 px-3 sm:px-4 bg-transparent text-[#010105] placeholder-[#010105]/50 text-sm sm:text-base font-bold focus:outline-none"
              />

              {/* Voice Listening Waveform or Mic button */}
              <div className="flex items-center gap-2 pr-3 sm:pr-4">
                {isListening ? (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-black animate-pulse"
                  >
                    <div className="flex items-center gap-0.5 h-4">
                      <span className="w-1 bg-white rounded-full animate-wave-bar-1" />
                      <span className="w-1 bg-white rounded-full animate-wave-bar-2" />
                      <span className="w-1 bg-white rounded-full animate-wave-bar-3" />
                      <span className="w-1 bg-white rounded-full animate-wave-bar-4" />
                    </div>
                    <span className="hidden sm:inline">Listening</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className="p-3 rounded-xl bg-[#EDEBB9] border border-[#010105] text-[#010105] hover:bg-[#FAC24A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#134489]"
                    title="Voice Command Input"
                    aria-label="Activate voice input"
                  >
                    <Mic className="w-5 h-5 text-[#010105]" />
                  </button>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!aiQuery.trim() || isProcessing}
                  className="px-5 py-3 rounded-xl bg-[#FAC24A] text-[#010105] font-black text-sm flex items-center gap-2 border border-[#010105] hover:bg-[#d4a028] active:scale-95 disabled:opacity-50 transition-all shadow-md"
                >
                  <span className="hidden sm:inline">Find Route</span>
                  <Send className="w-4 h-4 text-[#010105]" />
                </button>
              </div>

            </div>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="space-y-2">
            <span className="text-xs font-black text-[#EDEBB9] uppercase tracking-wider block">
              Quick Suggestions & Natural Language Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {AI_SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.query, chip.label)}
                  className="px-3.5 py-2 rounded-xl bg-[#EDEBB9] text-[#010105] border border-[#010105] hover:bg-[#FAC24A] font-extrabold text-xs transition-all duration-200 flex items-center gap-1.5 focus:outline-none shadow-xs"
                >
                  <span>{chip.label}</span>
                  <ArrowRight className="w-3 h-3 text-[#134489]" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Card Simulation */}
          {aiResponse && (
            <div className="mt-4 p-5 rounded-2xl bg-white text-[#010105] border-2 border-[#FAC24A] space-y-3 animate-slide-up shadow-xl">
              <div className="flex items-center justify-between border-b border-[#134489]/20 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#134489]" />
                  <span className="text-sm font-black text-[#134489]">
                    SAARTHI AI Calculated Route
                  </span>
                </div>
                <span className="text-xs text-[#010105]/70 font-mono font-bold">
                  {aiResponse.eta}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#EDEBB9]/60 p-3 rounded-xl border border-[#134489]/20">
                  <span className="text-[#010105]/70 block text-[10px] uppercase font-black">
                    Suggested Path
                  </span>
                  <span className="font-extrabold text-[#134489] mt-0.5 block">
                    {aiResponse.route}
                  </span>
                </div>

                <div className="bg-[#EDEBB9]/60 p-3 rounded-xl border border-[#134489]/20">
                  <span className="text-[#010105]/70 block text-[10px] uppercase font-black">
                    Crowd Density Status
                  </span>
                  <span className="font-black text-[#010105] mt-0.5 block">
                    {aiResponse.crowdLevel}
                  </span>
                </div>

                <div className="bg-[#EDEBB9]/60 p-3 rounded-xl border border-[#134489]/20">
                  <span className="text-[#010105]/70 block text-[10px] uppercase font-black">
                    Accessibility Feature
                  </span>
                  <span className="font-extrabold text-[#134489] mt-0.5 block">
                    {aiResponse.accessibility}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#010105]/70 italic font-medium">
                  Query: &quot;{aiResponse.query}&quot;
                </span>
                <a
                  href="#journey-planner"
                  className="text-[#134489] font-black underline hover:text-[#010105]"
                >
                  View Step-by-Step Directions →
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
