"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CircleOff, HelpCircle, RefreshCw, SlidersHorizontal } from "lucide-react";
import {
  FacilityStatus,
  FacilityStatuses,
  UnansweredQuestion,
  fetchFacilityStatuses,
  fetchUnansweredQuestions,
  updateFacilityStatus,
} from "@/lib/station-tools-api";

const facilityLabels: Record<string, string> = {
  lift: "Lift",
  washroom: "Washroom",
  ticket_counter: "Ticket Counter",
  escalator: "Escalator",
  drinking_water: "Drinking Water",
  waiting_room: "Waiting Room",
};

export function StationKnowledgeTools() {
  const [facilities, setFacilities] = useState<FacilityStatuses>({});
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFacility, setSavingFacility] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [facilityData, questionData] = await Promise.all([
        fetchFacilityStatuses(),
        fetchUnansweredQuestions(),
      ]);
      setFacilities(facilityData);
      setQuestions(questionData);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load station tools.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchFacilityStatuses(), fetchUnansweredQuestions()])
      .then(([facilityData, questionData]) => {
        if (!active) return;
        setFacilities(facilityData);
        setQuestions(questionData);
        setError("");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load station tools.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleFacility = async (facility: string, currentStatus: FacilityStatus) => {
    const nextStatus = currentStatus === "working" ? "not_working" : "working";
    setSavingFacility(facility);
    setError("");
    try {
      setFacilities(await updateFacilityStatus(facility, nextStatus));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update facility.");
    } finally {
      setSavingFacility("");
    }
  };

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <article className="rounded-[24px] border border-[#A8DADC] bg-white/70 p-5 shadow-[0_12px_32px_rgba(29,53,87,.07)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#457B9D]" />
              <h2 className="text-lg font-extrabold">Facility availability</h2>
            </div>
            <p className="mt-1 text-xs font-medium text-[#1D3557]/65">
              SARTHI checks these live statuses before answering passengers.
            </p>
          </div>
          <span className="rounded-full bg-[#A8DADC]/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">
            JSON synced
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Object.entries(facilities).map(([facility, status]) => {
            const working = status === "working";
            return (
              <div key={facility} className="flex items-center justify-between gap-4 rounded-2xl border border-[#A8DADC]/80 bg-[#F1FAEE] p-4">
                <div className="flex items-center gap-3">
                  {working ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                  ) : (
                    <CircleOff className="h-5 w-5 text-[#E63946]" />
                  )}
                  <div>
                    <p className="text-sm font-extrabold">{facilityLabels[facility] || facility}</p>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${working ? "text-emerald-700" : "text-[#E63946]"}`}>
                      {working ? "Working" : "Not working"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={working}
                  aria-label={`Mark ${facilityLabels[facility] || facility} as ${working ? "not working" : "working"}`}
                  disabled={savingFacility === facility}
                  onClick={() => toggleFacility(facility, status)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-wait disabled:opacity-50 ${working ? "bg-[#457B9D]" : "bg-[#E63946]"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${working ? "left-6" : "left-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-[24px] bg-[#1D3557] p-5 text-white shadow-[0_12px_28px_rgba(29,53,87,.16)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#A8DADC]" />
              <h2 className="text-lg font-extrabold">Couldn&apos;t answer</h2>
            </div>
            <p className="mt-1 text-xs text-white/65">Questions to consider for the next knowledge-base update.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 text-[#A8DADC] transition hover:bg-white/10 disabled:opacity-50"
            aria-label="Refresh unanswered questions"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          {!loading && questions.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/20 p-7 text-center text-sm font-bold text-white/50">
              No unanswered questions yet.
            </p>
          )}
          {questions.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[.07] p-3.5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-5">&ldquo;{item.question}&rdquo;</p>
                <span className="shrink-0 rounded-full bg-[#E63946] px-2 py-1 text-[9px] font-black">
                  {item.count}×
                </span>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-[#A8DADC]">
                Last asked {new Date(item.lastAskedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-xs font-bold text-[#ff9ca4]">{error}</p>}
      </article>
    </section>
  );
}
