"use client";

import { useState, useRef, useEffect } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const setNavigationDestination = useSimulationStore((s) => s.setNavigationDestination);
  const setNavigationSource = useSimulationStore((s) => s.setNavigationSource);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFacilities = LUCKNOW_STATION_FACILITIES.filter(
    (fac) =>
      fac.labelEnglish.toLowerCase().includes(query.toLowerCase()) ||
      fac.labelHindi.includes(query) ||
      fac.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="pointer-events-auto relative w-72 md:w-88">
      <div className="relative flex items-center rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm transition-all focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
        <Search className="h-4 w-4 text-slate-400 shrink-0 mr-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search destination (e.g. Platform 3, Ticket Counter)..."
          className="w-full bg-transparent text-xs font-medium text-slate-900 placeholder-slate-400 outline-none"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredFacilities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-11 z-40 flex max-h-80 flex-col overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-dropdown"
          >
            <div className="mb-1 px-2.5 pt-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Station Facilities & Destinations
            </div>

            <div className="flex flex-col gap-1">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <div
                    className="flex flex-1 items-center gap-2.5 cursor-pointer min-w-0"
                    onClick={() => {
                      setNavigationDestination(fac.id);
                      setQuery(fac.labelEnglish);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-700 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600">
                      {fac.icon}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {fac.labelEnglish}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {fac.labelHindi} · <span className="font-medium">{fac.floor === "1F" ? "1st Floor" : "Ground"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        setNavigationSource(fac.id);
                        setQuery(fac.labelEnglish);
                        setIsOpen(false);
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Set as Start Location"
                    >
                      Start
                    </button>
                    <button
                      onClick={() => {
                        setNavigationDestination(fac.id);
                        setQuery(fac.labelEnglish);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700 transition-colors shadow-subtle"
                      title="Set as Destination"
                    >
                      <span>Navigate</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
