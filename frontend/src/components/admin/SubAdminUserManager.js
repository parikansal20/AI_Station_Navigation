"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Pencil,
  X,
  UsersRound,
  BusFront,
  Siren,
  Headphones,
} from "lucide-react";

const STORAGE_KEY = "saarthi-sub-admin-users";

const defaultAdmins = [
  {
    id: "subadmin-coolie",
    role: "Coolie Assistance Sub-Admin",
    name: "Rajeswari Nair",
    email: "coolie.admin@saarthi.gov.in",
    description: "Luggage porter roster & passenger booking desk",
    icon: UsersRound,
  },
  {
    id: "subadmin-golfcart",
    role: "Golf Cart Service Sub-Admin",
    name: "Alok Kumar Singh",
    email: "golfcart.admin@saarthi.gov.in",
    description: "Accessible battery vehicle fleet & dispatch desk",
    icon: BusFront,
  },
  {
    id: "subadmin-emergency",
    role: "Emergency Response Sub-Admin",
    name: "Dr. Sunita Saxena",
    email: "emergency.admin@saarthi.gov.in",
    description: "24/7 SOS alert dispatch & railway security desk",
    icon: Siren,
  },
  {
    id: "subadmin-complaints",
    role: "Grievance Sub-Admin",
    name: "Vikram Malhotra",
    email: "complaints.admin@saarthi.gov.in",
    description: "Passenger grievances & support ticket resolution",
    icon: Headphones,
  },
];


export function SubAdminUserManager() {
  const [admins, setAdmins] = useState(defaultAdmins);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", email: "" });
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    const loadStoredAdmins = window.setTimeout(() => {
      try {
        const storedAdmins = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(storedAdmins)) {
          setAdmins((current) =>
            current.map((admin) => ({
              ...admin,
              ...(storedAdmins.find((stored) => stored.id === admin.id) || {}),
            })),
          );
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 0);

    return () => window.clearTimeout(loadStoredAdmins);
  }, []);

  function startEditing(admin) {
    setEditingId(admin.id);
    setDraft({ name: admin.name, email: admin.email });
    setSavedId(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft({ name: "", email: "" });
  }

  function saveUser(event, id) {
    event.preventDefault();
    const name = draft.name.trim();
    const email = draft.email.trim().toLowerCase();
    if (!name || !email) return;

    const updatedAdmins = admins.map((admin) =>
      admin.id === id ? { ...admin, name, email } : admin,
    );
    setAdmins(updatedAdmins);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        updatedAdmins.map(({ id: adminId, name: adminName, email: adminEmail }) => ({
          id: adminId,
          name: adminName,
          email: adminEmail,
        })),
      ),
    );
    setEditingId(null);
    setSavedId(id);
    window.setTimeout(() => setSavedId(null), 2500);
  }

  return (
    <section className="admin-rise mt-5 rounded-[24px] border border-black/7 bg-white/55 p-5 shadow-[0_10px_35px_rgba(1,1,5,.045)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#134489]">
            Master admin only
          </p>
          <h2 className="mt-1 text-lg font-extrabold">Sub-admin users</h2>
          <p className="mt-1 text-xs text-black/45">
            Change the user assigned to each independent administration desk.
          </p>
        </div>
        <span className="self-start rounded-full bg-[#EDEBB9] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#134489] sm:self-auto">
          {admins.length} managed accounts
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {admins.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-black/10 p-6 text-center text-sm font-bold text-black/45">
            No sub-admin records available.
          </p>
        )}
        {admins.map((admin) => {
          const Icon = admin.icon;
          const isEditing = editingId === admin.id;

          return (
            <article
              key={admin.id}
              className="rounded-2xl border border-black/8 bg-[#E6E3DB]/65 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#134489] text-[#FAC24A]">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{admin.role}</p>
                  <p className="mt-0.5 text-[10px] text-black/40">{admin.description}</p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(admin)}
                    aria-label={`Change ${admin.role} user`}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#134489]/15 bg-white/60 px-3 text-[11px] font-black text-[#134489] transition hover:border-[#134489]/35 hover:bg-white"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Change user
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={(event) => saveUser(event, admin.id)} className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-black/45">
                      Full name
                    </span>
                    <input
                      autoFocus
                      required
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      className="h-10 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-xs font-bold outline-none focus:border-[#134489]/50 focus:ring-4 focus:ring-[#134489]/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-black/45">
                      Email address
                    </span>
                    <input
                      required
                      type="email"
                      value={draft.email}
                      onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                      className="h-10 w-full rounded-xl border border-black/10 bg-white/80 px-3 text-xs font-bold outline-none focus:border-[#134489]/50 focus:ring-4 focus:ring-[#134489]/10"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#134489] px-4 text-[11px] font-black text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Save user
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="inline-flex h-9 items-center gap-2 rounded-xl border border-black/10 px-4 text-[11px] font-black text-black/55"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 border-t border-black/7 pt-3">
                  <p className="text-sm font-extrabold">{admin.name}</p>
                  <p className="mt-1 truncate text-[11px] text-black/45">{admin.email}</p>
                  {savedId === admin.id && (
                    <p role="status" className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-[#134489]">
                      <Check className="h-3.5 w-3.5" /> Assigned user updated
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
