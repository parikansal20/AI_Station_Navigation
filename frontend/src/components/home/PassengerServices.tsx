"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Luggage,
  Car,
  Clock,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  LogIn,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { PASSENGER_SERVICES, STATION_NODES } from "@/lib/mock-data/home";
import { usePassengerStore } from "@/store/usePassengerStore";

export function PassengerServices({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"porter" | "golf-cart" | null>(null);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [existingBookingPrompt, setExistingBookingPrompt] = useState<{
    serviceType: "porter" | "golf-cart";
    existing: any;
  } | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState("");
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [destination, setDestination] = useState("");

  const isLoggedIn = usePassengerStore((state) => state.isLoggedIn);
  const userName = usePassengerStore((state) => state.userName);
  const userEmail = usePassengerStore((state) => state.userEmail);
  const selectedDestination = usePassengerStore((state) => state.selectedDestination);
  const assistanceRequests = usePassengerStore((state) => state.assistanceRequests);
  const addAssistanceRequest = usePassengerStore((state) => state.addAssistanceRequest);

  const openBookingModal = (serviceType: "porter" | "golf-cart") => {
    setActiveModal(serviceType);
    setBookingSuccess(null);
    setContactError(null);
    setPassengerName(userName);
    setContact("");
    const matchedNode = STATION_NODES.find((node) => node.toLowerCase() === selectedDestination.toLowerCase());
    setDestination(matchedNode || STATION_NODES[0]);
  };

  const handleBook = (serviceType: "porter" | "golf-cart") => {
    if (!isLoggedIn) {
      setShowAuthRequiredModal(true);
      return;
    }

    // Check if user already has an active booking for the exact SAME service type (porter vs golf-cart)
    const existing = assistanceRequests.find(
      (req) =>
        req.service === serviceType &&
        ((userEmail && req.userEmail && req.userEmail.toLowerCase() === userEmail.toLowerCase()) ||
          (!userName || req.passengerName.toLowerCase() === userName.toLowerCase()))
    );

    if (existing) {
      setExistingBookingPrompt({ serviceType, existing });
      return;
    }

    openBookingModal(serviceType);
  };

  const handleContactChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setContact(digitsOnly);
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setContactError("Mobile number must be exactly 10 digits");
    } else {
      setContactError(null);
    }
  };

  const confirmBooking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeModal) return;

    if (!isLoggedIn) {
      setShowAuthRequiredModal(true);
      setActiveModal(null);
      return;
    }

    const cleanContact = contact.trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      setContactError("Mobile number must be exactly 10 digits (e.g. 9876543210)");
      return;
    }

    const serviceName = activeModal === "porter" ? "Luggage Porter" : "Golf Cart";
    try {
      await addAssistanceRequest({
        service: activeModal,
        passengerName: passengerName.trim(),
        userEmail: userEmail,
        contact: cleanContact,
        destination: destination.trim(),
        pickup: "Main Entrance — Gate 1",
      });
      setBookingSuccess(`Request submitted successfully! Linked to email ${userEmail || passengerName}. You can track your request status now.`);
    } catch (error) {
      setBookingSuccess(error instanceof Error ? error.message : "Unable to submit request.");
      return;
    }
    setTimeout(() => {
      setActiveModal(null);
      setBookingSuccess(null);
    }, 4000);
  };

  return (
    <section className="w-full py-4" id="passenger-services">
      <div className="space-y-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#010105] tracking-tight">
            Passenger Services & Assistance
          </h3>
          <p className="text-xs text-[#010105]/70 font-medium">
            On-demand station assistance for luggage and transit mobility
          </p>
        </div>

        {/* 2 Service Cards */}
        <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>

          {/* Card 1: Coolie / Porter */}
          <div className={`${compact ? "p-4" : "p-6"} rounded-3xl bg-white border-2 border-[#134489]/30 hover:border-[#134489] shadow-lg flex flex-col justify-between space-y-4 transition-all group`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#134489] border border-[#010105] text-[#FAC24A] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Luggage className="w-6 h-6 text-[#FAC24A]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FAC24A] text-[#010105] border border-[#010105]/20">
                  {PASSENGER_SERVICES[0].badgeText}
                </span>
              </div>

              <div>
                <h4 className={`${compact ? "text-base" : "text-xl"} font-black text-[#010105]`}>
                  {PASSENGER_SERVICES[0].title}
                </h4>
                <p className="text-xs text-[#010105]/70 font-medium">
                  {PASSENGER_SERVICES[0].subtitle}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs border-t border-[#134489]/20 font-bold">
                <div className="flex items-center gap-2 text-[#010105]">
                  <UserCheck className="w-4 h-4 text-[#134489]" />
                  <span>{PASSENGER_SERVICES[0].status}</span>
                </div>
                <div className="flex items-center gap-2 text-[#010105]/70">
                  <Clock className="w-4 h-4 text-[#134489]" />
                  <span>Est. Arrival: {PASSENGER_SERVICES[0].eta}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBook("porter")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] font-black text-sm border border-[#010105] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Luggage className="w-4 h-4 text-[#FAC24A]" />
              <span>Book a Porter</span>
            </button>
          </div>

          {/* Card 2: Golf Cart */}
          <div className={`${compact ? "p-4" : "p-6"} rounded-3xl bg-white border-2 border-[#134489]/30 hover:border-[#134489] shadow-lg flex flex-col justify-between space-y-4 transition-all group`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#134489] border border-[#010105] text-[#FAC24A] flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  <Car className="w-6 h-6 text-[#FAC24A]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {PASSENGER_SERVICES[1].badgeText}
                </span>
              </div>

              <div>
                <h4 className={`${compact ? "text-base" : "text-xl"} font-black text-[#010105]`}>
                  {PASSENGER_SERVICES[1].title}
                </h4>
                <p className="text-xs text-[#010105]/70 font-medium">
                  {PASSENGER_SERVICES[1].subtitle}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 text-xs border-t border-[#134489]/20 font-bold">
                <div className="flex items-center gap-2 text-[#010105]">
                  <ShieldCheck className="w-4 h-4 text-[#134489]" />
                  <span>{PASSENGER_SERVICES[1].status}</span>
                </div>
                <div className="flex items-center gap-2 text-[#010105]/70">
                  <Clock className="w-4 h-4 text-[#134489]" />
                  <span>Pickup: {PASSENGER_SERVICES[1].eta}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBook("golf-cart")}
              className="w-full py-3.5 px-4 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] font-black text-sm border border-[#010105] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Car className="w-4 h-4 text-[#FAC24A]" />
              <span>Request Golf Cart</span>
            </button>
          </div>

        </div>
      </div>

      {/* Auth Required Modal */}
      {showAuthRequiredModal && (
        <div className="fixed inset-0 z-50 bg-[#010105]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#134489] rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600 border border-amber-300">
              <LogIn className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-[#010105]">Login Required</h4>
              <p className="text-xs text-[#010105]/70 font-medium">
                Please log in to your account before booking Golf Cart or Luggage Porter assistance.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAuthRequiredModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-[#134489]/30 text-xs font-bold text-[#010105]"
              >
                Cancel
              </button>
              <Link
                href="/auth/login"
                onClick={() => setShowAuthRequiredModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#134489] text-white text-xs font-black hover:bg-[#0d2f61] transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <LogIn className="w-4 h-4 text-[#FAC24A]" />
                <span>Go to Login</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Existing Booking Permission Prompt Modal */}
      {existingBookingPrompt && (
        <div className="fixed inset-0 z-50 bg-[#010105]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#134489] rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up text-center">
            <div className="w-12 h-12 bg-amber-100 border border-amber-300 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-[#010105]">Existing Booking Detected</h4>
              <p className="text-xs text-[#010105]/80 font-medium leading-relaxed">
                You have already submitted a{" "}
                <strong className="text-[#134489]">
                  {existingBookingPrompt.existing.service === "porter" ? "Luggage Porter" : "Golf Cart"}
                </strong>{" "}
                request for <strong>{existingBookingPrompt.existing.destination}</strong> (Status:{" "}
                <span className="text-amber-700 font-bold">{existingBookingPrompt.existing.status}</span>).
              </p>
              <p className="text-[11px] font-bold text-[#010105]/60">
                Would you like to track your active request or proceed to book another request?
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/track-requests"
                onClick={() => setExistingBookingPrompt(null)}
                className="w-full py-3 rounded-xl bg-[#134489] text-white text-xs font-black hover:bg-[#0d2f61] transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Track Existing Request</span>
                <ArrowRight className="w-4 h-4 text-[#FAC24A]" />
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExistingBookingPrompt(null)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[#134489]/30 text-xs font-bold text-[#010105]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const svc = existingBookingPrompt.serviceType;
                    setExistingBookingPrompt(null);
                    openBookingModal(svc);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#FAC24A] text-[#010105] text-xs font-black border border-[#010105] hover:bg-[#d4a028] transition-colors"
                >
                  Book Another Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal Dialog */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-[#010105]/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#134489] rounded-3xl p-6 shadow-2xl space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-[#134489]/20 pb-3">
              <h4 className="text-lg font-black text-[#010105]">
                {activeModal === "porter" ? "Book Luggage Porter" : "Request Electric Golf Cart"}
              </h4>
              <button
                onClick={() => setActiveModal(null)}
                className="text-[#010105]/60 hover:text-[#010105] font-black text-sm"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-400 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-black text-emerald-800">{bookingSuccess}</p>
                <Link
                  href="/track-requests"
                  onClick={() => setActiveModal(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#134489] text-white text-xs font-black hover:bg-[#0d2f61] shadow-md transition-all"
                >
                  <span>Track Request Status</span>
                  <ArrowRight className="w-4 h-4 text-[#FAC24A]" />
                </Link>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={confirmBooking}>
                <p className="text-xs text-[#010105]/80 font-medium">
                  {activeModal === "porter"
                    ? "Specify your luggage piece count and pick-up location at Lucknow Junction."
                    : "Select your destination platform for Golf Cart assistance."}
                </p>

                <div className="bg-[#EDEBB9]/60 p-3.5 rounded-xl border border-[#134489]/30 text-xs space-y-1 font-bold">
                  <p className="text-[#010105]">
                    <strong>Pickup Point:</strong> Main Entrance • Gate 1
                  </p>
                  <p className="text-[#134489] font-black">
                    {activeModal === "porter" ? "Estimated Rate: ₹150 / luggage" : "Service Fee: FREE for Seniors & PwD"}
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-black text-[#010105]">Passenger name</span>
                  <input
                    required
                    value={passengerName}
                    onChange={(event) => setPassengerName(event.target.value)}
                    placeholder="Enter passenger name"
                    className="h-11 w-full rounded-xl border border-[#134489]/30 bg-white px-3.5 text-sm outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10"
                  />
                </label>
                <label className="block space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#010105]">Contact number (10 Digits)</span>
                    <span className="text-[10px] font-bold text-[#010105]/50">{contact.length}/10</span>
                  </div>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={contact}
                    onChange={(event) => handleContactChange(event.target.value)}
                    placeholder="e.g. 9876543210"
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm outline-none focus:ring-4 ${contactError
                        ? "border-red-500 focus:border-red-600 focus:ring-red-100"
                        : "border-[#134489]/30 focus:border-[#134489] focus:ring-[#134489]/10"
                      }`}
                  />
                  {contactError && (
                    <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 pt-0.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {contactError}
                    </p>
                  )}
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black text-[#010105]">Destination station node</span>
                  <select
                    required
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#134489]/30 bg-white px-3.5 text-sm font-bold text-[#010105] outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10"
                  >
                    {STATION_NODES.map((node) => (
                      <option key={node} value={node}>
                        📍 {node}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-3 rounded-xl border-2 border-[#134489]/30 text-xs font-bold text-[#010105]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#FAC24A] text-[#010105] text-xs font-black border border-[#010105] hover:bg-[#d4a028] transition-colors"
                  >
                    Confirm Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
