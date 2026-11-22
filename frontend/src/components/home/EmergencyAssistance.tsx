"use client";

import { FormEvent, useState } from "react";
import { ShieldAlert, PhoneCall, HeartPulse, HelpCircle, CheckCircle2, Smartphone, MessageSquareText, X } from "lucide-react";
import { EMERGENCY_CONTACTS } from "@/lib/mock-data/home";
import { OPERATIONS_API_URL } from "@/lib/operations-api";
import { usePassengerStore } from "@/store/usePassengerStore";

export function EmergencyAssistance() {
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<(typeof EMERGENCY_CONTACTS)[number] | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [message, setMessage] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const userName = usePassengerStore((state) => state.userName);
  const userEmail = usePassengerStore((state) => state.userEmail);
  const token = usePassengerStore((state) => state.token);
  const logout = usePassengerStore((state) => state.logout);

  const openMobileForm = (service: (typeof EMERGENCY_CONTACTS)[number]) => {
    setSelectedService(service);
    setMobileNumber("");
    setMessage("");
    setMobileError("");
  };

  const triggerEmergency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) return;

    const normalizedMobile = mobileNumber.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(normalizedMobile)) {
      setMobileError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${OPERATIONS_API_URL}/operations/support-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          service: selectedService.id,
          passengerName: userName || "Passenger",
          userEmail: userEmail,
          contact: normalizedMobile,
          message: message.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (payload.code === "USER_NOT_FOUND_IN_DB" || payload.code === "USER_NOT_FOUND") {
          logout();
        }
        throw new Error(payload.message || "Unable to send assistance request.");
      }
      const adminDestination = selectedService.id === "medical" ? "Complaints Admin" : "Emergency Admin";
      setActiveAlert(
        `${selectedService.title} request sent to ${adminDestination}. The station team will contact you at +91 ${normalizedMobile}.`
      );
      setSelectedService(null);
      setMobileNumber("");
      setMessage("");
      setMobileError("");
      setTimeout(() => setActiveAlert(null), 4500);
    } catch (requestError) {
      setMobileError(requestError instanceof Error ? requestError.message : "Unable to send assistance request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full py-4" id="emergency">
      <div className="rounded-3xl bg-white border-2 border-red-500/40 p-5 sm:p-7 shadow-lg space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white font-black animate-pulse shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest block">
                24x7 Priority Support
              </span>
              <h3 className="text-xl font-black text-[#010105]">
                Emergency Station Assistance
              </h3>
            </div>
          </div>
          <span className="text-xs font-black text-red-700 bg-red-100 border border-red-300 px-3 py-1 rounded-xl self-start sm:self-auto">
            Direct Station SOS Response
          </span>
        </div>

        {activeAlert && (
          <div className="p-4 rounded-2xl bg-red-100 border-2 border-red-500 text-red-900 text-xs font-black flex items-center gap-3 animate-slide-up shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0" />
            <span>{activeAlert}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Medical */}
          <button
            type="button"
            onClick={() => openMobileForm(EMERGENCY_CONTACTS[0])}
            className="p-4 rounded-2xl bg-red-50/50 border-2 border-red-300 hover:border-red-600 text-left transition-all space-y-2 group focus:outline-none focus:ring-2 focus:ring-red-600 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <HeartPulse className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded">
                SOS 139
              </span>
            </div>
            <div>
              <h4 className="text-sm font-black text-[#010105] group-hover:text-red-700">
                {EMERGENCY_CONTACTS[0].title}
              </h4>
              <p className="text-xs text-[#010105]/70 font-medium">
                {EMERGENCY_CONTACTS[0].subtitle}
              </p>
            </div>
            <div className="pt-2 text-xs font-black text-red-700 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call First Aid ({EMERGENCY_CONTACTS[0].contactNumber})</span>
            </div>
          </button>

          {/* RPF Security */}
          <button
            type="button"
            onClick={() => openMobileForm(EMERGENCY_CONTACTS[1])}
            className="p-4 rounded-2xl bg-[#EDEBB9]/40 border-2 border-[#134489]/30 hover:border-[#134489] text-left transition-all space-y-2 group focus:outline-none focus:ring-2 focus:ring-[#134489] shadow-xs"
          >
            <div className="flex items-center justify-between">
              <ShieldAlert className="w-6 h-6 text-[#134489] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-[#010105] bg-[#FAC24A] px-2 py-0.5 rounded border border-[#010105]/20">
                RPF Police
              </span>
            </div>
            <div>
              <h4 className="text-sm font-black text-[#010105] group-hover:text-[#134489]">
                {EMERGENCY_CONTACTS[1].title}
              </h4>
              <p className="text-xs text-[#010105]/70 font-medium">
                {EMERGENCY_CONTACTS[1].subtitle}
              </p>
            </div>
            <div className="pt-2 text-xs font-black text-[#134489] flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call RPF ({EMERGENCY_CONTACTS[1].contactNumber})</span>
            </div>
          </button>

          {/* Help Desk */}
          <button
            type="button"
            onClick={() => openMobileForm(EMERGENCY_CONTACTS[2])}
            className="p-4 rounded-2xl bg-white border-2 border-[#134489]/30 hover:border-[#134489] text-left transition-all space-y-2 group focus:outline-none focus:ring-2 focus:ring-[#134489] shadow-xs"
          >
            <div className="flex items-center justify-between">
              <HelpCircle className="w-6 h-6 text-[#134489] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-[#010105] bg-[#EDEBB9] px-2 py-0.5 rounded border border-[#134489]/20">
                Gate 1 Desk
              </span>
            </div>
            <div>
              <h4 className="text-sm font-black text-[#010105]">
                {EMERGENCY_CONTACTS[2].title}
              </h4>
              <p className="text-xs text-[#010105]/70 font-medium">
                {EMERGENCY_CONTACTS[2].subtitle}
              </p>
            </div>
            <div className="pt-2 text-xs font-black text-[#134489] flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Enquiry Desk</span>
            </div>
          </button>

        </div>

      </div>

      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#010105]/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedService(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assistance-mobile-title"
            className="w-full max-w-md rounded-3xl border-2 border-[#134489]/25 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#134489]/15 pb-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white ${selectedService.id === "medical" ? "bg-red-600" : "bg-[#134489]"}`}>
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#134489]">
                    Contact confirmation
                  </p>
                  <h3 id="assistance-mobile-title" className="mt-1 text-lg font-black text-[#010105]">
                    {selectedService.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-[#010105]/55 transition hover:bg-[#134489]/10 hover:text-[#010105]"
                aria-label="Close mobile number form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={triggerEmergency}>
              <div className="rounded-2xl bg-[#EDEBB9]/45 p-4 text-xs font-semibold leading-5 text-[#293442]">
                Enter the passenger&apos;s mobile number so the {selectedService.title} team can call back and coordinate assistance.
              </div>

              <label className="block space-y-2">
                <span className="text-xs font-black text-[#010105]">Mobile number</span>
                <div className={`flex h-12 items-center rounded-xl border-2 bg-white transition focus-within:ring-4 ${mobileError ? "border-red-500 focus-within:ring-red-500/10" : "border-[#134489]/25 focus-within:border-[#134489] focus-within:ring-[#134489]/10"}`}>
                  <span className="border-r border-[#134489]/15 px-3 text-sm font-black text-[#134489]">+91</span>
                  <input
                    autoFocus
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={mobileNumber}
                    onChange={(event) => {
                      setMobileNumber(event.target.value);
                      if (mobileError) setMobileError("");
                    }}
                    placeholder="98765 43210"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-[#010105] outline-none"
                    aria-describedby={mobileError ? "mobile-number-error" : undefined}
                    aria-invalid={Boolean(mobileError)}
                  />
                </div>
                {mobileError && (
                  <p id="mobile-number-error" className="text-xs font-bold text-red-600">
                    {mobileError}
                  </p>
                )}
              </label>

              <label className="block space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#010105]">
                  <MessageSquareText className="h-3.5 w-3.5 text-[#134489]" />
                  Message for the response team
                </span>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    selectedService.id === "medical"
                      ? "Describe the medical emergency and your exact location…"
                      : selectedService.id === "security"
                        ? "Describe the safety issue and your exact location…"
                        : "Tell the help desk what assistance you need and where you are…"
                  }
                  className="w-full resize-none rounded-xl border-2 border-[#134489]/25 bg-white px-3.5 py-3 text-sm font-medium text-[#010105] outline-none transition placeholder:text-[#010105]/35 focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10"
                />
                <p className="text-right text-[10px] font-bold text-[#010105]/40">
                  {message.length}/1000
                </p>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="flex-1 rounded-xl border-2 border-[#134489]/20 px-4 py-3 text-xs font-black text-[#134489] transition hover:bg-[#134489]/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 rounded-xl px-4 py-3 text-xs font-black text-white shadow-md transition disabled:cursor-wait disabled:opacity-60 ${selectedService.id === "medical" ? "bg-red-600 hover:bg-red-700" : "bg-[#134489] hover:bg-[#0d2f61]"}`}
                >
                  {submitting ? "Sending…" : "Send assistance request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
