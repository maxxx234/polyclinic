import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { api, apiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../api/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Record<string, string> = {
  guest: "Hi! I'm **Poly** 👋 your Polyclinic assistant. Ask me about our doctors, specialities, timings or how to book an appointment.",
  patient: "Hi! I'm **Poly** 👋 I can help you book or cancel appointments, understand your bills, prescriptions and more.",
  doctor: "Hello Doctor! I'm **Poly** 👋 I can help with managing appointments, slots, prescriptions and notices.",
  admin: "Hello! I'm **Poly** 👋 I can help you manage doctors, appointments, announcements and the dashboard.",
};

const QUICK: Record<string, string[]> = {
  guest: ["What specialities do you offer?", "How do I book an appointment?", "What are your timings?", "Where are you located?"],
  patient: ["How do I book an appointment?", "When do I pay my bill?", "How do I cancel?", "Where are my prescriptions?"],
  doctor: ["How do I add an availability slot?", "How do I write a prescription?", "How do I confirm an appointment?"],
  admin: ["How do I add a doctor?", "How do I post an announcement?", "What's on the dashboard?"],
};

// Minimal + safe markdown: escape HTML, then **bold** and line breaks.
function formatHtml(text: string): string {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

export function ChatBot() {
  const { user } = useAuth();
  const role: Role | "guest" = user?.role ?? "guest";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      // send only the recent turns
      const res = await api.post<{ reply: string }>("/ai/chat", {
        messages: next.slice(-12),
      });
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: apiError(err) }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/40 transition hover:scale-105"
        aria-label="Chat with Poly"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px]">
            <Sparkles size={12} className="text-white" />
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ animation: "var(--animate-scale-in)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-brand-600 to-brand-700 px-4 py-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
              <Bot size={22} />
            </span>
            <div className="flex-1">
              <p className="font-bold leading-tight">Poly Assistant</p>
              <p className="flex items-center gap-1 text-xs text-brand-50/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Online · AI powered
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {/* Greeting */}
            <Bubble role="assistant" html={formatHtml(GREETING[role])} />

            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-center text-xs text-slate-400">Try asking…</p>
                {QUICK[role].map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} html={formatHtml(m.content)} />
            ))}

            {busy && (
              <div className="flex items-center gap-1.5 px-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-brand-400" />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 p-3"
          >
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              disabled={busy}
            />
            <button type="submit" className="btn-primary shrink-0 px-3" disabled={busy || !input.trim()}>
              <Send size={17} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ role, html }: { role: "user" | "assistant"; html: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
        }`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
