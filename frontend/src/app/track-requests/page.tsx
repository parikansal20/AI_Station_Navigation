"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Luggage,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  LogIn,
  MapPin,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MobileBottomNav } from "@/components/home/MobileBottomNav";
import { usePassengerStore, AssistanceRequest } from "@/store/usePassengerStore";

export default function TrackRequestsPage() {
  const { isLoggedIn, userEmail, userName, assistanceRequests, initAssistanceRequests } = usePassengerStore();
  const [filter, setFilter] = useState<"all" | "porter" | "golf-cart">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchRequests = () => {
      if (isLoggedIn && userEmail) {
        initAssistanceRequests(userEmail);
      } else {
        initAssistanceRequests();
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [isLoggedIn, userEmail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await initAssistanceRequests(userEmail);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const userRequests = assistanceRequests.filter((req) => {
    if (!isLoggedIn || !userEmail) return false;
    // Strictly filter by logged in user's email
    if (req.userEmail) {
      return req.userEmail.toLowerCase() === userEmail.toLowerCase();
    }
    return false;
  });

  const filteredRequests = userRequests.filter((req) => {
    if (filter === "porter") return req.service === "porter";
    if (filter === "golf-cart") return req.service === "golf-cart";
    return true;
  });

  const pendingCount = userRequests.filter((req) => req.status === "Pending").length;
  const assignedCount = userRequests.filter((req) => req.status === "Assigned").length;

  return (
    <div className="min-h-screen bg-[#E6E3DB] text-[#010105] selection:bg-[#FAC24A] font-sans antialiased relative">
      <HomeHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 space-y-6">
        {/* Navigation back breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black text-[#134489] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Station Home
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#134489]/20 text-xs font-bold text-[#134489] hover:border-[#134489] shadow-2xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Hero Title Header */}
        <div className="bg-gradient-to-r from-[#134489] via-[#0d2f61] to-[#010105] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#FAC24A]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAC24A] text-[#010105]">
              Live Request Telemetry
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Track Your Assistance Requests
            </h1>
            <p className="text-xs sm:text-sm text-gray-200 font-medium">
              Monitor real-time status for your Luggage Porter (Coolie) and Electric Golf Cart bookings at Lucknow Junction.
            </p>
          </div>
        </div>

        {!isLoggedIn ? (
          /* Unauthenticated State Card */
          <div className="p-8 rounded-3xl bg-white border-2 border-[#134489]/30 shadow-lg text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-14 h-14 bg-amber-100 border border-amber-300 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <LogIn className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[#010105]">Authentication Required</h2>
              <p className="text-xs text-[#010105]/70 font-medium">
                Please log in to your account to track your submitted Golf Cart &amp; Porter assistance requests.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] font-black text-sm border border-[#010105] shadow-md transition-all"
            >
              <LogIn className="w-4 h-4 text-[#FAC24A]" />
              <span>Log In to View Status</span>
            </Link>
          </div>
        ) : (
          /* Authenticated Requests List */
          <div className="space-y-6">
            {/* Status Statistics Summary Bar */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white border border-[#134489]/20 shadow-xs text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-[#010105]/60">Total Requests</p>
                <p className="text-xl sm:text-2xl font-black text-[#134489]">{assistanceRequests.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-300 bg-amber-50/50 shadow-xs text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-amber-800">Pending</p>
                <p className="text-xl sm:text-2xl font-black text-amber-700">{pendingCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-emerald-300 bg-emerald-50/50 shadow-xs text-center space-y-1">
                <p className="text-[10px] font-black uppercase text-emerald-800">Accepted &amp; Assigned</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700">{assignedCount}</p>
              </div>
            </div>

            {/* Service Filters */}
            <div className="flex items-center gap-2 border-b border-[#134489]/20 pb-3 overflow-x-auto">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  filter === "all"
                    ? "bg-[#134489] text-white shadow-md"
                    : "bg-white/80 text-[#010105]/70 hover:bg-white hover:text-[#134489]"
                }`}
              >
                All Services ({assistanceRequests.length})
              </button>
              <button
                onClick={() => setFilter("porter")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  filter === "porter"
                    ? "bg-[#134489] text-white shadow-md"
                    : "bg-white/80 text-[#010105]/70 hover:bg-white hover:text-[#134489]"
                }`}
              >
                <Luggage className="w-3.5 h-3.5 text-[#FAC24A]" />
                Porter ({assistanceRequests.filter((r) => r.service === "porter").length})
              </button>
              <button
                onClick={() => setFilter("golf-cart")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  filter === "golf-cart"
                    ? "bg-[#134489] text-white shadow-md"
                    : "bg-white/80 text-[#010105]/70 hover:bg-white hover:text-[#134489]"
                }`}
              >
                <Car className="w-3.5 h-3.5 text-[#FAC24A]" />
                Golf Cart ({assistanceRequests.filter((r) => r.service === "golf-cart").length})
              </button>
            </div>

            {/* Request Cards List */}
            {filteredRequests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border-2 border-dashed border-[#134489]/20 text-center space-y-3">
                <p className="text-sm font-bold text-[#010105]/60">No assistance requests found.</p>
                <Link
                  href="/#passenger-services"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAC24A] text-[#010105] text-xs font-black border border-[#010105] shadow-xs hover:bg-[#d4a028] transition-colors"
                >
                  <span>Book Assistance Now</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRequests.map((request: AssistanceRequest) => {
                  const isAccepted = request.status === "Assigned";

                  return (
                    <div
                      key={request.id}
                      className="p-5 rounded-3xl bg-white border-2 border-[#134489]/20 hover:border-[#134489] shadow-md space-y-4 transition-all"
                    >
                      {/* Card Header: Service + Status Pill */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#134489]/15">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#134489] text-[#FAC24A] flex items-center justify-center shadow-xs">
                            {request.service === "porter" ? (
                              <Luggage className="w-5 h-5" />
                            ) : (
                              <Car className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[#010105]">
                              {request.service === "porter" ? "Luggage Porter (Coolie)" : "Electric Golf Cart"}
                            </h3>
                            <p className="text-[10px] font-bold text-[#010105]/50 uppercase">
                              ID: {request.id.slice(-6)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isAccepted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Accepted &amp; Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAC24A]/90 border border-[#010105]/20 text-[#010105] text-xs font-black shadow-2xs animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-[#134489]" />
                            Pending Acceptance
                          </span>
                        )}
                      </div>

                      {/* Request Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#010105]/50 uppercase flex items-center gap-1">
                            <User className="w-3 h-3 text-[#134489]" /> Passenger
                          </span>
                          <p className="font-black text-[#010105] truncate">{request.passengerName}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#010105]/50 uppercase flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#134489]" /> Mobile Contact
                          </span>
                          <p className="font-black text-[#010105]">{request.contact}</p>
                        </div>

                        {request.userEmail && (
                          <div className="space-y-0.5 col-span-2">
                            <span className="text-[10px] font-extrabold text-[#010105]/50 uppercase flex items-center gap-1">
                              Linked Email
                            </span>
                            <p className="font-bold text-[#134489] truncate">{request.userEmail}</p>
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#010105]/50 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#134489]" /> Pickup Point
                          </span>
                          <p className="font-bold text-[#010105]/80">{request.pickup}</p>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#010105]/50 uppercase flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#134489]" /> Destination
                          </span>
                          <p className="font-black text-[#134489]">{request.destination}</p>
                        </div>
                      </div>

                      {/* Status banner description */}
                      <div
                        className={`p-3 rounded-xl border text-xs font-bold ${
                          isAccepted
                            ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                            : "bg-[#EDEBB9]/60 border-[#134489]/20 text-[#010105]/80"
                        }`}
                      >
                        {isAccepted ? (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Request accepted! Operator has been assigned for pickup at Gate 1.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#134489] shrink-0" />
                            <span>Request submitted to Station Admin desk. Waiting for operator acceptance...</span>
                          </div>
                        )}
                      </div>

                      {/* Timestamp Footer */}
                      <div className="pt-2 border-t border-[#134489]/10 text-[10px] font-bold text-[#010105]/50 text-right">
                        Requested on: {new Date(request.createdAt).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
