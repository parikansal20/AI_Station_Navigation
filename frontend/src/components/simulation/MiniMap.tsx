"use client";

import { useMemo } from "react";
import { useSimulationStore } from "@/store/simulationStore";
import { LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";
import { Map, Target } from "lucide-react";

export default function MiniMap() {
  const playerPosition = useSimulationStore((s) => s.playerPosition);
  const playerYaw = useSimulationStore((s) => s.playerYaw);
  const activeFloor = useSimulationStore((s) => s.activeFloor);
  const setActiveFloor = useSimulationStore((s) => s.setActiveFloor);
  const teleportTo = useSimulationStore((s) => s.teleportTo);
  const activePathResult = useSimulationStore((s) => s.activePathResult);
  const navigationTargetFacility = useSimulationStore((s) => s.navigationTargetFacility);
  const setNavigationDestination = useSimulationStore((s) => s.setNavigationDestination);
  const setSelectedFacility = useSimulationStore((s) => s.setSelectedFacility);
  const isLiveNavigating = useSimulationStore((s) => s.isLiveNavigating);
  const currentNavStepIndex = useSimulationStore((s) => s.currentNavStepIndex);

  const mapX = Math.max(4, Math.min(96, ((playerPosition[0] + 38) / 60) * 100));
  const mapY = Math.max(4, Math.min(96, ((playerPosition[2] + 42) / 80) * 100));

  const targetX = navigationTargetFacility
    ? Math.max(4, Math.min(96, ((navigationTargetFacility.position[0] + 38) / 60) * 100))
    : null;
  const targetY = navigationTargetFacility
    ? Math.max(4, Math.min(96, ((navigationTargetFacility.position[2] + 42) / 80) * 100))
    : null;

  const filteredFacilities = LUCKNOW_STATION_FACILITIES.filter(
    (f) => f.floor === activeFloor
  );

  const pathPointsSvg = useMemo(() => {
    if (!activePathResult || activePathResult.nodes.length < 2) return "";

    const displayNodes = isLiveNavigating
      ? activePathResult.nodes.slice(Math.min(currentNavStepIndex, activePathResult.nodes.length - 1))
      : activePathResult.nodes;

    if (displayNodes.length < 2) return "";

    return displayNodes
      .map((n) => {
        const px = Math.max(2, Math.min(98, ((n.position[0] + 38) / 60) * 100));
        const py = Math.max(2, Math.min(98, ((n.position[2] + 42) / 80) * 100));
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");
  }, [activePathResult, isLiveNavigating, currentNavStepIndex]);

  return (
    <div className="pointer-events-auto relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-overlay">
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <Map className="h-3.5 w-3.5 text-blue-600" />
          <span>Interactive Mini-Map</span>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-0.5 text-[11px] font-semibold border border-slate-200">
          <button
            onClick={() => setActiveFloor("G")}
            className={`rounded-md px-2.5 py-0.5 transition-all ${
              activeFloor === "G"
                ? "bg-blue-600 text-white font-bold shadow-subtle"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ground
          </button>
          <button
            onClick={() => setActiveFloor("1F")}
            className={`rounded-md px-2.5 py-0.5 transition-all ${
              activeFloor === "1F"
                ? "bg-blue-600 text-white font-bold shadow-subtle"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            1st Floor
          </button>
        </div>
      </div>

      {navigationTargetFacility && activePathResult && (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px]">
          <div className="truncate font-semibold text-blue-900 flex items-center gap-1">
            <Target className="h-3 w-3 text-blue-600 shrink-0" />
            <span className="truncate">{navigationTargetFacility.labelEnglish}</span>
          </div>
          <div className="ml-1 font-mono font-bold text-blue-700 shrink-0">
            {activePathResult.totalDistance}m
          </div>
        </div>
      )}

      <div
        className="relative h-56 w-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 cursor-crosshair shadow-inner"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = ((e.clientX - rect.left) / rect.width) * 60 - 38;
          const clickZ = ((e.clientY - rect.top) / rect.height) * 80 - 42;
          teleportTo([clickX, activeFloor === "1F" ? 7.8 : 1.6, clickZ]);
        }}
      >
        {activeFloor === "G" ? (
          <svg className="absolute inset-0 h-full w-full opacity-60 pointer-events-none" viewBox="0 0 100 100">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="2 2" />

            <rect x="25" y="78" width="50" height="18" fill="#ECFDF5" stroke="#10B981" strokeWidth="1" rx="2" />
            <text x="50" y="89" fontSize="3.5" fill="#047857" fontWeight="bold" textAnchor="middle">
              Entrance Plaza & Parking
            </text>

            <rect x="22" y="38" width="56" height="38" fill="#F8FAFC" stroke="#475569" strokeWidth="1.2" rx="3" />

            <rect x="25" y="42" width="18" height="12" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.8" rx="1" />
            <text x="34" y="49" fontSize="3" fill="#0369A1" textAnchor="middle" fontWeight="bold">Tickets</text>

            <rect x="57" y="42" width="18" height="12" fill="#FEF3C7" stroke="#D97706" strokeWidth="0.8" rx="1" />
            <text x="66" y="49" fontSize="3" fill="#B45309" textAnchor="middle" fontWeight="bold">Waiting Hall</text>

            <line x1="5" y1="28" x2="95" y2="28" stroke="#2563EB" strokeWidth="1.5" />
            <text x="90" y="26" fontSize="2.8" fill="#1E40AF" fontWeight="bold">P1</text>

            <line x1="5" y1="18" x2="95" y2="18" stroke="#2563EB" strokeWidth="1.5" />
            <text x="90" y="16" fontSize="2.8" fill="#1E40AF" fontWeight="bold">P2/3</text>

            <line x1="5" y1="8" x2="95" y2="8" stroke="#2563EB" strokeWidth="1.5" />
            <text x="90" y="6" fontSize="2.8" fill="#1E40AF" fontWeight="bold">P4/5</text>
          </svg>
        ) : (
          <svg className="absolute inset-0 h-full w-full opacity-60 pointer-events-none" viewBox="0 0 100 100">
            <line x1="0" y1="50" x2="100" y2="50" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="2 2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#CBD5E1" strokeWidth="0.5" strokeDasharray="2 2" />

            <rect x="22" y="52" width="56" height="34" fill="#F1F5F9" stroke="#64748B" strokeWidth="1" rx="2" />

            <rect x="58" y="56" width="18" height="24" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.8" rx="1" />
            <text x="67" y="69" fontSize="2.8" fill="#0369A1" textAnchor="middle" fontWeight="bold">Dormitories</text>

            <rect x="24" y="56" width="18" height="24" fill="#FFEDD5" stroke="#EA580C" strokeWidth="0.8" rx="1" />
            <text x="33" y="69" fontSize="2.8" fill="#C2410C" textAnchor="middle" fontWeight="bold">Food Court</text>

            <rect x="44" y="5" width="12" height="52" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" rx="1" />
            <text x="50" y="30" fontSize="3.2" fill="#1E40AF" textAnchor="middle" fontWeight="bold" transform="rotate(-90 50 30)">
              FOOT OVERBRIDGE (FOB)
            </text>

            <line x1="5" y1="28" x2="95" y2="28" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="5" y1="18" x2="95" y2="18" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="5" y1="8" x2="95" y2="8" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        )}

        {pathPointsSvg && (
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polyline
              points={pathPointsSvg}
              fill="none"
              stroke="#BFDBFE"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            <polyline
              points={pathPointsSvg}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={pathPointsSvg}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {filteredFacilities.map((fac) => {
          const fx = ((fac.position[0] + 38) / 60) * 100;
          const fy = ((fac.position[2] + 42) / 80) * 100;
          const isSelected = navigationTargetFacility?.id === fac.id;
          return (
            <button
              key={fac.id}
              onClick={(e) => {
                e.stopPropagation();
                setNavigationDestination(fac.id);
                setSelectedFacility(fac);
              }}
              title={`${fac.labelEnglish} (${fac.labelHindi})`}
              className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full p-1 shadow-card transition-all hover:scale-130 ${
                isSelected
                  ? "bg-blue-600 ring-4 ring-blue-200 text-white scale-125 z-30"
                  : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
              style={{ left: `${fx}%`, top: `${fy}%` }}
            >
              <span className="text-xs leading-none">{fac.icon}</span>
            </button>
          );
        })}

        {targetX !== null && targetY !== null && (
          <div
            className="absolute z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${targetX}%`, top: `${targetY}%` }}
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-rose-500 opacity-40 animate-ping" />
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] shadow-md font-bold">
                🎯
              </div>
            </div>
          </div>
        )}

        <div
          className="absolute z-30 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600 shadow-md transition-all duration-75"
          style={{
            left: `${mapX}%`,
            top: `${mapY}%`,
          }}
        >
          <div
            className="absolute -left-2 -top-5 h-7 w-8 opacity-60 pointer-events-none"
            style={{
              transform: `rotate(${-playerYaw}rad)`,
              transformOrigin: "bottom center",
            }}
          >
            <div className="h-0 w-0 border-x-8 border-b-[18px] border-x-transparent border-b-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
