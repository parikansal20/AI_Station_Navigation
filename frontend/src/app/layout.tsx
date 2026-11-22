import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SARTHI Station AI | Crowd Intelligence",
  description:
    "AI-powered crowd density analysis for Indian railway stations. Upload an image and get real-time crowd estimates, density levels, and passenger advice.",
};

import { HclTechMark } from "@/components/HclTechMark";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body relative min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
