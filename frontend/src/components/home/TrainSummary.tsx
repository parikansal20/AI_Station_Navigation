"use client";

import { TrainTrack, Clock, Navigation, ArrowRight, ShieldCheck } from "lucide-react";
import { MY_TRAIN } from "@/lib/mock-data/home";
import { usePassengerStore } from "@/store/usePassengerStore";

export function TrainSummary() {
  const { setSelectedDestination } = usePassengerStore();

  const handleNavigateToTrain = () => {
    setSelectedDestination(MY_TRAIN.platform);
    const plannerEl = document.getElementById("journey-planner");
    if (plannerEl) {
      plannerEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="w-full py-2" id="train-summary">
      <div className="rounded-3xl bg-[#FAFBF7] border border-[#134489]/25 p-5 sm:px-6 sm:py-5 shadow-md space-y-3">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#134489]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#134489] text-[#FAC24A] font-black border border-[#010105]">
              <TrainTrack className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#134489] uppercase tracking-wider block">
                Passenger PNR Journey Context
              </span>
              <h3 className="text-xl font-black text-[#010105]">
                Your Train Details
              </h3>
            </div>
          </div>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{MY_TRAIN.status}</span>
          </span>
        </div>

        {/* Train Details Content */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          
          <div className="space-y-1 sm:col-span-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#134489]">{MY_TRAIN.number}</span>
              <span className="text-xl font-black text-[#010105]">{MY_TRAIN.name}</span>
            </div>
            <p className="text-xs text-[#293442] font-semibold">{MY_TRAIN.route}</p>
            <p className="text-[11px] text-[#234F86] font-mono font-bold pt-1">
              Coach position: {MY_TRAIN.coachInfo}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-6 bg-[#EDEBB9]/40 p-3.5 rounded-2xl border border-[#134489]/20">
            <div>
              <span className="text-[10px] text-[#293442] uppercase font-black block">Assigned Platform</span>
              <span className="text-lg font-black text-[#134489]">{MY_TRAIN.platform}</span>
            </div>
            <div className="pl-4 border-l border-[#134489]/20">
              <span className="text-[10px] text-[#293442] uppercase font-black block">Departure Time</span>
              <span className="text-lg font-black text-[#010105] flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#134489]" />
                {MY_TRAIN.departureTime}
              </span>
            </div>
          </div>

          <div className="sm:col-span-1">
            <button
              onClick={handleNavigateToTrain}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#FAC24A] hover:bg-[#d4a028] text-[#010105] font-black text-xs sm:text-sm border-2 border-[#010105] shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4 text-[#010105]" />
              <span>Navigate to Platform 4</span>
              <ArrowRight className="w-4 h-4 text-[#010105]" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
