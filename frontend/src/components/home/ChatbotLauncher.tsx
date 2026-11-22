"use client";

import dynamic from "next/dynamic";

const ChatbotWidget = dynamic(
  () => import("./ChatbotWidget").then((m) => m.ChatbotWidget),
  { ssr: false, loading: () => null }
);

export function ChatbotLauncher() {
  return <ChatbotWidget />;
}
