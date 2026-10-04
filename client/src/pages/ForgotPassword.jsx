import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import EmailOtpStep from "../components/EmailOtpStep";

// Email -> 6-digit code -> new password. Reuses the same email-OTP step as sign-up.
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    setSaving(true);
    try {
      const res = await api.post("/auth/reset-password", { email, newPassword: password, verificationToken: token });
      navigate("/login", { state: { email, message: res.data.message } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10 animate-fade-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-950/60 flex items-center justify-center text-3xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-white">Reset password</h1>
        </div>

        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEmail(email.trim().toLowerCase());
              setStep(1);
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-400 text-center">Enter your account email and we'll send you a verification code.</p>
            <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" autoComplete="email" />
            <button className="btn-primary w-full">Send Code</button>
          </form>
        )}

        {step === 1 && (
          <EmailOtpStep
            email={email}
            onChangeEmail={() => setStep(0)}
            onVerified={(t) => {
              setToken(t);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-emerald-400 text-center">Email verified. Choose a new password.</p>
            <input
              required
              type="password"
              placeholder="New password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoComplete="new-password"
            />
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <button disabled={saving} className="btn-primary w-full">
              {saving ? "Saving..." : "Update Password"}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm">
          <Link to="/login" className="text-accent-400 hover:underline">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
