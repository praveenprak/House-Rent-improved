import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";
import { CardGridSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    title: "Find Your Dream Rental Property",
    subtitle: "Comfort, Convenience & Class — All in One Place",
  },
  {
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
    title: "Commercial Spaces That Mean Business",
    subtitle: "Prime addresses for offices, retail & more",
  },
  {
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    title: "Buy, Rent, or List — Effortlessly",
    subtitle: "A single platform for renters, owners & admins",
  },
  {
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
    title: "Verified Owners. Trusted Listings.",
    subtitle: "Every property, vetted for your peace of mind",
  },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [properties, setProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api
      .get("/properties")
      .then((res) => setProperties(res.data.properties.slice(0, 3)))
      .catch(() => {})
      .finally(() => setPropsLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="relative h-[620px] md:h-[680px] w-full overflow-hidden">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img src={s.img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/40 to-black/40" />
          </div>
        ))}

        <div className="relative h-full flex flex-col items-start justify-end max-w-7xl mx-auto px-6 pb-24">
          <h1
            key={slide}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white max-w-3xl leading-tight drop-shadow-lg animate-fade-up"
          >
            {SLIDES[slide].title}
          </h1>
          <p key={`s${slide}`} className="text-slate-200 text-lg md:text-xl mt-4 animate-fade-up">
            {SLIDES[slide].subtitle}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/properties" className="btn-primary">
              Browse Properties
            </Link>
            <Link to={user ? (user.userType === "owner" ? "/owner" : "/properties") : "/register"} className="btn-ghost bg-black/30 backdrop-blur">
              {user?.userType === "owner" ? "List a Property" : user ? "Explore Listings" : "Get Started Free"}
            </Link>
          </div>

          <div className="flex gap-2 mt-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === slide ? "w-8 bg-accent-500" : "w-2.5 bg-slate-500/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Explore section */}
      <div className="bg-base-900/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-3">Explore Our Premium Properties</h2>
          <p className="text-slate-400 mb-6">
            Looking to post your property?{" "}
            <Link
              to={user ? "/owner" : "/register"}
              className="text-accent-400 border border-accent-500 rounded-lg px-4 py-1.5 ml-1 hover:bg-accent-500/10 transition-colors inline-block"
            >
              Register as Owner
            </Link>
          </p>

          {propsLoading && (
            <div className="mt-12 text-left">
              <CardGridSkeleton count={3} />
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 text-left">
            {properties.map((p) => (
              <PropertyCard
                key={p._id}
                property={p}
                footer={
                  <Link
                    to="/properties"
                    className="text-amber-400 text-sm font-medium hover:underline"
                  >
                    {user ? "View details" : "Login to see details"}
                  </Link>
                }
              />
            ))}
          </div>

          <Link
            to="/properties"
            className="inline-block mt-12 bg-accent-500 hover:bg-accent-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-glow"
          >
            Browse All Properties
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-7xl mx-auto px-6 pt-16">
        <h2 className="text-3xl font-extrabold text-white text-center mb-2">How HouseRent works</h2>
        <p className="text-slate-400 text-center mb-10">A broker-style flow that keeps every listing trustworthy.</p>
        <div className="grid md:grid-cols-4 gap-5">
          {[
            { n: "1", t: "Owner lists", d: "Owners post a property for rent or sale with photos and details." },
            { n: "2", t: "Admin verifies", d: "Our admin reviews every listing and approves only the genuine ones." },
            { n: "3", t: "You request", d: "Renters and buyers send a booking request or purchase enquiry." },
            { n: "4", t: "Track status", d: "Follow pending / booked status live from your dashboard." },
          ].map((step) => (
            <div key={step.n} className="glass rounded-2xl p-6 border border-white/5 hover:border-accent-500/30 transition-colors relative">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-base-950 font-extrabold flex items-center justify-center mb-4">
                {step.n}
              </span>
              <h3 className="text-white font-semibold mb-1">{step.t}</h3>
              <p className="text-slate-400 text-sm">{step.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature strip */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { icon: "✅", title: "Verified Listings", desc: "Every owner is vetted and granted access by our admin team." },
          { icon: "⚡", title: "Instant Booking Requests", desc: "Send a booking request in seconds and track its status live." },
          { icon: "🏢", title: "Residential & Commercial", desc: "From cozy homes to prime commercial addresses, all in one place." },
        ].map((f) => (
          <div key={f.title} className="glass rounded-2xl p-6 border border-white/5 hover:-translate-y-1 hover:border-accent-500/30 transition-all duration-300">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="text-accent-400 font-semibold text-lg mt-3 mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Help band */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="glass rounded-3xl border border-accent-500/20 p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-white">Questions about renting or buying?</h2>
            <p className="text-slate-400 mt-1">
              Chat with our AI assistant (button at the bottom-right) for instant real-estate answers, or reach the admin team directly.
            </p>
          </div>
          <Link to={user ? "/support" : "/register"} className="btn-primary shrink-0">
            {user ? "Contact Admin" : "Create an account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
