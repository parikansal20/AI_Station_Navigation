"use client";

import { useState, useRef } from "react";
import { useSimulationStore } from "@/store/simulationStore";

export default function TouchControls() {
  const controlMode = useSimulationStore((s) => s.controlMode);
  const setTouchMoveVector = useSimulationStore((s) => s.setTouchMoveVector);

  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (controlMode !== "fps") return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dist = Math.min(Math.hypot(dx, dy), 45);
    const angle = Math.atan2(dy, dx);

    const nx = (dist * Math.cos(angle)) / 45;
    const ny = (dist * Math.sin(angle)) / 45;

    setJoystickPos({ x: dist * Math.cos(angle), y: dist * Math.sin(angle) });
    setTouchMoveVector({ x: nx, y: ny });
  };

  const handleTouchEnd = () => {
    setJoystickPos({ x: 0, y: 0 });
    setTouchMoveVector({ x: 0, y: 0 });
    touchStartRef.current = null;
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex justify-between p-6 md:hidden">
      <div
        className="pointer-events-auto relative flex h-32 w-32 items-center justify-center rounded-full border border-slate-300 bg-white/40 backdrop-blur-xs shadow-card"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="h-12 w-12 rounded-full bg-blue-600 shadow-md transition-transform duration-75"
          style={{
            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
          }}
        />
      </div>

      <div className="pointer-events-none flex items-end text-[11px] font-medium text-slate-600 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 shadow-subtle self-end">
        <span>Drag screen to look around</span>
      </div>
    </div>
  );
}
