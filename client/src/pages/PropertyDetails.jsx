import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { imageUrl } from "../utils/imageUrl";

export default function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [tenantName, setTenantName] = useState(user?.name || "");
  const [tenantPhone, setTenantPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`).then((res) => setProperty(res.data.property));
  }, [id]);

  if (!property) {
    return <div className="max-w-3xl mx-auto px-6 py-16 text-slate-400">Loading property...</div>;
  }

  const isSale = property.adType === "sale";
  const isBookable = property.status === "approved" && property.available;

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await api.post("/bookings", {
        propertyId: id,
        tenantName,
        tenantPhone,
        message,
      });
      setStatus({
        type: "success",
        text: isSale
          ? "Purchase enquiry sent! Track it under Booking History."
          : "Booking request sent! Track it under Booking History.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to send your request.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button onClick={() => navigate(-1)} className="text-accent-400 mb-6 hover:underline">
        ← Back
      </button>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        {property.images?.length > 0 && (
          <img src={imageUrl(property.images[0])} alt="" className="w-full h-72 object-cover" />
        )}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">{property.address}</h1>
            <span className="text-xs uppercase font-semibold px-2 py-1 rounded bg-accent-500/20 text-accent-400">
              {isSale ? "For Sale" : "For Rent"}
            </span>
          </div>
          <p className="text-slate-400 capitalize mb-4">{property.propertyType}</p>

          {property.status !== "approved" && (
            <p className="text-amber-400 text-sm mb-4">
              This listing is still pending admin approval and is only visible to you as the
              owner/admin — renters and buyers can't see it yet.
            </p>
          )}

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs uppercase">{isSale ? "Price" : "Rent"}</p>
              <p className="text-emerald-400 font-semibold text-lg">
                ₹{property.amount?.toLocaleString("en-IN")}
                {!isSale && <span className="text-slate-400 text-sm">/mo</span>}
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs uppercase">Owner Contact</p>
              <p className="text-white font-semibold">{property.ownerContact}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs uppercase">Availability</p>
              <p className={property.available ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                {property.available ? "Available" : "Unavailable"}
              </p>
            </div>
          </div>

          {property.details && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-2">Additional Details</h2>
              <p className="text-slate-400 whitespace-pre-line">{property.details}</p>
            </div>
          )}

          {isBookable && user?.userType === "renter" && (
            <div>
              <h2 className="text-white font-semibold mb-4">
                {isSale ? "Submit a Purchase Enquiry" : "Request a Booking"}
              </h2>
              <form onSubmit={handleBook} className="space-y-4">
                <input
                  required
                  placeholder="Your Full Name"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <input
                  required
                  placeholder="Phone Number"
                  value={tenantPhone}
                  onChange={(e) => setTenantPhone(e.target.value)}
                  className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <textarea
                  placeholder="Message to owner (optional)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <button
                  disabled={submitting}
                  className="bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  {submitting ? "Sending..." : isSale ? "Enquire to Buy" : "Get Info / Book"}
                </button>
              </form>
              {status && (
                <p className={`mt-4 text-sm ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                  {status.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
