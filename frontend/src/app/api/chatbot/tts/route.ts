import { NextRequest, NextResponse } from "next/server";

const CHATBOT_BASE = process.env.CHATBOT_API_URL || process.env.NEXT_PUBLIC_ML_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = CHATBOT_BASE.endsWith("/api/v1/chatbot")
      ? `${CHATBOT_BASE}/tts`
      : CHATBOT_BASE.endsWith("/api/v1")
        ? `${CHATBOT_BASE}/chatbot/tts`
        : `${CHATBOT_BASE}/tts`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[Chatbot /tts proxy] Non-JSON response received:", text.slice(0, 300));
      return NextResponse.json({ error: "Invalid response from TTS service", details: text.slice(0, 300) }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Chatbot /tts proxy]", err);
    return NextResponse.json({ error: "TTS service unavailable" }, { status: 503 });
  }
}
