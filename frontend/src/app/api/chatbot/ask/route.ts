import { NextRequest, NextResponse } from "next/server";

const CHATBOT_BASE =
  process.env.CHATBOT_API_URL ||
  process.env.NEXT_PUBLIC_ML_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanBase = CHATBOT_BASE.replace(/\/+$/, "");
    const targetUrl = cleanBase.endsWith("/api/v1/chatbot")
      ? `${cleanBase}/ask`
      : cleanBase.endsWith("/api/v1")
        ? `${cleanBase}/chatbot/ask`
        : `${cleanBase}/api/v1/chatbot/ask`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("[Chatbot /ask proxy] Non-JSON response received:", text.slice(0, 300));
      return NextResponse.json(
        {
          error: `Chatbot service returned an invalid response (${res.status}).`,
          details: text.slice(0, 300),
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Chatbot /ask proxy]", err);
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Chatbot service timed out while loading. Please try again."
        : `Cannot reach the chatbot service at ${CHATBOT_BASE}. Make sure the ML service is running.`;
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
