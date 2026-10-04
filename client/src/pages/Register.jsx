import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EmailOtpStep from "../components/EmailOtpStep";

const ROLES = [
  { value: "renter", title: "Renter / Buyer", desc: "Browse and book properties", icon: "🔑" },
  { value: "owner", title: "Owner", desc: "List properties for rent or sale", icon: "🏠" },
];

const STEPS = ["Your details", "Verify email", "Done"];

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH_LABEL = ["Too short", "Weak", "Okay", "Good", "Strong"];
const STRENGTH_COLOR = ["bg-slate-600", "bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 details -> 1 verify -> (account created -> /login)
  const [form, setForm] = useState({ name: "", email: "", password: "", userType: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const score = strength(form.password);

  const handleDetails = (e) => {
    e.preventDefault();
    setError("");
    if (!form.userType) return setError("Please choose how you'll use HouseRent");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setForm((f) => ({ ...f, email: f.email.trim().toLowerCase() }));
    setStep(1); // EmailOtpStep sends the code as soon as it appears
  };

  // Email proven -> now (and only now) create the account, then send them to Login.
  const handleVerified = async (verificationToken) => {
    setCreating(true);
    setError("");
    try {
      const data = await register({
        name: form.name,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        userType: form.userType,
        verificationToken,
      });
      navigate("/login", { state: { email: data.email, message: data.message } });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setStep(0);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 py-10">
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10 animate-fade-up">
        {/* progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
                  i <= step ? "bg-accent-500 text-base-950" : "bg-base-800 text-slate-500 border border-white/10"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span className={`text-xs hidden sm:inline ${i <= step ? "text-slate-200" : "text-slate-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-white/15" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-950/60 flex items-center justify-center text-3xl mb-4">📝</div>
              <h1 className="text-2xl font-bold text-white">Create your account</h1>
              <p className="text-sm text-slate-400 mt-1">We'll verify your email before creating it</p>
            </div>

            <form onSubmit={handleDetails} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setForm({ ...form, userType: r.value })}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      form.userType === r.value
                        ? "border-accent-500 bg-accent-500/10 shadow-glow"
                        : "border-white/10 bg-base-800/60 hover:border-white/25"
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <p className="text-white text-sm font-semibold mt-1">{r.title}</p>
                    <p className="text-slate-400 text-xs">{r.desc}</p>
                  </button>
                ))}
              </div>

              <input required placeholder="Full Name" value={form.name} onChange={set("name")} className="input-field" autoComplete="name" />
              <input required type="email" placeholder="Email Address" value={form.email} onChange={set("email")} className="input-field" autoComplete="email" />

              <div>
                <div className="relative">
                  <input
                    required
                    type={showPw ? "text" : "password"}
                    placeholder="Password (min 6 characters)"
                    value={form.password}
                    onChange={set("password")}
                    className="input-field pr-16"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-accent-400"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={`h-1 flex-1 rounded-full transition-colors ${score >= n ? STRENGTH_COLOR[score] : "bg-white/10"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{STRENGTH_LABEL[score]}</p>
                  </div>
                )}
              </div>

              {error && <p className="text-rose-400 text-sm">{error}</p>}

              <button className="btn-primary w-full">Send Verification Code</button>
            </form>

            <p className="text-center mt-6 text-sm">
              <span className="text-slate-400">Already have an account? </span>
              <Link to="/login" className="text-accent-400 hover:underline">Sign In</Link>
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-950/60 flex items-center justify-center text-3xl mb-4">✉️</div>
              <h1 className="text-2xl font-bold text-white">Verify your email</h1>
            </div>
            <EmailOtpStep
              email={form.email}
              onVerified={handleVerified}
              onChangeEmail={() => setStep(0)}
              busy={creating}
              busyText="Creating your account..."
            />
            {error && <p className="text-rose-400 text-sm text-center mt-4">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
