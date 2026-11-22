"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  House,
  MapPin,
  Radio,
  TrainFront,
  UsersRound,
  LogOut,
  Activity,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { SubAdminUserManager } from "@/components/admin/SubAdminUserManager";
import { usePassengerStore } from "@/store/usePassengerStore";
import { OPERATIONS_API_URL } from "@/lib/operations-api";

export default function AdminPage() {
  const { userRole, logout, assistanceRequests, initAssistanceRequests } = usePassengerStore();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    initAssistanceRequests();
    let active = true;

    async function loadSummary() {
      try {
        const res = await fetch(`${OPERATIONS_API_URL}/operations/summary`, { cache: "no-store" });
        const json = await res.json();
        if (active && res.ok && json.success) {
          setSummary(json.data);
        }
      } catch (err) {
        console.error("Failed to load operations summary:", err);
      } finally {
        if (active) setLoadingSummary(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [initAssistanceRequests]);

  const pendingRequests = assistanceRequests.filter((request) => request.status === "Pending");
  const openRequestsCount = summary ? summary.openRequestsCount : pendingRequests.length;
  const passengersToday = summary ? summary.passengersToday.toLocaleString("en-IN") : "85,550";
  const activePlatforms = summary ? summary.activePlatforms : 29;
  const avgResponseTime = summary ? summary.avgResponseTime : "3.8 min";
  const platformTraffic = summary?.platformTraffic || [];
  const activityFeed = summary?.activityFeed || [];

  return (
    <main className="min-h-screen bg-[#E6E3DB] px-4 py-6 text-[#010105] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-5 rounded-[26px] bg-[#134489] p-5 text-white shadow-[0_14px_35px_rgba(19,68,137,.16)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FAC24A] text-[#010105]">
              <TrainFront className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-black tracking-[.16em]">SAARTHI</p>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/50">
                Master administration &bull; Role: {userRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-[#EDEBB9]">
              <House className="h-4 w-4" /> Passenger home
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </header>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#134489]">Live operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Master admin control</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/50">Manage every independent admin desk, passenger service and network operation from one central dashboard.</p>
          </div>
          <Link href="/admin/stationAdmin" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#134489] px-5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(19,68,137,.2)] transition hover:-translate-y-0.5 hover:bg-[#0d376f] sm:self-auto">
            <Activity className="h-4 w-4" /> Station intelligence center
          </Link>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Passengers today" value={passengersToday} detail="Network passenger throughput" icon={UsersRound} tone="blue" />
          <StatCard label="Active platforms" value={activePlatforms} detail="Platforms across station network" icon={TrainFront} />
          <StatCard label="Open requests" value={openRequestsCount} detail="Assistance, complaints & SOS alerts" icon={Radio} tone="gold" />
          <StatCard label="Avg. response" value={avgResponseTime} detail="Station operator response SLA" icon={Clock3} tone="lemon" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
          <article className="admin-rise rounded-[24px] border border-black/7 bg-white/55 p-5 shadow-[0_10px_35px_rgba(1,1,5,.045)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold">Platform traffic</h2>
                <p className="mt-1 text-xs text-black/45">Passenger flow across station platforms today</p>
              </div>
              <span className="rounded-lg border border-black/8 bg-emerald-50 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" /> MongoDB live feed
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformTraffic.map((item) => (
                <div key={item.platform} className="rounded-2xl border border-black/8 bg-white/70 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#134489]">{item.platform}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${item.crowd === "High" ? "bg-amber-100 text-amber-800" : item.crowd === "Moderate" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {item.crowd} crowd
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-black tracking-tight">{item.passengers.toLocaleString("en-IN")}</p>
                  <p className="mt-1 text-[10px] font-semibold text-black/45">Estimated passengers today</p>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-rise rounded-[24px] bg-[#010105] p-5 text-white shadow-[0_12px_30px_rgba(1,1,5,.12)] sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-extrabold">Live activity</h2>
                <p className="mt-1 text-xs text-white/40">Real-time updates from database</p>
              </div>
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#FAC24A]">
                <span className="h-2 w-2 rounded-full bg-[#FAC24A] animate-pulse" /> Live DB Feed
              </span>
            </div>

            <div className="mt-4 max-h-[320px] space-y-3 overflow-y-auto pr-1">
              {activityFeed.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm font-bold text-white/40">No activity records available.</p>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#FAC24A]">{act.title}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white/60">{act.status}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/70 leading-4">{act.description}</p>
                    <p className="mt-2 text-[9px] text-white/40">{new Date(act.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        {/* Sub Admin Desk Accounts Manager */}
        <SubAdminUserManager />

        <section className="admin-rise mt-5 flex flex-col gap-4 rounded-[24px] border border-[#FAC24A]/50 bg-[#EDEBB9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FAC24A]">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="font-extrabold">{openRequestsCount} service requests need attention</p>
              <p className="mt-1 text-xs text-black/50">Counted from real passenger assistance submissions, complaints and SOS alerts.</p>
            </div>
          </div>
          <Link href="/admin/coolieAdmin" className="inline-flex items-center gap-2 text-sm font-black text-[#134489]">
            Review requests <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
