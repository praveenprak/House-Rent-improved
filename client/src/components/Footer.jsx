import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="mt-20 border-t border-white/5 bg-base-950/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="text-xl font-extrabold text-white">
            House<span className="text-accent-400">Rent</span>
          </p>
          <p className="text-slate-400 mt-2 max-w-xs">
            A broker-mediated real-estate platform: verified owners, admin-approved listings, simple booking.
          </p>
        </div>
        <div>
          <p className="text-slate-200 font-semibold mb-3">Explore</p>
          <ul className="space-y-2 text-slate-400">
            <li><Link to="/properties" className="hover:text-accent-400 transition-colors">Browse properties</Link></li>
            <li><Link to={user ? (user.userType === "owner" ? "/owner" : "/properties") : "/register"} className="hover:text-accent-400 transition-colors">List your property</Link></li>
            <li><Link to="/register" className="hover:text-accent-400 transition-colors">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-slate-200 font-semibold mb-3">Need help?</p>
          <p className="text-slate-400">
            Ask the AI assistant (bottom-right) about renting or buying, or{" "}
            <Link to={user ? "/support" : "/login"} className="text-accent-400 hover:underline">
              contact the admin
            </Link>
            .
          </p>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500 pb-6">© {new Date().getFullYear()} HouseRent. All rights reserved.</p>
    </footer>
  );
}
