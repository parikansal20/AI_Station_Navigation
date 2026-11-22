"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

const ALLOWED_ADMIN_ROLES = [
  "admin",
  "subadmin_coolie",
  "subadmin_golfcart",
  "subadmin_emergency",
  "subadmin_complaints",
  "operator",
  "staff",
];

function getSubAdminDeskPath(role: string): string {
  switch (role) {
    case "subadmin_coolie":
      return "/admin/coolieAdmin";
    case "subadmin_golfcart":
      return "/admin/golfCartAdmin";
    case "subadmin_emergency":
      return "/admin/emergencyAdmin";
    case "subadmin_complaints":
      return "/admin/complaintsAdmin";
    case "admin":
      return "/admin/stationAdmin";
    default:
      return "/";
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = usePassengerStore((state) => state.isLoggedIn);
  const userRole = usePassengerStore((state) => state.userRole);
  const authInitialized = usePassengerStore((state) => state.authInitialized);
  const initAuth = usePassengerStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const isAuthorizedRole = ALLOWED_ADMIN_ROLES.includes(userRole);

  // Strict path permission validation
  let isPathPermitted = true;
  if (userRole && userRole !== "admin") {
    // 1. NON-SUPER-ADMINS CANNOT ACCESS MASTER ADMIN OR STATION ADMIN PAGES
    if (
      pathname === "/admin" ||
      pathname === "/admin/" ||
      pathname.includes("/admin/stationAdmin")
    ) {
      isPathPermitted = false;
    }

    // 2. SUB-ADMIN DESK ISOLATION
    if (pathname.includes("/admin/coolieAdmin") && userRole !== "subadmin_coolie") {
      isPathPermitted = false;
    }
    if (pathname.includes("/admin/golfCartAdmin") && userRole !== "subadmin_golfcart") {
      isPathPermitted = false;
    }
    if (pathname.includes("/admin/emergencyAdmin") && userRole !== "subadmin_emergency") {
      isPathPermitted = false;
    }
    if (pathname.includes("/admin/complaintsAdmin") && userRole !== "subadmin_complaints") {
      isPathPermitted = false;
    }
  }

  useEffect(() => {
    if (!authInitialized) return;

    if (!isLoggedIn || userRole === "user" || !isAuthorizedRole || !isPathPermitted) {
      console.warn(`[Security Guard] Access denied for role '${userRole}' to '${pathname}'. Redirecting.`);
      const redirectPath = isAuthorizedRole && userRole !== "user" ? getSubAdminDeskPath(userRole) : "/";
      router.replace(redirectPath);
    }
  }, [authInitialized, isLoggedIn, userRole, isAuthorizedRole, isPathPermitted, pathname, router]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E6E3DB] text-[#134489]">
        <Loader2 className="h-10 w-10 animate-spin text-[#134489]" />
        <p className="mt-4 text-xs font-black uppercase tracking-[0.2em]">Verifying Security Permissions...</p>
      </div>
    );
  }

  if (!isLoggedIn || userRole === "user" || !isAuthorizedRole || !isPathPermitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E6E3DB] p-6 text-center text-[#010105]">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-600 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black">Access Restricted</h1>
        <p className="mt-2 text-sm text-black/60 max-w-md">
          Your account role (<span className="font-extrabold text-[#134489]">{userRole}</span>) is restricted to your designated operational desk and cannot access Master Admin settings. Redirecting...
        </p>
      </div>
    );
  }

  if (userRole === "admin") {
    return (
      <div className="min-h-screen bg-[#E6E3DB]">
        <AdminSidebar />
        <div className="lg:pl-[220px]">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}
