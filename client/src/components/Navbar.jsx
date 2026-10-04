import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const dashboardPath = (user) =>
  user.userType === "admin" ? "/admin" : user.userType === "owner" ? "/owner" : "/renter";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // close the mobile menu whenever the page changes
  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `relative py-1 transition-colors ${
      isActive ? "text-accent-400" : "text-slate-300 hover:text-accent-400"
    } after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:bg-accent-500 after:transition-all ${
      isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
    }`;

  const links = (
    <>
      <NavLink to="/" end className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/properties" className={linkClass}>
        Properties
      </NavLink>
      {user && (
        <NavLink to={dashboardPath(user)} className={linkClass}>
          Dashboard
        </NavLink>
      )}
      {user && user.userType !== "admin" && (
        <NavLink to="/support" className={linkClass}>
          Contact Admin
        </NavLink>
      )}
    </>
  );

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-base-950 shadow-glow group-hover:rotate-6 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h14V10" />
              <path d="M10 20v-6h4v6" />
            </svg>
          </span>
          <span className="text-xl font-extrabold text-white tracking-tight">
            House<span className="text-accent-400">Rent</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-7">
          {links}
          {!user ? (
            <div className="flex items-center gap-3 ml-2">
              <Link to="/login" className="text-slate-200 hover:text-accent-400 transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <span className="text-slate-300 text-sm">
                <span className="text-accent-400 font-semibold">{user.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-400">
                  {user.userType}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-rose-600/90 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Log Out
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 text-slate-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 flex flex-col gap-4 animate-fade-up">
          {links}
          {!user ? (
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="btn-ghost flex-1 !py-2.5">
                Login
              </Link>
              <Link to="/register" className="btn-primary flex-1 !py-2.5">
                Register
              </Link>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-300 text-sm">
                Hi, <span className="text-accent-400 font-semibold">{user.name}</span>
              </span>
              <button onClick={handleLogout} className="bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
