import { imageUrl } from "../utils/imageUrl";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60";

export default function PropertyCard({ property, footer }) {
  const img = property.images && property.images.length > 0 ? imageUrl(property.images[0]) : FALLBACK_IMG;
  const isSale = property.adType === "sale";

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5 hover:border-accent-500/40 hover:shadow-glow hover:-translate-y-1 transition-all duration-300 group animate-fade-up">
      <div className="h-48 overflow-hidden relative">
        <img
          src={img}
          alt={property.address}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-base-950/70 via-transparent to-transparent" />
        <span
          className={`absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur ${
            isSale ? "bg-emerald-500/85 text-white" : "bg-accent-500/90 text-base-950"
          }`}
        >
          {isSale ? "For Sale" : "For Rent"}
        </span>
        <span className="absolute top-3 right-3 text-[11px] capitalize px-2.5 py-1 rounded-full bg-black/50 text-slate-100 backdrop-blur">
          {property.propertyType}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-white font-semibold leading-snug mb-1 line-clamp-2">{property.address}</h3>
        {property.location && (
          <p className="text-slate-400 text-sm mb-3 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {property.location}
          </p>
        )}
        {footer}
      </div>
    </div>
  );
}
