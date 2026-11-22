"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BusFront,
  Headphones,
  Home,
  LayoutDashboard,
  LogOut,
  Siren,
  UsersRound,
} from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";
import { HclTechMark } from "@/components/HclTechMark";

const adminPages = [
  {
    label: "Overview",
    description: "Station control",
    href: "/admin/stationAdmin",
    icon: LayoutDashboard,
  },
  {
    label: "Coolie desk",
    description: "Porter requests",
    href: "/admin/coolieAdmin",
    icon: UsersRound,
  },
  {
    label: "Golf cart",
    description: "Fleet dispatch",
    href: "/admin/golfCartAdmin",
    icon: BusFront,
  },
  {
    label: "Emergency",
    description: "SOS response",
    href: "/admin/emergencyAdmin",
    icon: Siren,
  },
  {
    label: "Complaints",
    description: "Passenger support",
    href: "/admin/complaintsAdmin",
    icon: Headphones,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = usePassengerStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-slate-200 bg-[#F8FAFC] px-3 py-4 text-slate-950 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FAC24A] text-slate-950">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black tracking-[.08em] text-slate-950">SARTHI</p>
            <p className="truncate text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">
              Station admin
            </p>
          </div>
        </div>

        <p className="mb-2 mt-7 px-3 text-[9px] font-black uppercase tracking-[.2em] text-slate-400">
          Workspaces
        </p>
        <nav className="space-y-1" aria-label="Station admin workspaces">
          {adminPages.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                  active
                    ? "border border-blue-100 bg-white text-slate-950 shadow-sm"
                    : "border border-transparent text-slate-600 hover:bg-blue-50 hover:text-slate-950"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#134489]" : "text-slate-400 group-hover:text-[#134489]"}`} />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black">{item.label}</span>
                  <span className="block truncate text-[9px] font-semibold text-slate-400">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-200 pt-3">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-blue-50 hover:text-[#134489]">
            <Home className="h-4 w-4" />
            Passenger home
          </Link>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-slate-200 bg-[#F8FAFC] px-3 py-3 shadow-sm lg:hidden">
        <div className="mb-3 flex items-center justify-between px-1">
          <p className="text-xs font-black tracking-[.1em] text-slate-950">SARTHI <span className="text-slate-400">ADMIN</span></p>
          <div className="flex items-center gap-2">
            <HclTechMark />
            <Link href="/" aria-label="Passenger home" className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#134489]">
              <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Station admin workspaces">
          {adminPages.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-black ${
                  active ? "bg-[#134489] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
