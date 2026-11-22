import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create Account | SAARTHI AI",
  description: "Create your SAARTHI passenger profile for personalized station assistance.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}

