"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Radio,
  ShieldCheck,
  Siren,
  UsersRound,
  LogOut,
  PhoneCall,
} from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { usePassengerStore } from "@/store/usePassengerStore";
import { useOperationsTable } from "@/hooks/useOperationsTable";
import { OPERATIONS_API_URL } from "@/lib/operations-api";

const protocol = [
  ["Acknowledge SOS", "Confirm incident type and precise location.", "Complete"],
  ["Dispatch response", "Notify the closest trained response team.", "Active"],
  ["Secure the area", "Create a safe corridor for responders.", "Pending"],
  ["Update passenger", "Share support status and safety guidance.", "Pending"],
  ["Close and report", "Record the outcome and incident timeline.", "Pending"],
];

const severityStyle = {
  Critical: "bg-[#010105] text-white",
  High: "bg-[#FAC24A] text-[#010105]",
  Medium: "bg-[#EDEBB9] text-[#134489]",
};

export default function EmergencyAdmin() {
  const [sosActive, setSosActive] = useState(false);
  const [submittingSos, setSubmittingSos] = useState(false);
  const [sosForm, setSosForm] = useState({
    passengerName: "",
    contact: "",
    service: "security",
  });
  const { userRole, logout } = usePassengerStore();
  const { records: incidents, loading, error, refresh } = useOperationsTable("incidents");

  const handleRaiseSos = async () => {
    if (!sosForm.contact.trim()) return;
    setSubmittingSos(true);
    try {
      const response = await fetch(`${OPERATIONS_API_URL}/operations/support-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: sosForm.service,
          passengerName: sosForm.passengerName.trim() || "Emergency Passenger",
          contact: sosForm.contact.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSosActive(false);
        setSosForm({ passengerName: "", contact: "", service: "security" });
        refresh();
      }
    } catch (err) {
      console.error("Failed to raise SOS request:", err);
    } finally {
      setSubmittingSos(false);
    }
  };

  const activeIncidents = incidents.filter((item) => item.status !== "Resolved");
  const resolvedIncidents = incidents.filter((item) => item.status === "Resolved");
  const topCriticalIncident = activeIncidents.find((i) => i.severity === "Critical") || activeIncidents[0];

  return (
    <main className="min-h-screen bg-[#E6E3DB] px-4 py-6 text-[#010105] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[#134489]/10 bg-[#EDEBB9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FAC24A]">
              <Siren className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black tracking-[.12em] text-[#134489]">EMERGENCY ADMIN</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                Independent SOS control &bull; Role: {userRole}
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
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#134489]">Emergency control · 24/7 response</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Emergency & SOS center</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/50">Receive emergency alerts, dispatch trained responders and follow a clear protocol until every passenger is safe.</p>
          </div>
          <button
            onClick={() => setSosActive(true)}
            disabled={sosActive}
            className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-black shadow-[0_10px_28px_rgba(1,1,5,.18)] transition ${
              sosActive ? "cursor-default bg-[#EDEBB9] text-[#134489]" : "bg-[#010105] text-white hover:-translate-y-0.5"
            }`}
          >
            {sosActive ? <Radio className="h-5 w-5 animate-pulse" /> : <Siren className="h-5 w-5 text-[#FAC24A]" />}
            {sosActive ? "SOS request active" : "Raise SOS request"}
          </button>
        </div>

        {sosActive && (
          <section role="alert" className="mt-7 flex flex-col gap-4 rounded-[22px] border-2 border-[#FAC24A] bg-[#010105] p-5 text-white shadow-[0_12px_32px_rgba(1,1,5,.18)]">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FAC24A] text-[#010105]"><Siren className="h-6 w-6 animate-pulse" /></span>
              <div className="flex-1">
                <p className="font-black text-lg">New Emergency SOS Request</p>
                <p className="mt-1 text-xs leading-5 text-white/55">Enter passenger contact number to dispatch RPF / Medical response team instantly.</p>
                
                <div className="mt-4 grid gap-3 sm:grid-cols-3 max-w-2xl">
                  <input
                    type="text"
                    placeholder="Passenger Name (Optional)"
                    value={sosForm.passengerName}
                    onChange={(e) => setSosForm({ ...sosForm, passengerName: e.target.value })}
                    className="h-10 rounded-xl bg-white/10 px-3 text-xs text-white placeholder-white/40 border border-white/20 outline-none focus:border-[#FAC24A]"
                  />
                  <input
                    type="tel"
                    placeholder="10-Digit Mobile Number"
                    value={sosForm.contact}
                    onChange={(e) => setSosForm({ ...sosForm, contact: e.target.value })}
                    className="h-10 rounded-xl bg-white/10 px-3 text-xs text-white placeholder-white/40 border border-white/20 outline-none focus:border-[#FAC24A]"
                  />
                  <select
                    value={sosForm.service}
                    onChange={(e) => setSosForm({ ...sosForm, service: e.target.value })}
                    className="h-10 rounded-xl bg-[#010105] px-3 text-xs text-white border border-white/20 outline-none focus:border-[#FAC24A]"
                  >
                    <option value="security">RPF Security Team</option>
                    <option value="medical">Medical First Aid</option>
                    <option value="helpdesk">Help Desk Control</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end border-t border-white/10 pt-3">
              <button onClick={() => setSosActive(false)} className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-black text-white/65">Cancel</button>
              <button onClick={handleRaiseSos} disabled={submittingSos || !sosForm.contact} className="rounded-xl bg-[#FAC24A] px-5 py-2.5 text-xs font-black text-[#010105] hover:bg-amber-400 disabled:opacity-50">
                {submittingSos ? "Dispatching..." : "Dispatch Emergency Response"}
              </button>
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active incidents" value={activeIncidents.length} detail="From MongoDB incident database" icon={Siren} tone="blue" />
          <StatCard label="Teams available" value="3 Units" detail="RPF, Medical & Help Desk On Standby" icon={UsersRound} />
          <StatCard label="Avg. dispatch" value="2.4 min" detail="Station responder response time" icon={Clock3} tone="gold" />
          <StatCard label="Resolved" value={resolvedIncidents.length} detail="Stored resolved incidents" icon={CheckCircle2} tone="lemon" />
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
          <div className="space-y-5">
            <article className="overflow-hidden rounded-[24px] border border-black/7 bg-white/55 shadow-[0_10px_30px_rgba(1,1,5,.05)]">
              <div className="flex items-center justify-between border-b border-black/8 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-extrabold">Live incident queue</h2>
                  <p className="mt-1 text-xs text-black/45">Ordered by severity and response time</p>
                </div>
                <span className="flex items-center gap-2 rounded-full bg-[#EDEBB9] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#134489]">
                  <span className="h-2 w-2 rounded-full bg-[#134489] animate-pulse" /> Live DB Feed
                </span>
              </div>
              <div className="hidden grid-cols-[.65fr_1.4fr_1fr_.65fr_.8fr_auto] gap-4 bg-[#010105] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 lg:grid">
                <span>ID</span><span>Incident</span><span>Location</span><span>Severity</span><span>Response</span><span>Action</span>
              </div>
              <div className="divide-y divide-black/8">
                {loading && <p className="p-8 text-center text-sm font-bold text-black/45">Loading incidents from database…</p>}
                {error && <p className="p-8 text-center text-sm font-bold text-red-600">{error}</p>}
                {!loading && !error && incidents.length === 0 && <p className="p-8 text-center text-sm font-bold text-black/45">No emergency incidents available.</p>}
                {incidents.map((incident) => (
                  <div key={incident.id} className="grid gap-3 p-5 transition hover:bg-white/40 lg:grid-cols-[.65fr_1.4fr_1fr_.65fr_.8fr_auto] lg:items-center lg:gap-4 lg:px-6">
                    <div>
                      <p className="text-xs font-black text-[#134489]">{incident.incidentId}</p>
                      <p className="mt-1 text-[9px] font-bold text-black/35">{new Date(incident.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{incident.type}</p>
                      <p className="mt-1 text-[10px] text-black/45">{incident.passenger || "Passenger"} · {incident.contact || "No contact"}</p>
                      {incident.message && <p className="mt-2 text-xs leading-5 text-black/65">{incident.message}</p>}
                    </div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-black/55">
                      <MapPin className="h-3.5 w-3.5" />{incident.location}
                    </p>
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${severityStyle[incident.severity]}`}>{incident.severity}</span>
                    <div>
                      <p className="text-xs font-extrabold">{incident.team}</p>
                      <p className="mt-1 text-[10px] text-[#134489]">{incident.status}</p>
                    </div>
                    <button className="w-fit rounded-lg border border-[#134489]/20 px-3 py-2 text-[10px] font-black text-[#134489] transition hover:bg-[#134489] hover:text-white">Manage</button>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[24px] border border-black/7 bg-white/55 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-[#134489]" />
                <div>
                  <h2 className="text-lg font-extrabold">Active emergency protocol</h2>
                  <p className="mt-1 text-xs text-black/45">Standard SOP workflow for rapid emergency resolution</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-5">
                {protocol.map(([title, detail, status], index) => (
                  <div key={title} className={`relative rounded-2xl border p-4 ${status === "Active" ? "border-[#134489] bg-[#134489] text-white" : status === "Complete" ? "border-[#EDEBB9] bg-[#EDEBB9]" : "border-black/8 bg-white/45"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${status === "Active" ? "bg-[#FAC24A] text-[#010105]" : "bg-[#134489] text-white"}`}>{index + 1}</span>
                      {status === "Complete" && <CheckCircle2 className="h-4 w-4 text-[#134489]" />}
                    </div>
                    <p className="mt-4 text-xs font-black">{title}</p>
                    <p className="mt-2 text-[10px] leading-4 opacity-70">{detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#134489] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FAC24A]">Critical response</p>
              {topCriticalIncident ? (
                <>
                  <h2 className="mt-3 text-xl font-black">{topCriticalIncident.type}</h2>
                  <p className="mt-2 text-xs text-[#FAC24A]">{topCriticalIncident.location} &bull; {topCriticalIncident.team}</p>
                  <p className="mt-3 text-xs leading-5 text-white/70">Passenger: {topCriticalIncident.passenger} ({topCriticalIncident.contact})</p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-black">All Systems Normal</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">No critical emergency SOS alerts currently active.</p>
                </>
              )}
            </section>

            <section className="rounded-[24px] bg-[#EDEBB9] p-6">
              <h2 className="font-extrabold flex items-center gap-2 text-[#134489]"><PhoneCall className="h-4 w-4" /> Emergency contacts</h2>
              <div className="mt-3 space-y-2 text-xs font-semibold text-black/75">
                <p className="flex justify-between"><span>RPF Security Toll Free:</span> <span className="font-black text-[#134489]">139</span></p>
                <p className="flex justify-between"><span>Station Medical Desk:</span> <span className="font-black text-[#134489]">+91 522 2635000</span></p>
                <p className="flex justify-between"><span>Railway Helpline:</span> <span className="font-black text-[#134489]">1072</span></p>
              </div>
            </section>

            <section className="rounded-[20px] border border-[#FAC24A]/60 bg-white/55 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-[#134489]" />
                <div>
                  <p className="text-xs font-extrabold">Response readiness</p>
                  <p className="mt-1 text-[10px] font-bold text-emerald-700">100% Units Standby &bull; Average 2.4 min response</p>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
