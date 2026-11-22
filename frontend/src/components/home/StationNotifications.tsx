"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Megaphone, Wrench, X } from "lucide-react";
import {
  OperationsNotification,
  fetchStationOperations,
} from "@/lib/station-tools-api";

const PASSENGER_CATEGORIES = new Set(["Announcement", "Facility"]);

export function StationNotifications() {
  const [notifications, setNotifications] = useState<OperationsNotification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const operations = await fetchStationOperations();
        if (active) {
          setNotifications(
            operations.notifications
              .filter((notification) => PASSENGER_CATEGORIES.has(notification.category))
              .slice(0, 10)
          );
        }
      } catch {
        // The homepage remains usable while the station service is offline.
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-[#134489]/20 bg-white/80 text-[#134489] transition hover:border-[#134489] hover:bg-white"
        aria-label="Station notifications"
        aria-expanded={open}
      >
        <Bell className="h-4 w-4" />
        {notifications.length > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-[#E6E3DB]">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#134489]/15 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#134489]/10 p-4">
            <div>
              <p className="text-sm font-black text-[#010105]">Station updates</p>
              <p className="text-[10px] font-semibold text-[#010105]/45">
                Passenger announcements and facility notices
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[#010105]/40 hover:text-[#010105]"
              aria-label="Close station notifications"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-[#134489]/25" />
                <p className="mt-3 text-xs font-bold text-[#010105]/50">No passenger notices right now.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <article key={notification.id} className="border-b border-[#134489]/10 p-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                      notification.category === "Announcement"
                        ? "bg-[#FAC24A]/35 text-[#134489]"
                        : "bg-[#DCEAF7] text-[#134489]"
                    }`}>
                      {notification.category === "Announcement" ? (
                        <Megaphone className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-black text-[#010105]">{notification.title}</p>
                        <span className="rounded-full bg-[#DCEAF7] px-2 py-0.5 text-[8px] font-black uppercase text-[#134489]">
                          {notification.category}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium leading-4 text-[#010105]/60">
                        {notification.description}
                      </p>
                      <p className="mt-2 text-[9px] font-semibold text-[#010105]/35">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
