"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  TrainFront,
  UserRound,
  KeyRound,
  RotateCcw,
} from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";
import { HclTechMark } from "@/components/HclTechMark";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const loginSuccess = usePassengerStore((state) => state.loginSuccess);

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpStep, setOtpStep] = useState<"details" | "otp">("details");
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function getRedirectPath(role: string): string {
    switch (role) {
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
      case "user":
      default:
        return "/";
    }
  }

  // Handle Send OTP
  async function handleSendOtp() {
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) {
      setErrorMessage("Please enter your name, email address, and password first.");
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiBase}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput, email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send OTP code.");
      }

      setOtpStep("otp");
      if (data.data?.otp) {
        setOtpInput(data.data.otp);
      }
      setSuccessMessage(`Verification code sent to ${emailInput}.`);
      setOtpTimer(60);
      const timerInterval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to send verification OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isRegister && otpStep === "details") {
      await handleSendOtp();
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000";

    const endpoint = isRegister
      ? `${apiBase}/api/v1/auth/register-with-otp`
      : `${apiBase}/api/v1/auth/login`;

    const payload = isRegister
      ? { name: nameInput, email: emailInput, password: passwordInput, otp: otpInput }
      : { email: emailInput, password: passwordInput };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (data.errors ? data.errors.join(", ") : "Authentication failed"));
      }

      const { user, tokens } = data.data;
      loginSuccess(user, tokens.accessToken);

      const targetPath = getRedirectPath(user.role);
      setSuccessMessage(`Authenticated as ${user.name} (${user.role}). Redirecting...`);

      setTimeout(() => {
        router.push(targetPath);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to connect to authentication service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#E6E3DB] text-[#010105] selection:bg-[#FAC24A]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#EDEBB9] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-[#134489]/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden bg-[#134489] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FAC24A] text-[#010105] shadow-[0_8px_24px_rgba(1,1,5,.15)]">
              <TrainFront className="h-6 w-6" strokeWidth={2.2} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-[0.18em]">SAARTHI</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-white/45">Passenger assistance</span>
            </span>
          </Link>

          <div className="my-auto max-w-lg py-8">
            <h1 className="text-4xl font-black leading-[1.08] tracking-[-0.04em] xl:text-5xl">
              Your station journey,
              <span className="block text-[#FAC24A]">made effortless.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Access your journeys, preferences, assistance requests, and operational dashboards.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[470px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#134489] text-[#FAC24A]"><TrainFront className="h-5 w-5" /></span>
                <span className="font-black tracking-[0.16em] text-[#134489]">SAARTHI</span>
              </Link>
              <div className="flex items-center gap-2">
                <HclTechMark />
                <Link href="/" className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white/50" aria-label="Back home"><ArrowLeft className="h-4 w-4" /></Link>
              </div>
            </div>

            <div className="auth-rise rounded-[28px] border border-[#134489]/10 bg-white/65 p-6 shadow-[0_24px_60px_rgba(19,68,137,.10)] backdrop-blur sm:p-9">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#134489]">{isRegister ? "Create your account" : "Welcome back"}</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">{isRegister ? "Join SAARTHI" : "Sign in to continue"}</h2>
                <p className="mt-2 text-sm leading-6 text-black/50">
                  {isRegister ? "Set up your passenger profile for a smoother station experience." : "Sign in to access your account."}
                </p>
              </div>

              {errorMessage && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {!isRegister && (
                <div className="mt-5 rounded-2xl border border-[#134489]/20 bg-[#134489]/5 p-3.5 text-xs text-[#010105]">
                  <div className="flex items-center justify-between font-extrabold text-[#134489]">
                    <span>⚡ Quick Demo Login Credentials</span>
                    <span className="rounded-md bg-[#FAC24A] px-2 py-0.5 text-[10px] font-black text-[#010105]">FOR MENTORS</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput("admin@saarthi.gov.in");
                        setPasswordInput("Admin@123");
                      }}
                      className="flex flex-col items-start rounded-xl border border-[#134489]/20 bg-white p-2 text-left shadow-sm transition-all hover:border-[#134489] hover:bg-[#134489]/5"
                    >
                      <span className="font-black text-[#134489]">👑 Master Admin</span>
                      <span className="text-[10px] text-black/50">admin@saarthi.gov.in</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailInput("user@saarthi.gov.in");
                        setPasswordInput("User@123");
                      }}
                      className="flex flex-col items-start rounded-xl border border-black/10 bg-white p-2 text-left shadow-sm transition-all hover:border-[#134489] hover:bg-[#134489]/5"
                    >
                      <span className="font-black text-[#010105]">🚆 Passenger</span>
                      <span className="text-[10px] text-black/50">user@saarthi.gov.in</span>
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {isRegister && otpStep === "otp" ? (
                  <div className="space-y-4 animate-slide-up">
                    <div className="rounded-2xl border-2 border-[#134489] bg-[#134489]/5 p-4 text-center space-y-2">
                      <div className="w-12 h-12 bg-[#134489] text-[#FAC24A] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-black text-[#010105]">Enter 6-Digit Code</h3>
                      <p className="text-xs text-[#010105]/70 font-medium leading-relaxed">
                        We sent a verification code to <strong className="text-[#134489]">{emailInput}</strong>
                      </p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-black text-[#134489] uppercase tracking-wider text-center">
                        6-Digit OTP Code
                      </span>
                      <div className="relative">
                        <input
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          type="text"
                          maxLength={6}
                          required
                          placeholder="••••••"
                          autoFocus
                          className="h-14 w-full rounded-2xl border-2 border-[#134489] bg-white text-center text-2xl font-black tracking-[10px] text-[#010105] outline-none shadow-md focus:ring-4 focus:ring-[#134489]/20"
                        />
                      </div>
                    </label>

                    <button
                      disabled={submitting || otpInput.length < 6}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#134489] text-sm font-black text-white shadow-[0_10px_24px_rgba(19,68,137,.2)] transition hover:-translate-y-0.5 hover:bg-[#0d376f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Verifying OTP..." : "Verify & Complete Registration"}
                      {!submitting && <ArrowRight className="h-4 w-4 text-[#FAC24A]" />}
                    </button>

                    <div className="flex items-center justify-between text-xs font-bold pt-2">
                      <button
                        type="button"
                        onClick={() => setOtpStep("details")}
                        className="text-[#010105]/60 hover:text-[#134489] underline"
                      >
                        Edit Registration Info
                      </button>

                      <button
                        type="button"
                        disabled={otpTimer > 0 || submitting}
                        onClick={handleSendOtp}
                        className="text-[#134489] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{otpTimer > 0 ? `Resend code in ${otpTimer}s` : "Resend OTP"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {isRegister && (
                      <label className="block">
                        <span className="mb-2 block text-xs font-extrabold">Full name</span>
                        <span className="relative block">
                          <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#134489]" />
                          <input
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            autoComplete="name"
                            required
                            placeholder="Enter your full name"
                            className="h-12 w-full rounded-xl border border-black/10 bg-[#E6E3DB]/55 pl-11 pr-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#134489]/50 focus:bg-white focus:ring-4 focus:ring-[#134489]/10"
                          />
                        </span>
                      </label>
                    )}

                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold">Email address</span>
                      <span className="relative block">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#134489]" />
                        <input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          type="email"
                          autoComplete="email"
                          required
                          placeholder="you@example.com"
                          className="h-12 w-full rounded-xl border border-black/10 bg-[#E6E3DB]/55 pl-11 pr-4 text-sm outline-none transition placeholder:text-black/35 focus:border-[#134489]/50 focus:bg-white focus:ring-4 focus:ring-[#134489]/10"
                        />
                      </span>
                    </label>

                    <label className="block">
                      <span className="mb-2 flex items-center justify-between text-xs font-extrabold">
                        Password
                        {!isRegister && <button type="button" className="font-bold text-[#134489] hover:underline">Forgot password?</button>}
                      </span>
                      <span className="relative block">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#134489]" />
                        <input
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          autoComplete={isRegister ? "new-password" : "current-password"}
                          required
                          minLength={6}
                          placeholder="Minimum 6 characters"
                          className="h-12 w-full rounded-xl border border-black/10 bg-[#E6E3DB]/55 pl-11 pr-12 text-sm outline-none transition placeholder:text-black/35 focus:border-[#134489]/50 focus:bg-[#134489]/5 focus:ring-4 focus:ring-[#134489]/10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 transition hover:text-[#134489]"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </span>
                    </label>

                    <button
                      disabled={submitting}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#134489] text-sm font-black text-white shadow-[0_10px_24px_rgba(19,68,137,.2)] transition hover:-translate-y-0.5 hover:bg-[#0d376f] disabled:cursor-wait disabled:opacity-70"
                    >
                      {submitting ? "Sending OTP..." : isRegister ? "Send 6-Digit OTP Email" : "Sign in"}
                      {!submitting && <ArrowRight className="h-4 w-4 text-[#FAC24A]" />}
                    </button>
                  </>
                )}
              </form>

              <p className="mt-6 text-center text-sm text-black/50">
                {isRegister ? "Already have an account?" : "New to SAARTHI?"}{" "}
                <Link href={isRegister ? "/auth/login" : "/auth/register"} className="font-black text-[#134489] hover:underline">
                  {isRegister ? "Sign in" : "Create an account"}
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
