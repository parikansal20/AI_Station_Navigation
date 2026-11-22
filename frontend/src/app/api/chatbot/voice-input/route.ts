import { NextRequest, NextResponse } from "next/server";

const CHATBOT_BASE = process.env.CHATBOT_API_URL || process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const targetUrl = CHATBOT_BASE.endsWith("/api/v1/chatbot")
      ? `${CHATBOT_BASE}/voice-input`
      : CHATBOT_BASE.endsWith("/api/v1")
        ? `${CHATBOT_BASE}/chatbot/voice-input`
        : `${CHATBOT_BASE}/voice-input`;

    const res = await fetch(targetUrl, {
      method: "POST",
      body: formData,
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[Chatbot /voice-input proxy] Non-JSON response received:", text.slice(0, 300));
      return NextResponse.json({ error: "Invalid response from STT service", details: text.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Chatbot /voice-input proxy]", err);
    return NextResponse.json({ error: "STT service unavailable" }, { status: 503 });
  }
}
