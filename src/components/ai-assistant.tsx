import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Bot, User as UserIcon, ShieldAlert } from "lucide-react";
import { api } from "../lib/api";

type Message = { role: "user" | "assistant"; content: string; in_scope?: boolean };

const SUGGESTIONS = [
  "Cuántos devices están NO_EDR?",
  "Cuál es el risk score actual?",
  "Cuántos devices hay en MEXICO?",
  "Qué significa IDP_ONLY?",
];

const GREETING: Message = {
  role: "assistant",
  content:
    "Hola, soy el asistente de Device Normalizer. Solo puedo ayudarte con preguntas sobre el inventario de devices, sources (CrowdStrike / JumpCloud / Okta), statuses, métricas y compliance. Probá una de las preguntas sugeridas o escribime algo.",
};

interface AIAssistantProps {
  open: boolean;
  onClose: () => void;
}

export function AIAssistant({ open, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setSending(true);
    try {
      const apiMessages = next
        .filter((m) => !(m === GREETING))
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await api.aiChat(apiMessages);
      setMessages([...next, { role: "assistant", content: res.reply, in_scope: res.in_scope }]);
    } catch (e) {
      // fetchJson throws on non-2xx — surface a useful hint.
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("429")) {
        setError("Llegaste al límite de mensajes por hora. Probá en un rato.");
      } else if (msg.includes("503")) {
        setError("El asistente no está configurado (falta OPENAI_API_KEY en el server).");
      } else if (msg.includes("502")) {
        setError("No pude alcanzar el proveedor del modelo. Probá en un minuto.");
      } else {
        setError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-label="Device Normalizer assistant"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-[60] flex h-screen w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-accent/10 p-1.5">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
                  <p className="text-[10px] text-muted">scoped to Device Normalizer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-card transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Conversation */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Bot className="h-3.5 w-3.5 animate-pulse" />
                  <span className="animate-pulse">Pensando…</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Suggestions — only show until the user has sent something */}
            {messages.length === 1 && (
              <div className="shrink-0 border-t border-border px-4 py-3">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted">Sugerencias</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      disabled={sending}
                      className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] hover:bg-card/70 disabled:opacity-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              className="flex shrink-0 items-end gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Preguntá sobre el inventario…"
                rows={2}
                disabled={sending}
                className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Send"
                className="rounded-lg bg-accent px-3 py-2 text-accent-foreground hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-card border border-border">
        {isUser ? (
          <UserIcon className="h-3 w-3 text-muted" />
        ) : (
          <Bot className="h-3 w-3 text-accent" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-accent/10 text-foreground"
            : m.in_scope === false
              ? "bg-amber-500/5 border border-amber-500/20 text-amber-200"
              : "bg-card text-foreground"
        }`}
      >
        {m.content}
      </div>
    </motion.div>
  );
}
