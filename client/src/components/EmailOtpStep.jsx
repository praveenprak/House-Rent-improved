import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const RESEND_SECONDS = 45;

// Reusable "verify your email" step: sends a 6-digit code to `email`, lets the
// person type it in, and calls onVerified(verificationToken) when it checks out.
// Used by both Register and Forgot Password.
export default function EmailOtpStep({ email, onVerified, onChangeEmail, busy = false, busyText = "Please wait..." }) {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);
  const sentOnce = useRef(false);

  const code = digits.join("");

  const sendCode = async () => {
    setError("");
    setInfo("");
    setSending(true);
    try {
      const res = await api.post("/auth/send-otp", { email });
      setInfo(res.data.message);
      setCooldown(RESEND_SECONDS);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send the code. Please try again.");
      // If the server told us to wait, mirror that in the timer.
      const m = err.response?.data?.message?.match(/(\d+)s/);
      if (err.response?.status === 429 && m) setCooldown(Number(m[1]));
    } finally {
      setSending(false);
    }
  };

  // Send automatically the first time this step appears.
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = async (value) => {
    setError("");
    setVerifying(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp: value });
      onVerified(res.data.verificationToken);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((x, idx) => (idx === i ? "" : x)));
      return;
    }
    // Pasting/typing several digits fills the following boxes too
    const next = [...digits];
    clean.split("").forEach((ch, k) => {
      if (i + k < 6) next[i + k] = ch;
    });
    setDigits(next);
    const focusAt = Math.min(i + clean.length, 5);
    inputs.current[focusAt]?.focus();
    if (next.every(Boolean)) verify(next.join(""));
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  };

  const disabled = verifying || busy;

  return (
    <div>
      <p className="text-slate-300 text-sm text-center">
        We emailed a 6-digit code to
        <br />
        <span className="text-accent-400 font-semibold break-all">{email}</span>
      </p>

      <div className="flex justify-center gap-2 sm:gap-3 my-6" onPaste={(e) => {
        const text = e.clipboardData.getData("text");
        if (/\d{6}/.test(text.replace(/\s/g, ""))) {
          e.preventDefault();
          setDigit(0, text.replace(/\D/g, "").slice(0, 6));
        }
      }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            disabled={disabled}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-lg bg-base-800/80 border text-accent-400 transition focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-60 ${
              d ? "border-accent-500/60" : "border-white/10"
            }`}
          />
        ))}
      </div>

      {info && !error && <p className="text-emerald-400 text-sm text-center mb-3">{info}</p>}
      {error && <p className="text-rose-400 text-sm text-center mb-3">{error}</p>}

      <button
        type="button"
        onClick={() => verify(code)}
        disabled={disabled || code.length !== 6}
        className="btn-primary w-full"
      >
        {busy ? busyText : verifying ? "Verifying..." : "Verify Email"}
      </button>

      <div className="flex items-center justify-between mt-5 text-sm">
        <button type="button" onClick={onChangeEmail} className="text-slate-400 hover:text-slate-200 transition-colors">
          ← Change email
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={sending || cooldown > 0}
          className="text-accent-400 hover:underline disabled:text-slate-500 disabled:no-underline"
        >
          {sending ? "Sending..." : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
