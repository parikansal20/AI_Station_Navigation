"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ChevronDown,
  BookOpen,
  Square,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  sources?: string[];
  sourceType?: string;
  timestamp: string;
  isLoading?: boolean;
}

const SUGGESTIONS = [
  "Platform 1 kaise jaayen?",
  "Disabled person facilities kya hain?",
  "Ticket cancellation rules?",
  "Emergency helpline number?",
];

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Namaste! 🙏 Main SAARTHI AI hoon. Mujhe Lucknow Junction ke baare mein kuch bhi poochein — platforms, facilities, navigation, IRCTC rules, ya emergency services.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setPlayingMessageId(null);
  }, []);

  const togglePlayAudio = useCallback(
    async (msgId: string, text: string) => {
      if (playingMessageId === msgId) {
        stopCurrentAudio();
        return;
      }

      stopCurrentAudio();

      try {
        setPlayingMessageId(msgId);
        const res = await fetch("/api/chatbot/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language: "hi-IN" }),
        });
        if (!res.ok) {
          setPlayingMessageId(null);
          return;
        }
        const { audio } = await res.json();
        if (!audio) {
          setPlayingMessageId(null);
          return;
        }
        const bytes = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const audioEl = new Audio(url);
        currentAudioRef.current = audioEl;

        audioEl.play();
        audioEl.onended = () => {
          URL.revokeObjectURL(url);
          if (currentAudioRef.current === audioEl) {
            currentAudioRef.current = null;
            setPlayingMessageId(null);
          }
        };
        audioEl.onerror = () => {
          URL.revokeObjectURL(url);
          setPlayingMessageId(null);
        };
      } catch {
        setPlayingMessageId(null);
      }
    },
    [playingMessageId, stopCurrentAudio]
  );

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim() || isTyping) return;
      stopCurrentAudio();

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: query.trim(),
        timestamp: new Date().toISOString(),
      };
      const loadingMsg: Message = {
        id: "loading",
        role: "bot",
        text: "",
        timestamp: new Date().toISOString(),
        isLoading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/chatbot/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });

        let data: any = null;
        try {
          data = await res.json();
        } catch {}

        if (res.ok && data && (data.answer || data.detail || data.error)) {
          const botText = data.answer || data.detail || data.error;
          const botMsgId = (Date.now() + 1).toString();
          const botMsg: Message = {
            id: botMsgId,
            role: "bot",
            text: botText,
            sources: Array.isArray(data.sources) ? data.sources : [],
            sourceType: data.source_type,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(botMsg));
          if (!isOpen) setHasNewMessage(true);
          if (!isMuted) togglePlayAudio(botMsgId, botText);
          return;
        }

        const finalBotText =
          data?.detail ||
          data?.error ||
          "Chatbot service is unavailable. Make sure the local ML service is running.";
        const botMsgId = (Date.now() + 1).toString();
        const botMsg: Message = {
          id: botMsgId,
          role: "bot",
          text: finalBotText,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(botMsg));
        if (!isOpen) setHasNewMessage(true);
        if (!isMuted) togglePlayAudio(botMsgId, finalBotText);

      } catch (err: any) {
        const errMsgText = err?.message || "Service response error. Please try again.";
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          text: errMsgText,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => prev.filter((m) => m.id !== "loading").concat(errMsg));
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, isOpen, isMuted, stopCurrentAudio, togglePlayAudio]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", blob, "voice.wav");
        try {
          const res = await fetch("/api/chatbot/voice-input", { method: "POST", body: formData });
          const { transcript } = await res.json();
          if (transcript) sendMessage(transcript);
        } catch {
          // silently fail
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const cleanSourceName = (src: string) =>
    src.replace(/\.(txt|md)$/i, "").replace(/_/g, " ").trim();

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="animate-bounce-slow bg-white text-[#134489] text-xs font-black px-3.5 py-1.5 rounded-full shadow-xl border-2 border-[#134489]/20 flex items-center gap-1.5 select-none">
            <Sparkles className="w-3.5 h-3.5 text-[#FAC24A] fill-[#FAC24A]" />
            <span>Ask SAARTHI AI</span>
            <ChevronDown className="w-3 h-3 text-[#134489]" />
          </div>
        )}
        <button
          id="chatbot-fab"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Open SAARTHI AI Chatbot"
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl border-2 transition-all duration-300 ${
            isOpen
              ? "bg-[#134489] border-[#010105] rotate-90 scale-95"
              : "bg-[#134489] border-[#FAC24A] hover:scale-110 active:scale-95"
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-[#FAC24A]" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-[#FAC24A]" />
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </>
          )}
        </button>
      </div>

      {/* ── Main Chat Panel ── */}
      <div
        className={`fixed bottom-24 right-4 sm:right-5 z-50 w-[calc(100vw-2rem)] sm:w-[680px] max-w-[calc(100vw-2.5rem)] bg-white rounded-3xl shadow-2xl border-2 border-[#134489]/20 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-75 pointer-events-none"
        }`}
        style={{ maxHeight: "560px" }}
        id="chatbot-panel"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#134489] via-[#0f3770] to-[#134489] px-4 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAC24A] border border-[#010105]/20 flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6 text-[#134489]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white font-black text-sm tracking-tight leading-tight">SAARTHI AI</p>
                <span className="bg-[#FAC24A] text-[#010105] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  RAG
                </span>
              </div>
              <p className="text-white/70 text-[10px] font-bold">Lucknow Junction Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted((m) => !m)}
              className={`p-2 rounded-xl transition ${
                isMuted
                  ? "bg-white/10 text-white/50 hover:text-white"
                  : "bg-[#FAC24A] text-[#010105] font-black"
              }`}
              title={isMuted ? "Auto-voice muted (Click to enable)" : "Auto-voice active (Click to mute)"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                stopCurrentAudio();
                setIsOpen(false);
              }}
              className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition"
              title="Close chat window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3.5 bg-[#F8F8F6]" style={{ minHeight: 0 }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border ${
                  msg.role === "user"
                    ? "bg-[#134489] border-[#010105]/20 text-white"
                    : "bg-[#FAC24A] border-[#010105]/20 text-[#134489]"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-[#134489]" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-3.5 shadow-sm transition-all ${
                  msg.role === "user"
                    ? "max-w-[82%] bg-[#134489] text-white rounded-tr-xs"
                    : "min-w-0 flex-1 bg-white text-[#010105] border border-[#134489]/15 rounded-tl-xs"
                }`}
              >
                {msg.isLoading ? (
                  <div className="flex items-center gap-2 py-1 px-2">
                    <span className="text-xs font-bold text-[#134489]">Searching Knowledge Base</span>
                    <span className="w-2 h-2 bg-[#134489] rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-[#134489] rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-[#134489] rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                ) : (
                  <>
                    <div
                      className={
                        msg.role === "bot" && msg.sources && msg.sources.length > 0
                          ? "min-w-0"
                          : ""
                      }
                    >
                      <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>

                      {/* Citations sit beside the answer on wider screens. */}
                      {msg.role === "bot" && msg.sources && msg.sources.length > 0 && (
                        <aside
                          className="mt-3 w-full min-w-0 rounded-xl border border-[#134489]/12 bg-[#F6F8FC] p-2.5"
                          aria-label="Sources and citations"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[#134489]">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              <span>Sources</span>
                            </div>
                            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#134489] px-1 text-[8px] font-black text-white">
                              {msg.sources.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {msg.sources.map((src, idx) => (
                              <span
                                key={idx}
                                title={cleanSourceName(src)}
                                className="group inline-flex max-w-[210px] min-w-0 items-center gap-1.5 rounded-lg border border-[#134489]/12 bg-white px-1.5 py-1 text-[#134489] transition-colors hover:border-[#134489]/30 hover:bg-[#134489]/5"
                              >
                                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#134489]/8 text-[8px] font-black text-[#134489] group-hover:bg-[#134489] group-hover:text-white">
                                  {idx + 1}
                                </span>
                                <span className="truncate text-[10px] font-semibold leading-tight">
                                  {cleanSourceName(src)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </aside>
                      )}
                    </div>

                    {/* Message Footer: Timestamp + Per-Message Audio Listen Button */}
                    <div
                      className={`flex items-center justify-between gap-2 mt-2 pt-1.5 border-t ${
                        msg.role === "user" ? "border-white/10" : "border-[#134489]/10"
                      }`}
                    >
                      <span
                        className={`text-[9px] font-bold ${
                          msg.role === "user" ? "text-white/60" : "text-[#010105]/45"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </span>

                      {msg.role === "bot" && (
                        <button
                          type="button"
                          onClick={() => togglePlayAudio(msg.id, msg.text)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black transition-all shadow-2xs border ${
                            playingMessageId === msg.id
                              ? "bg-[#FAC24A] text-[#010105] border-[#010105] animate-pulse"
                              : "bg-[#134489]/10 text-[#134489] border-[#134489]/20 hover:bg-[#134489] hover:text-white"
                          }`}
                          title={playingMessageId === msg.id ? "Stop audio" : "Listen to answer audio"}
                        >
                          {playingMessageId === msg.id ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length <= 1 && (
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto bg-[#F8F8F6] shrink-0 scrollbar-hide border-t border-[#134489]/10">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border border-[#134489]/25 bg-white text-[#134489] hover:bg-[#134489] hover:text-white transition-all shadow-2xs whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="border-t-2 border-[#134489]/15 px-3 py-3 flex items-center gap-2 bg-white shrink-0 shadow-lg"
        >
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2.5 rounded-xl border-2 transition-all ${
              isRecording
                ? "bg-red-600 border-red-700 text-white animate-pulse shadow-md"
                : "border-[#134489]/20 text-[#134489] hover:bg-[#134489]/10"
            }`}
            title="Hold to record voice query"
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Station ke baare mein poochein..."
            disabled={isTyping}
            className="flex-1 text-xs font-semibold bg-[#F8F8F6] border-2 border-[#134489]/20 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#134489] focus:ring-4 focus:ring-[#134489]/10 transition placeholder-[#010105]/45 text-[#010105] disabled:opacity-50"
            id="chatbot-input"
          />

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 rounded-xl bg-[#134489] text-[#FAC24A] hover:bg-[#0f3770] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#FAC24A]" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
