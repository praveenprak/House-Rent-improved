import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import { timeAgo } from "../utils/timeAgo";

const CATEGORIES = [
  { value: "account", label: "Account" },
  { value: "listing", label: "Listing" },
  { value: "booking", label: "Booking" },
  { value: "payment", label: "Payment" },
  { value: "other", label: "Other" },
];

export default function Support() {
  const toast = useToast();
  const [category, setCategory] = useState("other");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api
      .get("/support/mine")
      .then((res) => setItems(res.data.messages))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/support", { category, subject, message });
      toast("Message sent to the admin. You'll see their reply here.", "success");
      setSubject("");
      setMessage("");
      setCategory("other");
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Could not send your message", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 page-enter">
      <h1 className="text-3xl font-extrabold text-white">Contact Admin</h1>
      <p className="text-slate-400 mt-1 mb-8">Stuck with an account, listing or booking? Send us a message and the admin will reply here.</p>

      <div className="grid lg:grid-cols-5 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass rounded-2xl border border-white/5 p-6 space-y-4 h-fit">
          <div>
            <label className="block text-sm text-slate-300 mb-2">What's it about?</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === c.value
                      ? "bg-accent-500 border-accent-500 text-base-950 font-semibold"
                      : "border-white/10 text-slate-300 hover:border-accent-500/50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <input required maxLength={120} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field" />
          <div>
            <textarea
              required
              rows={6}
              maxLength={2000}
              placeholder="Describe your problem or question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field resize-none"
            />
            <p className="text-right text-xs text-slate-500 mt-1">{message.length}/2000</p>
          </div>
          <button disabled={sending} className="btn-primary w-full">
            {sending ? "Sending..." : "Send to Admin"}
          </button>
        </form>

        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-white mb-4">Your requests</h2>
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-28" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass rounded-2xl border border-white/5 p-10 text-center text-slate-400">
              <p className="text-4xl mb-3">💬</p>
              You haven't contacted the admin yet.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((m) => (
                <div key={m._id} className="glass rounded-2xl border border-white/5 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{m.subject}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {m.category} · {timeAgo(m.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        m.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {m.status === "resolved" ? "Resolved" : "Awaiting reply"}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mt-3 whitespace-pre-line">{m.message}</p>
                  {m.adminReply && (
                    <div className="mt-4 rounded-xl border border-accent-500/30 bg-accent-500/5 p-4">
                      <p className="text-xs text-accent-400 font-semibold mb-1">
                        Reply from {m.repliedBy || "Admin"} · {timeAgo(m.repliedAt)}
                      </p>
                      <p className="text-slate-200 text-sm whitespace-pre-line">{m.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
