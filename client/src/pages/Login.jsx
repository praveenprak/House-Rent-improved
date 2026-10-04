import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Coming from Register / Forgot Password we get a success message + the email
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rolesToPick, setRolesToPick] = useState(null);
  const notice = location.state?.message;

  const goToDashboard = (user) => {
    if (user.userType === "admin") navigate("/admin");
    else if (user.userType === "owner") navigate("/owner");
    else navigate("/renter");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.needsRoleSelection) {
        setRolesToPick(result.roles);
        return;
      }
      goToDashboard(result);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChoice = async (role) => {
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password, role);
      goToDashboard(user);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (rolesToPick) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-10 animate-fade-up">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-950/60 flex items-center justify-center text-3xl mb-4">🔀</div>
            <h1 className="text-2xl font-bold text-white">Continue as...</h1>
            <p className="text-sm text-slate-400 mt-2 text-center">
              This account has both an owner and a renter profile. Which one do you want to use?
            </p>
          </div>
          <div className="space-y-3">
            {rolesToPick.map((role) => (
              <button
                key={role}
                disabled={loading}
                onClick={() => handleRoleChoice(role)}
                className="w-full bg-base-800 hover:bg-accent-600 border border-white/10 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors capitalize"
              >
                {role}
              </button>
            ))}
          </div>
          {error && <p className="text-rose-400 text-sm mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6">
      <div className="glass w-full max-w-md rounded-2xl border border-white/10 p-8 sm:p-10 animate-fade-up">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-amber-950/60 flex items-center justify-center text-3xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white">Sign In</h1>
        </div>

        {notice && (
          <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-3">
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            autoComplete="email"
          />
          <div className="relative">
            <input
              required
              type={showPw ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-16"
              autoComplete="current-password"
              autoFocus={Boolean(location.state?.email)}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-accent-400"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-sm">
          <Link to="/forgot-password" className="text-rose-400 hover:underline">
            Forgot Password?
          </Link>
          <Link to="/register" className="text-accent-400 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
