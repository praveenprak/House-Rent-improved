import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import PropertyCard from "../components/PropertyCard";
import { CardGridSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";

export default function Properties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [adType, setAdType] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await api.get("/properties", {
        params: { search, adType, propertyType, minPrice, maxPrice },
      });
      setProperties(res.data.properties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, adType, propertyType, minPrice, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 page-enter">
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-10">
        <input
          type="text"
          placeholder="Search by Address or Location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <select
          value={adType}
          onChange={(e) => setAdType(e.target.value)}
          className="bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Ad Types</option>
          <option value="rent">For Rent</option>
          <option value="sale">For Sale</option>
        </select>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
        </select>
        <input
          type="number"
          min="0"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-32 bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
        <input
          type="number"
          min="0"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-32 bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : properties.length === 0 ? (
        <div className="glass rounded-2xl border border-white/5 p-12 text-center">
          <p className="text-4xl mb-3">🏘️</p>
          <p className="text-slate-300 font-medium">No approved properties match your search yet.</p>
          <p className="text-slate-500 text-sm mt-1">Try clearing a filter, or ask the AI assistant for ideas.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const isSale = p.adType === "sale";
            return (
              <PropertyCard
                key={p._id}
                property={p}
                footer={
                  <>
                    {user ? (
                      <div className="space-y-1 mb-3 text-sm text-slate-300">
                        <p>
                          <span className="font-semibold text-white">Availability:</span>{" "}
                          <span className="text-emerald-400">Available</span>
                        </p>
                        <p>
                          <span className="font-semibold text-white">{isSale ? "Price:" : "Rent:"}</span> ₹
                          {p.amount?.toLocaleString("en-IN")}
                          {!isSale && <span className="text-slate-400">/mo</span>}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm mb-3">
                        {p.propertyType} - {isSale ? "for sale" : "for rent"}
                      </p>
                    )}

                    {user ? (
                      <Link
                        to={`/properties/${p._id}`}
                        className="block text-center bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 rounded-lg transition-colors"
                      >
                        {isSale ? "View Details / Enquire to Buy" : "Get Info / Book"}
                      </Link>
                    ) : (
                      <Link to="/login" className="text-amber-400 text-sm font-medium hover:underline">
                        Login to see details
                      </Link>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
