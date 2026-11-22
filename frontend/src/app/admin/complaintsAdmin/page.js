"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MapPin,
  MessageSquareWarning,
  Search,
  UserRoundCheck,
  LogOut,
  Star,
  ShieldAlert,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { usePassengerStore } from "@/store/usePassengerStore";
import { useOperationsTable } from "@/hooks/useOperationsTable";

const priorityStyle = {
  High: "bg-[#FAC24A] text-[#010105]",
  Medium: "bg-[#134489]/10 text-[#134489]",
  Low: "bg-[#EDEBB9] text-[#134489]",
};

const statusStyle = {
  Open: "border border-[#FAC24A] bg-[#FAC24A]/15 text-[#8a6200]",
  Assigned: "border border-[#134489]/20 bg-white/55 text-[#134489]",
  "In progress": "bg-[#134489] text-white",
  Resolved: "bg-[#EDEBB9] text-[#134489]",
};

export default function ComplaintsAdminPage() {
  const { userRole, logout } = usePassengerStore();
  const { records: complaints, loading, error } = useOperationsTable("complaints");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredComplaints = complaints.filter(
    (c) =>
      c.ticketId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passenger?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.issue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const escalatedComplaint = complaints.find((c) => c.priority === "High" && c.status !== "Resolved") || complaints[0];

  return (
    <main className="min-h-screen bg-[#E6E3DB] px-4 py-6 text-[#010105] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[#134489]/10 bg-[#EDEBB9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FAC24A]">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black tracking-[.12em] text-[#134489]">COMPLAINTS ADMIN</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                Independent complaint desk &bull; Role: {userRole}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {userRole === "admin" ? (
              <Link href="/admin/stationAdmin" className="inline-flex items-center gap-2 text-xs font-black text-[#134489]">
                <ArrowLeft className="h-4 w-4" /> Master admin
              </Link>
            ) : (
              <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-[#134489]">
                <ArrowLeft className="h-4 w-4" /> Passenger Home
              </Link>
            )}
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
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#134489]">Passenger care · Complaint resolution</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Passenger support desk</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/50">Receive complaints, coordinate station teams and keep passengers updated until every issue is resolved.</p>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open complaints" value={complaints.filter((item) => item.status === "Open").length} detail="From complaint database" icon={MessageSquareWarning} tone="blue" />
          <StatCard label="In progress" value={complaints.filter((item) => item.status === "In progress" || item.status === "Assigned").length} detail="Assigned to station teams" icon={Headphones} />
          <StatCard label="Resolved" value={complaints.filter((item) => item.status === "Resolved").length} detail="Stored resolved complaints" icon={CheckCircle2} tone="lemon" />
          <StatCard label="Avg. response" value="4.5 hrs" detail="Resolution SLA metrics" icon={Clock3} tone="gold" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_.5fr]">
          <article className="overflow-hidden rounded-[24px] border border-black/7 bg-white/55 shadow-[0_10px_30px_rgba(1,1,5,.05)]">
            <div className="flex flex-col gap-4 border-b border-black/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-extrabold">Complaint queue</h2>
                <p className="mt-1 text-xs text-black/45">Prioritized by urgency and waiting time</p>
              </div>
              <div className="flex gap-2">
                <label className="relative block min-w-0 sm:w-64">
                  <span className="sr-only">Search complaints</span>
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search complaint or passenger"
                    className="h-10 w-full rounded-xl border border-black/10 bg-white/55 pl-10 pr-3 text-xs outline-none focus:border-[#134489]/50 focus:ring-4 focus:ring-[#134489]/10"
                  />
                </label>
                <button onClick={() => setSearchQuery("")} className="rounded-xl border border-black/10 bg-[#EDEBB9] px-3 text-xs font-extrabold text-[#134489]">
                  All issues
                </button>
              </div>
            </div>

            <div className="hidden grid-cols-[.6fr_1.6fr_.8fr_.65fr_.65fr_auto] gap-4 bg-[#010105] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 lg:grid">
              <span>Ticket</span><span>Complaint</span><span>Location</span><span>Priority</span><span>Status</span><span>Action</span>
            </div>
            <div className="divide-y divide-black/8">
              {loading && <p className="p-8 text-center text-sm font-bold text-black/45">Loading complaints from database…</p>}
              {error && <p className="p-8 text-center text-sm font-bold text-red-600">{error}</p>}
              {!loading && !error && filteredComplaints.length === 0 && <p className="p-8 text-center text-sm font-bold text-black/45">No complaint records available in database.</p>}
              {filteredComplaints.map((complaint) => (
                <div key={complaint.id} className="grid gap-3 p-5 transition hover:bg-white/40 lg:grid-cols-[.6fr_1.6fr_.8fr_.65fr_.65fr_auto] lg:items-center lg:gap-4 lg:px-6">
                  <div>
                    <p className="text-xs font-black text-[#134489]">{complaint.ticketId}</p>
                    <p className="mt-1 text-[9px] font-bold text-black/35">{new Date(complaint.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{complaint.issue}</p>
                    <p className="mt-1 text-[10px] text-black/45">{complaint.passenger} · {complaint.contact || "No contact"} · {complaint.category}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-black/55"><MapPin className="h-3.5 w-3.5" />{complaint.location}</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${priorityStyle[complaint.priority]}`}>{complaint.priority}</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${statusStyle[complaint.status]}`}>{complaint.status}</span>
                  <button className="w-fit rounded-lg border border-[#134489]/20 px-3 py-2 text-[10px] font-black text-[#134489] transition hover:bg-[#134489] hover:text-white">Support</button>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#134489] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FAC24A]">Needs attention</p>
              {escalatedComplaint ? (
                <>
                  <div className="mt-3 flex items-center justify-between">
                    <h2 className="text-[#FAC24A] font-black text-xs">{escalatedComplaint.ticketId}</h2>
                    <span className="rounded-full bg-[#FAC24A] px-2 py-0.5 text-[9px] font-black text-[#010105]">{escalatedComplaint.priority} Priority</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black">{escalatedComplaint.issue}</h3>
                  <p className="mt-2 text-xs text-white/70">Passenger: {escalatedComplaint.passenger} &bull; {escalatedComplaint.location}</p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-black">No escalated complaint</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">Priority details will appear when real complaints are submitted.</p>
                </>
              )}
            </section>

            <section className="rounded-[24px] bg-[#EDEBB9] p-6">
              <div className="flex items-center gap-3"><UserRoundCheck className="h-5 w-5 text-[#134489]" /><h2 className="font-extrabold">Support team</h2></div>
              <p className="mt-2 text-xs font-semibold text-black/70">4 Grievance Desk Officers On Duty</p>
              <p className="mt-1 text-[10px] font-bold text-[#134489]">Lucknow Junction Operations Control</p>
            </section>

            <section className="rounded-[20px] border border-black/7 bg-white/55 p-5">
              <p className="text-xs font-extrabold">Resolution quality score</p>
              <div className="mt-3 flex items-center gap-2">
                <p className="text-3xl font-black tracking-tight text-[#134489]">4.7</p>
                <div className="flex text-[#FAC24A]">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current opacity-50" />
                </div>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-black/50">Based on passenger feedback and post-resolution reviews.</p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
