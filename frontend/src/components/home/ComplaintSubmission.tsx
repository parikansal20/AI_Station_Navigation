"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, MessageSquareWarning, Send } from "lucide-react";
import { OPERATIONS_API_URL } from "@/lib/operations-api";
import { usePassengerStore } from "@/store/usePassengerStore";

export function ComplaintSubmission({ compact = false }: { compact?: boolean }) {
  const userName = usePassengerStore((state) => state.userName);
  const [name, setName] = useState(userName);
  const [contact, setContact] = useState("");
  const [complaint, setComplaint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");
  const userEmail = usePassengerStore((state) => state.userEmail);
  const token = usePassengerStore((state) => state.token);
  const logout = usePassengerStore((state) => state.logout);

  const submitComplaint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setTicketId("");
    try {
      const response = await fetch(`${OPERATIONS_API_URL}/operations/complaints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          passenger: name.trim(),
          userEmail: userEmail,
          contact: contact.trim(),
          issue: complaint.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        if (payload.code === "USER_NOT_FOUND_IN_DB" || payload.code === "USER_NOT_FOUND") {
          logout();
        }
        throw new Error(payload.message || "Unable to submit complaint.");
      }
      setTicketId(payload.data.ticketId);
      setContact("");
      setComplaint("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`w-full ${compact ? "py-2" : "py-4"}`} id="passenger-complaint">
      <div className={`rounded-3xl border-2 border-[#134489]/20 bg-white shadow-lg ${compact ? "p-4" : "p-5"}`}>
        <div className="flex items-start gap-3 border-b border-[#134489]/15 pb-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#134489] text-[#FAC24A]">
            <MessageSquareWarning className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#134489]">Passenger care</p>
            <h3 className={`mt-1 font-black text-[#010105] ${compact ? "text-lg" : "text-xl"}`}>File a station complaint</h3>
            <p className="mt-1 text-xs font-medium text-[#293442]">Your complaint is sent directly to the Complaints Admin queue.</p>
          </div>
        </div>

        {ticketId ? (
          <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 text-sm font-black text-emerald-900">Complaint submitted successfully</p>
            <p className="mt-1 text-xs font-bold text-emerald-700">Ticket: {ticketId}</p>
            <button onClick={() => setTicketId("")} className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white">File another complaint</button>
          </div>
        ) : (
          <form onSubmit={submitComplaint} className={`${compact ? "mt-4 space-y-3" : "mt-5 space-y-4"}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-xs font-black text-[#010105]">Passenger name</span>
                <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" className="h-11 w-full rounded-xl border border-[#134489]/25 px-3.5 text-sm font-semibold outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10" />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-black text-[#010105]">Mobile number</span>
                <input required type="tel" inputMode="numeric" autoComplete="tel" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="+91 98765 43210" className="h-11 w-full rounded-xl border border-[#134489]/25 px-3.5 text-sm font-semibold outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10" />
              </label>
            </div>
            <label className="block space-y-2">
              <span className="text-xs font-black text-[#010105]">Your complaint</span>
              <textarea required minLength={10} maxLength={1000} value={complaint} onChange={(event) => setComplaint(event.target.value)} placeholder="Describe the problem clearly so the station team can assist you…" className={`${compact ? "min-h-20" : "min-h-24"} w-full resize-y rounded-xl border border-[#134489]/25 p-3.5 text-sm font-medium outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10`} />
              <span className="block text-right text-[10px] font-semibold text-[#010105]/45">{complaint.length}/1000</span>
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
            <button disabled={submitting} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#134489] px-5 py-3.5 text-sm font-black text-white shadow-md transition hover:bg-[#0d2f61] disabled:opacity-60">
              <Send className="h-4 w-4 text-[#FAC24A]" /> {submitting ? "Submitting…" : "Submit complaint"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
