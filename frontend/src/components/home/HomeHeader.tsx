"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  MapPin,
  Menu,
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  User,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Clock,
} from "lucide-react";
import { STATION_INFO } from "@/lib/mock-data/home";
import { usePassengerStore } from "@/store/usePassengerStore";
import { StationNotifications } from "@/components/home/StationNotifications";
import { ToastNotification } from "@/components/home/ToastNotification";
import { HclTechMark } from "@/components/HclTechMark";

export function HomeHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    activeModal,
    setActiveModal,
    isLoggedIn,
    userName,
    userEmail,
    userRole,
    updateProfile,
    logout,
    initAuth,
  } = usePassengerStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const openProfileSettings = () => {
    setProfileName(userName);
    setProfileEmail(userEmail);
    setProfileMessage("");
    setProfileError("");
    setActiveModal("profile");
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    if (profileName.trim().length < 2) {
      setProfileError("Name must be at least 2 characters long.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim())) {
      setProfileError("Enter a valid email address.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfile(profileName, profileEmail);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdminRole = isLoggedIn && ["admin", "stationadmin", "operator"].includes(userRole);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Station Map", href: "/station-map" },
    { label: "Accessibility", href: "/#accessibility" },
    { label: "Services", href: "/#passenger-services" },
  ];

  const getAdminPath = () => {
    switch (userRole) {
      case "admin":
        return "/admin/stationAdmin";
      case "subadmin_coolie":
        return "/admin/coolieAdmin";
      case "subadmin_golfcart":
        return "/admin/golfCartAdmin";
      case "subadmin_emergency":
        return "/admin/emergencyAdmin";
      case "subadmin_complaints":
        return "/admin/complaintsAdmin";
      case "operator":
      case "staff":
        return "/admin/stationAdmin";
      default:
        return null;
    }
  };

  const adminPath = getAdminPath();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#E6E3DB]/90 border-b border-[#134489]/15 shadow-xs transition-all duration-300">
      <ToastNotification />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Left: SAARTHI Identity */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none rounded-xl"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#134489] flex items-center justify-center shadow-sm shadow-[#134489]/30 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-[#FAC24A]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-black tracking-wider text-[#134489] flex items-center gap-1.5 leading-none">
                  SAARTHI
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FAC24A]" />
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-[#010105]/60 hidden sm:inline-block mt-0.5">
                  Station Digital Twin
                </span>
              </div>
            </Link>

            {/* Station Chip */}
            <div className="hidden lg:flex items-center gap-1.5 bg-white/60 border border-[#134489]/15 px-3 py-1 rounded-xl text-xs shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-[#134489]" />
              <span className="font-extrabold text-[#134489] text-[11px]">
                {STATION_INFO.code} &bull; {STATION_INFO.name}
              </span>
            </div>
          </div>

          {/* Center: Navigation Links with subtle underline */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all duration-200 relative ${
                    isActive
                      ? "text-[#134489]"
                      : "text-[#010105]/75 hover:text-[#134489] hover:bg-white/40"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#134489] rounded-full" />
                  )}
                </Link>
              );
            })}
            {adminPath && (
              <Link
                href={adminPath}
                className="ml-2 px-3 py-1 rounded-lg text-xs font-black bg-[#FAC24A]/30 text-[#134489] hover:bg-[#FAC24A]/60 transition-all flex items-center gap-1 border border-[#134489]/20"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#134489]" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right: User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            <StationNotifications />
            {isLoggedIn ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#134489]/20 bg-white/80 text-xs font-bold text-[#010105] hover:border-[#134489] shadow-2xs transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-[#134489] text-[#FAC24A] flex items-center justify-center font-black text-xs">
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="font-extrabold text-[#134489]">{userName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#134489] transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#134489]/20 rounded-2xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-black text-[#134489] truncate">{userName}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase">{userRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        openProfileSettings();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[#010105] hover:bg-[#EDEBB9]/40 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5 text-[#134489]" />
                      Profile Settings
                    </button>
                    <Link
                      href="/track-requests"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-[#010105] hover:bg-[#EDEBB9]/40 flex items-center gap-2"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#134489]" />
                      Track Requests
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-1.5 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] text-xs font-black flex items-center gap-1.5 shadow-xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-[#FAC24A]" />
                <span>Login</span>
              </Link>
            )}
            <HclTechMark />
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <HclTechMark />
            <StationNotifications />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#134489]/20 text-[#134489] bg-white"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#134489]/15 space-y-2 bg-[#E6E3DB]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-extrabold text-[#010105] hover:bg-white/60"
              >
                {link.label}
              </Link>
            ))}

            {adminPath && (
              <Link
                href={adminPath}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-xs font-black bg-[#FAC24A] text-[#010105]"
              >
                Admin Dashboard ({userRole})
              </Link>
            )}

            <div className="pt-2 border-t border-[#134489]/15 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      openProfileSettings();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 px-3 bg-white text-[#134489] border border-[#134489]/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 px-3 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout ({userName})
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2 px-3 rounded-xl bg-[#134489] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <LogIn className="w-4 h-4 text-[#FAC24A]" />
                  Login to Account
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {activeModal === "profile" && isLoggedIn && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010105]/65 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setActiveModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-settings-title"
            className="w-full max-w-md rounded-[28px] border border-[#134489]/20 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#134489]/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#134489] text-lg font-black text-[#FAC24A]">
                  {userName ? userName.charAt(0).toUpperCase() : "U"}
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#134489]">Account</p>
                  <h2 id="profile-settings-title" className="mt-1 text-xl font-black text-[#010105]">Profile settings</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-[#134489]/5 text-[#010105]/50 hover:bg-[#134489]/10 hover:text-[#010105]"
                aria-label="Close profile settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={saveProfile}>
              <label className="block space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#010105]">
                  <User className="h-3.5 w-3.5 text-[#134489]" /> Display name
                </span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-[#134489]/20 px-3.5 text-sm font-bold text-[#010105] outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10"
                />
              </label>

              <label className="block space-y-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-[#010105]">
                  <Mail className="h-3.5 w-3.5 text-[#134489]" /> Email address
                </span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border-2 border-[#134489]/20 bg-white px-3.5 text-sm font-semibold text-[#010105] outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10"
                />
                <p className="text-[10px] font-medium text-[#010105]/40">This email will be used the next time you sign in.</p>
              </label>

              <div className="rounded-xl border border-[#134489]/10 bg-[#EDEBB9]/35 px-3.5 py-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#134489]">Account role</p>
                <p className="mt-1 text-xs font-bold capitalize text-[#010105]">{userRole.replaceAll("_", " ")}</p>
              </div>

              {profileError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {profileError}
                </p>
              )}
              {profileMessage && (
                <p className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {profileMessage}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="flex-1 rounded-xl border-2 border-[#134489]/15 px-4 py-3 text-xs font-black text-[#134489]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    profileSaving ||
                    (profileName.trim() === userName && profileEmail.trim().toLowerCase() === userEmail.toLowerCase())
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#134489] px-4 py-3 text-xs font-black text-white transition hover:bg-[#0d2f61] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {profileSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
