"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Info, X, ArrowRight } from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";

export function ToastNotification() {
  const activeToast = usePassengerStore((state) => state.activeToast);
  const hideToast = usePassengerStore((state) => state.hideToast);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeToast, hideToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-slide-down">
      <div className="bg-white/95 backdrop-blur-md border-2 border-[#134489] rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#134489] via-[#FAC24A] to-[#134489]" />

        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#134489] text-[#FAC24A] flex items-center justify-center shrink-0 shadow-xs">
              {activeToast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : activeToast.type === "warning" ? (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              ) : (
                <Info className="w-5 h-5 text-[#FAC24A]" />
              )}
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-[#010105]">
                {activeToast.title}
              </h4>
              <p className="text-xs font-medium text-[#010105]/75 leading-snug">
                {activeToast.message}
              </p>
            </div>
          </div>

          <button
            onClick={hideToast}
            className="text-[#010105]/50 hover:text-[#010105] font-black text-xs p-1 rounded-lg hover:bg-gray-100 transition-colors"
            title="Close Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button CTA */}
        {activeToast.trackUrl && (
          <div className="pt-2 border-t border-[#134489]/15 flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#010105]/50">
              Click to view live request telemetry
            </span>
            <Link
              href={activeToast.trackUrl}
              onClick={hideToast}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-white text-xs font-black shadow-xs transition-all"
            >
              <span>Track Request</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FAC24A]" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
