"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, MapPin, Phone, Search, ShieldCheck, UserRoundCheck, UsersRound, LogOut, Trash2, Award, X } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { usePassengerStore } from "@/store/usePassengerStore";
import { useOperationsTable } from "@/hooks/useOperationsTable";

export default function CoolieAdminPage() {
  const { userRole, logout, assistanceRequests, initAssistanceRequests, assignAssistanceRequest, deleteAssistanceRequest } = usePassengerStore();
  const porterRequests = assistanceRequests.filter((request) => request.service === "porter");
  const { records: roster, refresh: refreshRoster } = useOperationsTable("porter-personnel");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoolies, setSelectedCoolies] = useState({});
  const [assigningRequest, setAssigningRequest] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentRequest, setAssignmentRequest] = useState(null);
  const [rosterView, setRosterView] = useState(null);

  useEffect(() => {
    initAssistanceRequests();
  }, [initAssistanceRequests]);

  const coolieStaff = roster.filter((person) => person.personnelId && !person.passengerName);
  const onDutyCoolies = coolieStaff.filter((person) => person.status === "On duty");
  const availableCoolies = coolieStaff.filter((person) => person.status === "Available");
  const onDutyCount = onDutyCoolies.length;
  const availableCount = availableCoolies.length;

  const filteredRequests = porterRequests.filter((request) =>
    request.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.contact?.includes(searchQuery) ||
    request.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignCoolie = async (requestId) => {
    const coolieId = selectedCoolies[requestId];
    if (!coolieId) {
      setAssignmentError("Select an available coolie before assigning.");
      return;
    }
    setAssigningRequest(requestId);
    setAssignmentError("");
    try {
      await assignAssistanceRequest(requestId, coolieId);
      await refreshRoster();
      setAssignmentRequest(null);
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to assign coolie.");
      await refreshRoster();
    } finally {
      setAssigningRequest("");
    }
  };

  const assignmentControl = (request) => {
    if (request.status !== "Pending") {
      return (
        <span className="text-[10px] font-black text-emerald-700">
          {request.assignedResourceCode || "Assigned"}
          {request.assignedPersonnelName ? ` · ${request.assignedPersonnelName}` : ""}
        </span>
      );
    }
    return (
        <button
          disabled={assigningRequest === request.id}
          onClick={() => {
            setAssignmentError("");
            setAssignmentRequest(request);
          }}
          className="rounded-lg bg-[#134489] px-3 py-2 text-[10px] font-black text-white disabled:opacity-45"
        >
          Assign coolie
        </button>
    );
  };

  return (
    <main className="min-h-screen bg-[#E6E3DB] px-4 py-6 text-[#010105] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[#134489]/10 bg-[#EDEBB9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FAC24A]">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black tracking-[.12em] text-[#134489]">COOLIE ADMIN</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                Independent operations desk &bull; Role: {userRole}
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
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#134489]">Passenger assistance · Porter operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Coolie service desk</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/50">Manage personnel availability, station assignments and luggage assistance requests in real time.</p>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="On duty" value={onDutyCount} detail={`${coolieStaff.length} coolies in database`} icon={UsersRound} tone="blue" onClick={() => setRosterView({ title: "On-duty coolies", items: onDutyCoolies })} onDetailClick={() => setRosterView({ title: "All registered coolies", items: coolieStaff })} />
          <StatCard label="Available now" value={availableCount} detail="Ready for assignment" icon={UserRoundCheck} onClick={() => setRosterView({ title: "Available coolies", items: availableCoolies })} />
          <StatCard label="Pending requests" value={porterRequests.filter((request) => request.status === "Pending").length} detail="Submitted passenger requests" icon={Clock3} tone="gold" />
          <StatCard label="Tasks completed" value={porterRequests.filter((request) => request.status === "Assigned").length} detail="Requests marked assigned" icon={ShieldCheck} tone="lemon" />
        </section>
        {assignmentError && <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-xs font-bold text-red-700">{assignmentError}</p>}

        {/* Coolie Personnel Roster Section */}
        <section className="mt-5 rounded-[24px] border border-black/7 bg-white/55 p-5 shadow-[0_10px_30px_rgba(1,1,5,.05)] sm:p-6">
          <div className="flex items-center justify-between border-b border-black/8 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">Licensed Coolie Roster</h2>
              <p className="mt-1 text-xs text-black/45">Personnel registration, badge IDs and task metrics from MongoDB</p>
            </div>
            <span className="rounded-full bg-[#134489] px-3 py-1 text-xs font-black text-white">
              {coolieStaff.length} Personnel Registered
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {coolieStaff.map((person) => (
              <div key={person.id || person.personnelId} className="rounded-2xl border border-black/8 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#134489]">{person.personnelId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${person.status === "On duty" ? "bg-blue-100 text-blue-700" : person.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                    {person.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-extrabold">{person.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-black/55"><Phone className="h-3.5 w-3.5" />{person.phone}</p>
                <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-2 text-xs">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600"><Award className="h-3.5 w-3.5 text-[#134489]" />{person.tasks} Tasks completed</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Passenger Requests Section */}
        <section className="mt-5 rounded-[24px] border border-black/7 bg-white/55 p-5 shadow-[0_10px_30px_rgba(1,1,5,.05)] sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold">Passenger requests</h2>
              <p className="mt-1 text-xs text-black/45">Coolie bookings submitted from the passenger page</p>
            </div>
            <span className="rounded-full bg-[#FAC24A] px-3 py-1 text-xs font-black">
              {porterRequests.filter((request) => request.status === "Pending").length} pending
            </span>
          </div>
          {porterRequests.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#134489]/25 p-6 text-center text-sm font-bold text-black/45">No passenger requests yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {porterRequests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-[#134489]/15 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{request.passengerName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[#134489]">{request.userEmail || request.passengerName}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-black/55"><Phone className="h-3.5 w-3.5" />{request.contact}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${request.status === "Pending" ? "bg-[#FAC24A]" : "bg-emerald-100 text-emerald-700"}`}>{request.status}</span>
                  </div>
                  <p className="mt-4 flex items-center gap-2 text-xs font-bold text-[#134489]"><MapPin className="h-4 w-4" />{request.pickup} → {request.destination}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-3">
                    <span className="text-[10px] font-bold text-black/40">{request.id} · {new Date(request.createdAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {assignmentControl(request)}
                      <button
                        onClick={() => deleteAssistanceRequest(request.id)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white hover:bg-red-700 flex items-center gap-1"
                        title="Delete request"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.55fr]">
          <article className="overflow-hidden rounded-[24px] border border-black/7 bg-white/55 shadow-[0_10px_30px_rgba(1,1,5,.05)]">
            <div className="flex flex-col gap-4 border-b border-black/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-lg font-extrabold">Coolie request table</h2>
                <p className="mt-1 text-xs text-black/45">Passenger requests fetched from MongoDB</p>
              </div>
              <label className="relative block sm:w-64">
                <span className="sr-only">Search requests</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search passenger or request"
                  className="h-10 w-full rounded-xl border border-black/10 bg-white/55 pl-10 pr-3 text-xs outline-none focus:border-[#134489]/50 focus:ring-4 focus:ring-[#134489]/10"
                />
              </label>
            </div>
            <div className="hidden grid-cols-[.75fr_1fr_1fr_1.2fr_.6fr_auto] gap-4 bg-[#010105] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 md:grid">
              <span>Request</span><span>Passenger</span><span>Contact</span><span>Route</span><span>Status</span><span>Action</span>
            </div>
            <div className="divide-y divide-black/8">
              {!filteredRequests.length && <p className="p-8 text-center text-sm font-bold text-black/45">No coolie requests available in database.</p>}
              {filteredRequests.map((request) => (
                <div key={request.id} className="grid gap-3 p-5 transition hover:bg-white/40 md:grid-cols-[.75fr_1fr_1fr_1.2fr_.6fr_auto] md:items-center md:gap-4 md:px-6">
                  <div>
                    <p className="text-xs font-black text-[#134489]">{request.id.slice(-8).toUpperCase()}</p>
                    <p className="mt-0.5 text-[9px] text-black/40">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">{request.passengerName}</p>
                    <p className="mt-0.5 text-[10px] text-black/40">{request.pickup}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-black/55"><Phone className="h-3.5 w-3.5" />{request.contact}</p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-black/55"><MapPin className="h-3.5 w-3.5" />{request.pickup} → {request.destination}</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${request.status === "Assigned" ? "bg-emerald-100 text-emerald-700" : "bg-[#FAC24A]"}`}>
                    {request.status}
                  </span>
                  {assignmentControl(request)}
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#134489] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FAC24A]">Assignment queue</p>
              {coolieStaff.find((c) => c.status === "Available") ? (
                <>
                  <h2 className="mt-3 text-xl font-black">
                    {coolieStaff.find((c) => c.status === "Available").name} ({coolieStaff.find((c) => c.status === "Available").personnelId})
                  </h2>
                  <p className="mt-2 text-xs text-[#FAC24A]">Ready at Gate 1 Main Entrance</p>
                  <p className="mt-3 text-xs leading-5 text-white/60">Top-rated porter available for immediate assignment.</p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 text-xl font-black">All Porters Assigned</h2>
                  <p className="mt-3 text-sm leading-6 text-white/60">Personnel are currently fulfilling luggage assistance requests.</p>
                </>
              )}
            </section>
            <section className="rounded-[24px] bg-[#EDEBB9] p-6">
              <h2 className="font-extrabold">Shift coverage</h2>
              <p className="mt-1 text-xs text-black/70">Lucknow Junction Shift 1 &bull; 100% Coverage</p>
              <p className="mt-2 text-[10px] font-bold text-[#134489]">5 Licensed Porters on Duty</p>
            </section>
          </aside>
        </section>

        {rosterView && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" aria-labelledby="coolie-roster-title" className="w-full max-w-xl rounded-[28px] bg-[#F7F6F2] p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div><h2 id="coolie-roster-title" className="text-2xl font-black">{rosterView.title}</h2><p className="mt-1 text-xs text-black/50">{rosterView.items.length} personnel</p></div>
                <button onClick={() => setRosterView(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-black/5" aria-label="Close roster"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto">
                {rosterView.items.length === 0 && <p className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm font-bold text-black/45">No coolies in this category.</p>}
                {rosterView.items.map((coolie) => (
                  <div key={coolie.id} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
                    <div><p className="text-sm font-black">{coolie.name}</p><p className="mt-1 text-xs text-black/50">{coolie.personnelId} · {coolie.phone}</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${coolie.status === "Available" ? "bg-emerald-100 text-emerald-700" : coolie.status === "On duty" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{coolie.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {assignmentRequest && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" aria-labelledby="coolie-assignment-title" className="w-full max-w-2xl rounded-[28px] bg-[#F7F6F2] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#134489]">Assign passenger request</p>
                  <h2 id="coolie-assignment-title" className="mt-1 text-2xl font-black">Choose a coolie</h2>
                  <p className="mt-1 text-xs text-black/50">All {coolieStaff.length} registered coolies are shown. Busy and off-duty personnel cannot be selected.</p>
                </div>
                <button onClick={() => setAssignmentRequest(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-black/5" aria-label="Close assignment"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {coolieStaff.map((coolie) => {
                  const available = coolie.status === "Available";
                  const selected = selectedCoolies[assignmentRequest.id] === coolie.id;
                  return (
                    <button
                      key={coolie.id}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedCoolies((current) => ({ ...current, [assignmentRequest.id]: coolie.id }))}
                      className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[#134489] bg-blue-50 ring-2 ring-[#134489]/15" : "border-black/10 bg-white"} disabled:cursor-not-allowed disabled:bg-black/[.04] disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-[#134489]">{coolie.personnelId}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {available ? "Available" : coolie.status === "On duty" ? "Busy" : coolie.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black">{coolie.name}</p>
                      <p className="mt-1 text-xs text-black/50">{coolie.phone}</p>
                    </button>
                  );
                })}
              </div>

              {assignmentError && <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-xs font-bold text-red-700">{assignmentError}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setAssignmentRequest(null)} className="rounded-xl border border-black/10 px-5 py-3 text-xs font-black">Cancel</button>
                <button
                  disabled={!selectedCoolies[assignmentRequest.id] || assigningRequest === assignmentRequest.id}
                  onClick={() => assignCoolie(assignmentRequest.id)}
                  className="rounded-xl bg-[#134489] px-5 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {assigningRequest === assignmentRequest.id ? "Assigning…" : "Confirm assignment"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
