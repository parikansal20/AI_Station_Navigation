"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BusFront, Clock3, MapPin, Navigation, Phone, Wrench, LogOut, Trash2, BatteryCharging, X } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { usePassengerStore } from "@/store/usePassengerStore";
import { useOperationsTable } from "@/hooks/useOperationsTable";

export default function GolfCartAdminPage() {
  const { userRole, logout, assistanceRequests, initAssistanceRequests, assignAssistanceRequest, deleteAssistanceRequest } = usePassengerStore();
  const golfCartRequests = assistanceRequests.filter((request) => request.service === "golf-cart");
  const { records: fleet, refresh: refreshFleet } = useOperationsTable("golf-carts");
  const [selectedCarts, setSelectedCarts] = useState({});
  const [assigningRequest, setAssigningRequest] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentRequest, setAssignmentRequest] = useState(null);
  const [fleetView, setFleetView] = useState(null);

  useEffect(() => {
    initAssistanceRequests();
  }, [initAssistanceRequests]);

  const fleetCarts = fleet.filter((cart) => cart.cartId && !cart.passengerName);
  const availableCarts = fleetCarts.filter((cart) => cart.status === "Available");
  const activeTrips = fleetCarts.filter((cart) => cart.status === "On trip");

  const assignCart = async (requestId) => {
    const cartId = selectedCarts[requestId];
    if (!cartId) {
      setAssignmentError("Select an available golf cart before assigning.");
      return;
    }
    setAssigningRequest(requestId);
    setAssignmentError("");
    try {
      await assignAssistanceRequest(requestId, cartId);
      await refreshFleet();
      setAssignmentRequest(null);
    } catch (error) {
      setAssignmentError(error instanceof Error ? error.message : "Unable to assign golf cart.");
      await refreshFleet();
    } finally {
      setAssigningRequest("");
    }
  };

  const assignmentControl = (request) => {
    if (request.status !== "Pending") {
      return (
        <span className="text-[10px] font-black text-emerald-700">
          {request.assignedCartCode || "Assigned"}
          {request.assignedDriverName ? ` · ${request.assignedDriverName}` : ""}
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
          Assign cart
        </button>
    );
  };

  return (
    <main className="min-h-screen bg-[#E6E3DB] px-4 py-6 text-[#010105] sm:px-7 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 rounded-[24px] border border-[#134489]/10 bg-[#EDEBB9] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#FAC24A]">
              <BusFront className="h-5 w-5" />
            </span>
            <div>
              <p className="font-black tracking-[.12em] text-[#134489]">GOLF CART ADMIN</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                Independent fleet desk &bull; Role: {userRole}
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
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#134489]">Accessible mobility · Fleet operations</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Golf cart fleet</h1>
            <p className="mt-2 max-w-2xl text-sm text-black/50">Dispatch accessible transport, track drivers and monitor vehicle readiness across station zones.</p>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Fleet available" value={availableCarts.length} detail={`${fleetCarts.length} carts registered in DB`} icon={BusFront} tone="blue" onClick={() => setFleetView({ title: "Available golf carts", items: availableCarts })} onDetailClick={() => setFleetView({ title: "All registered golf carts", items: fleetCarts })} />
          <StatCard label="Active trips" value={activeTrips.length} detail="Active passenger transfers" icon={Navigation} onClick={() => setFleetView({ title: "Golf carts on trips", items: activeTrips })} />
          <StatCard label="Pending requests" value={golfCartRequests.filter((request) => request.status === "Pending").length} detail="Submitted passenger requests" icon={Clock3} tone="gold" />
          <StatCard label="Assigned requests" value={golfCartRequests.filter((request) => request.status === "Assigned").length} detail="Requests marked assigned" icon={Wrench} tone="lemon" />
        </section>
        {assignmentError && <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-xs font-bold text-red-700">{assignmentError}</p>}

        {/* Fleet Vehicles Table */}
        <section className="mt-5 rounded-[24px] border border-black/7 bg-white/55 p-5 shadow-[0_10px_30px_rgba(1,1,5,.05)] sm:p-6">
          <div className="flex items-center justify-between border-b border-black/8 pb-4">
            <div>
              <h2 className="text-lg font-extrabold">Registered Fleet Vehicles</h2>
              <p className="mt-1 text-xs text-black/45">Golf cart vehicle status and battery telemetry from MongoDB</p>
            </div>
            <span className="rounded-full bg-[#134489] px-3 py-1 text-xs font-black text-white">
              {fleetCarts.length} Vehicles
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {fleetCarts.map((cart) => (
              <div key={cart.id || cart.cartId} className="rounded-2xl border border-black/8 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#134489]">{cart.cartId}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${cart.status === "Available" ? "bg-emerald-100 text-emerald-700" : cart.status === "On trip" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>
                    {cart.status}
                  </span>
                </div>
                <p className="mt-2 text-sm font-extrabold">{cart.driver || "Unassigned"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-black/55"><MapPin className="h-3.5 w-3.5" />{cart.location}</p>
                <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-slate-700"><BatteryCharging className="h-3.5 w-3.5 text-emerald-600" />{cart.battery}%</span>
                  <span className="text-[10px] text-black/40">Ready</span>
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
              <p className="mt-1 text-xs text-black/45">Golf cart bookings submitted from the passenger page</p>
            </div>
            <span className="rounded-full bg-[#FAC24A] px-3 py-1 text-xs font-black">
              {golfCartRequests.filter((request) => request.status === "Pending").length} pending
            </span>
          </div>
          {golfCartRequests.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[#134489]/25 p-6 text-center text-sm font-bold text-black/45">No passenger requests yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {golfCartRequests.map((request) => (
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
            <div className="border-b border-black/8 p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">Golf cart request table</h2>
              <p className="mt-1 text-xs text-black/45">Passenger requests fetched from MongoDB</p>
            </div>
            <div className="hidden grid-cols-[.75fr_1fr_1fr_1.2fr_.6fr_auto] gap-4 bg-[#010105] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white/50 md:grid">
              <span>Request</span><span>Passenger</span><span>Contact</span><span>Route</span><span>Status</span><span>Action</span>
            </div>
            <div className="divide-y divide-black/8">
              {!golfCartRequests.length && <p className="p-8 text-center text-sm font-bold text-black/45">No golf cart requests available in database.</p>}
              {golfCartRequests.map((request) => (
                <div key={request.id} className="grid gap-3 p-5 md:grid-cols-[.75fr_1fr_1fr_1.2fr_.6fr_auto] md:items-center md:gap-4 md:px-6">
                  <div><p className="text-xs font-black text-[#134489]">{request.id.slice(-8).toUpperCase()}</p><p className="mt-0.5 text-[9px] text-black/40">{new Date(request.createdAt).toLocaleString()}</p></div>
                  <div><p className="text-sm font-extrabold">{request.passengerName}</p><p className="mt-0.5 text-[10px] text-black/40">{request.pickup}</p></div>
                  <p className="flex items-center gap-1.5 text-xs text-black/55"><Phone className="h-3.5 w-3.5" />{request.contact}</p>
                  <p className="flex items-center gap-1.5 text-xs text-black/55"><MapPin className="h-3.5 w-3.5" />{request.pickup} → {request.destination}</p>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${request.status === "Assigned" ? "bg-emerald-100 text-emerald-700" : "bg-[#FAC24A]"}`}>{request.status}</span>
                  {assignmentControl(request)}
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <section className="rounded-[24px] bg-[#010105] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#FAC24A]">Next dispatch</p>
              {availableCarts.length > 0 ? (
                <>
                  <h2 className="mt-3 text-xl font-black">{availableCarts[0].cartId} — {availableCarts[0].driver}</h2>
                  <p className="mt-2 text-xs text-[#FAC24A]">Standby at {availableCarts[0].location}</p>
                  <p className="mt-3 text-xs leading-5 text-white/60">Ready for instant passenger transfer upon dispatch request.</p>
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-2xl font-black">All Carts En Route</h2>
                  <p className="mt-3 text-sm text-white/55">Vehicles are currently completing passenger transfers.</p>
                </>
              )}
            </section>
            <section className="rounded-[24px] bg-[#EDEBB9] p-6">
              <h2 className="font-extrabold">Charging capacity</h2>
              <p className="mt-1 text-xs text-black/70">Charging Station Bay B &bull; 2 Ports Active</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#134489]">
                <BatteryCharging className="h-4 w-4" /> CRT-05 charging (20% battery)
              </div>
            </section>
          </aside>
        </section>

        {fleetView && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" aria-labelledby="fleet-roster-title" className="w-full max-w-xl rounded-[28px] bg-[#F7F6F2] p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div><h2 id="fleet-roster-title" className="text-2xl font-black">{fleetView.title}</h2><p className="mt-1 text-xs text-black/50">{fleetView.items.length} vehicles</p></div>
                <button onClick={() => setFleetView(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-black/5" aria-label="Close fleet list"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto">
                {fleetView.items.length === 0 && <p className="rounded-2xl border border-dashed border-black/15 p-6 text-center text-sm font-bold text-black/45">No golf carts in this category.</p>}
                {fleetView.items.map((cart) => (
                  <div key={cart.id} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4">
                    <div><p className="text-sm font-black">{cart.cartId} · {cart.driver}</p><p className="mt-1 text-xs text-black/50">{cart.location} · {cart.battery}% battery</p></div>
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${cart.status === "Available" ? "bg-emerald-100 text-emerald-700" : cart.status === "On trip" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>{cart.status}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {assignmentRequest && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" aria-labelledby="cart-assignment-title" className="w-full max-w-2xl rounded-[28px] bg-[#F7F6F2] p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#134489]">Assign passenger request</p>
                  <h2 id="cart-assignment-title" className="mt-1 text-2xl font-black">Choose a golf cart</h2>
                  <p className="mt-1 text-xs text-black/50">All {fleetCarts.length} registered carts are shown. Carts on trips or under maintenance cannot be selected.</p>
                </div>
                <button onClick={() => setAssignmentRequest(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-black/5" aria-label="Close assignment"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {fleetCarts.map((cart) => {
                  const available = cart.status === "Available";
                  const selected = selectedCarts[assignmentRequest.id] === cart.id;
                  return (
                    <button
                      key={cart.id}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedCarts((current) => ({ ...current, [assignmentRequest.id]: cart.id }))}
                      className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[#134489] bg-blue-50 ring-2 ring-[#134489]/15" : "border-black/10 bg-white"} disabled:cursor-not-allowed disabled:bg-black/[.04] disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-black text-[#134489]">{cart.cartId}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${available ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                          {available ? "Available" : cart.status === "On trip" ? "Busy" : cart.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black">{cart.driver}</p>
                      <p className="mt-1 text-xs text-black/50">{cart.location} · {cart.battery}% battery</p>
                    </button>
                  );
                })}
              </div>

              {assignmentError && <p className="mt-4 rounded-xl bg-red-100 px-4 py-3 text-xs font-bold text-red-700">{assignmentError}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setAssignmentRequest(null)} className="rounded-xl border border-black/10 px-5 py-3 text-xs font-black">Cancel</button>
                <button
                  disabled={!selectedCarts[assignmentRequest.id] || assigningRequest === assignmentRequest.id}
                  onClick={() => assignCart(assignmentRequest.id)}
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
