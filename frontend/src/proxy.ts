import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const tokenCookie = request.cookies.get("saarthi_token");
    const roleCookie = request.cookies.get("saarthi_role");

    const token = tokenCookie?.value;
    const role = roleCookie?.value;

    // 1. Unauthenticated or invalid role check
    if (!token || !role || !ALLOWED_ADMIN_ROLES.includes(role)) {
      console.warn(`[Next.js Server Middleware] Intercepted unauthorized access to '${pathname}'. Redirecting to '/'`);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // 2. Strict Role-Based Access Rules for Sub-Admins
    if (role !== "admin") {
      // NON-SUPER-ADMINS ARE STRICTLY PROHIBITED FROM MASTER ADMIN & STATION ADMIN PAGES
      if (
        pathname === "/admin" ||
        pathname === "/admin/" ||
        pathname.includes("/admin/stationAdmin")
      ) {
        console.warn(`[Next.js Server Middleware] Blocked non-super admin (${role}) from Master Admin page. Redirecting to their desk.`);
        const url = request.nextUrl.clone();
        url.pathname = getSubAdminDeskPath(role);
        return NextResponse.redirect(url);
      }

      // STRICT DESK ISOLATION: Sub-admins can ONLY access their designated desk
      if (pathname.includes("/admin/coolieAdmin") && role !== "subadmin_coolie") {
        const url = request.nextUrl.clone();
        url.pathname = getSubAdminDeskPath(role);
        return NextResponse.redirect(url);
      }
      if (pathname.includes("/admin/golfCartAdmin") && role !== "subadmin_golfcart") {
        const url = request.nextUrl.clone();
        url.pathname = getSubAdminDeskPath(role);
        return NextResponse.redirect(url);
      }
      if (pathname.includes("/admin/emergencyAdmin") && role !== "subadmin_emergency") {
        const url = request.nextUrl.clone();
        url.pathname = getSubAdminDeskPath(role);
        return NextResponse.redirect(url);
      }
      if (pathname.includes("/admin/complaintsAdmin") && role !== "subadmin_complaints") {
        const url = request.nextUrl.clone();
        url.pathname = getSubAdminDeskPath(role);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
