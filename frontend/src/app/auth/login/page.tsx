import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Sign In | SAARTHI AI",
  description: "Sign in to access your SAARTHI passenger profile and assistance services.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}

