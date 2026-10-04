import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "How does booking a property work here?",
  "What should I check in a rental agreement?",
  "Tips to list my property as an owner",
  "How is EMI on a home loan calculated?",
];

const WELCOME = {
  role: "assistant",
  content:
    "Hi! I'm the HouseRent assistant. Ask me about renting, buying or listing property, or how this platform works. I only answer real-estate questions.",
};

// **bold** inside a line -> <strong>
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="text-white font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Tiny, safe formatter: paragraphs + "-" / "*" bullets. No HTML injection.
function FormattedText({ text }) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const m = line.match(/^\s*[-*•]\s+(.*)$/);
        return m ? (
          <div key={i} className="flex gap-2">
            <span className="text-accent-400 mt-0.5">•</span>
            <span>
              <Inline text={m[1]} />
            </span>
          </div>
        ) : (
          <p key={i}>
            <Inline text={line} />
          </p>
        );
      })}
    </div>
  );
}

export default function AssistantWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      // The welcome message isn't part of the real conversation
      const history = next.filter((m) => m !== WELCOME).map(({ role, content }) => ({ role, content }));
      const res = await api.post("/assistant", { messages: history });
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply, listings: res.data.listings }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          error: true,
          content: err.response?.data?.message || "I couldn't reach the assistant. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 pl-4 pr-5 h-14 rounded-full bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold shadow-glow animate-ring-pulse hover:scale-105 transition-transform"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.2A8 8 0 1121 12z" />
            <path d="M9 11h.01M12 11h.01M15 11h.01" />
          </svg>
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="HouseRent AI assistant"
          className="fixed z-50 bottom-4 right-4 left-4 sm:left-auto sm:w-[390px] h-[min(600px,calc(100vh-2rem))] flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-base-900/95 backdrop-blur-xl shadow-2xl animate-pop-in"
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-accent-600/30 to-transparent border-b border-white/10">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-base-950 font-black">
              AI
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold leading-tight">HouseRent Assistant</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Real-estate help only
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] ${m.role === "user" ? "" : "w-full"}`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-accent-500 text-base-950 font-medium rounded-br-md"
                        : m.error
                        ? "bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-bl-md"
                        : "bg-base-800 text-slate-200 border border-white/5 rounded-bl-md"
                    }`}
                  >
                    {m.role === "user" ? m.content : <FormattedText text={m.content} />}
                  </div>

                  {m.listings?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.listings.map((p) => (
                        <Link
                          key={p.id}
                          to={`/properties/${p.id}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-xl border border-white/10 bg-base-800/70 hover:border-accent-500/50 p-3 transition-colors"
                        >
                          <p className="text-white font-medium line-clamp-1">{p.address}</p>
                          <p className="text-xs text-slate-400 capitalize">
                            {p.propertyType} · {p.adType === "sale" ? "For sale" : "For rent"}
                            {p.location ? ` · ${p.location}` : ""}
                          </p>
                          <p className="text-emerald-400 font-semibold mt-1">
                            ₹{Number(p.amount).toLocaleString("en-IN")}
                            {p.adType === "rent" && <span className="text-slate-400 text-xs">/mo</span>}
                            <span className="float-right text-accent-400 text-xs font-medium">View →</span>
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex">
                <div className="bg-base-800 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-2 h-2 rounded-full bg-accent-400 animate-blink"
                      style={{ animationDelay: `${d * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {showSuggestions && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs text-left px-3 py-1.5 rounded-full border border-accent-500/40 text-accent-400 hover:bg-accent-500/10 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/10 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                maxLength={500}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about renting, buying, listing..."
                className="flex-1 min-w-0 bg-base-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                disabled={loading || !input.trim()}
                aria-label="Send"
                className="w-11 shrink-0 rounded-lg bg-accent-500 hover:bg-accent-600 disabled:opacity-50 text-base-950 font-bold transition-colors"
              >
                ➤
              </button>
            </form>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              AI can make mistakes. Need a human?{" "}
              <Link to={user ? "/support" : "/login"} onClick={() => setOpen(false)} className="text-accent-400 hover:underline">
                Contact admin
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
