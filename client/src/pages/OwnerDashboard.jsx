import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { compressImage } from "../utils/compressImage";

const TABS = ["Add Property", "All Properties", "All Bookings"];

const STATUS_STYLES = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-rose-400",
};

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Add Property");
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [form, setForm] = useState({
    propertyType: "residential",
    adType: "rent",
    address: "",
    location: "",
    ownerContact: "",
    amount: 0,
    details: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState(null);

  const loadProperties = () => api.get("/properties/mine").then((res) => setProperties(res.data.properties));
  const loadBookings = () => api.get("/bookings/owner").then((res) => setBookings(res.data.bookings));

  useEffect(() => {
    if (tab === "All Properties") loadProperties();
    if (tab === "All Bookings") loadBookings();
  }, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormStatus(null);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      // Shrink photos first so the upload stays small and fast (and under Vercel's body limit)
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      compressed.forEach((f) => data.append("images", f));

      await api.post("/properties", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormStatus({
        type: "success",
        text: "Property submitted! It will appear to renters/buyers once an admin approves it.",
      });
      setForm({
        propertyType: "residential",
        adType: "rent",
        address: "",
        location: "",
        ownerContact: "",
        amount: 0,
        details: "",
      });
      setFiles([]);
    } catch (err) {
      setFormStatus({ type: "error", text: err.response?.data?.message || "Failed to submit property" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this property?")) return;
    await api.delete(`/properties/${id}`);
    loadProperties();
  };

  const handleToggleAvailability = async (id) => {
    await api.patch(`/properties/${id}/availability`);
    loadProperties();
  };

  const handleBookingStatus = async (booking) => {
    const isSale = booking.propertyId?.adType === "sale";
    const next = booking.status === "booked" ? "pending" : "booked";
    await api.patch(`/bookings/${booking._id}/status`, { status: next });
    loadBookings();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-8 border-b border-white/10 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 font-medium transition-colors ${
              tab === t ? "text-accent-400 border-b-2 border-accent-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Add Property" && (
        <div className="glass rounded-2xl border border-white/5 p-10 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-accent-400 text-center mb-2">Add New Property</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            New listings go to Admin for review before renters or buyers can see them.
          </p>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-300 mb-2">Property Type</label>
              <select
                value={form.propertyType}
                onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Property Ad Type</label>
              <select
                value={form.adType}
                onChange={(e) => setForm({ ...form, adType: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
              >
                <option value="rent">Rent</option>
                <option value="sale">Sale</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-2">City / Location</label>
              <input
                placeholder="e.g. Koramangala, Bengaluru"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 mb-2">Property Full Address</label>
              <input
                required
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Property Amount</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-2">Property Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-500 file:text-white file:font-medium hover:file:bg-accent-600 bg-base-800 border border-white/10 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-2">Owner Contact No.</label>
              <input
                required
                placeholder="Contact number"
                value={form.ownerContact}
                onChange={(e) => setForm({ ...form, ownerContact: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-slate-300 mb-2">Additional Details for the Property</label>
              <textarea
                rows={4}
                placeholder="Add any details here..."
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="w-full bg-base-800 border border-white/10 rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-between">
              {formStatus && (
                <p className={formStatus.type === "success" ? "text-emerald-400" : "text-rose-400"}>
                  {formStatus.text}
                </p>
              )}
              <button
                disabled={submitting}
                className="ml-auto bg-accent-500 hover:bg-accent-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "All Properties" && (
        <div className="glass rounded-2xl border border-white/5 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent-500 text-white">
              <tr>
                <th className="p-4">Property ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Ad Type</th>
                <th className="p-4">Address</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Review Status</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p._id} className="border-t border-white/5">
                  <td className="p-4 text-slate-300 text-sm">{p._id}</td>
                  <td className="p-4 text-slate-300 capitalize">{p.propertyType}</td>
                  <td className="p-4 text-slate-300 capitalize">{p.adType}</td>
                  <td className="p-4 text-slate-300">{p.address}</td>
                  <td className="p-4 text-slate-300">₹{p.amount?.toLocaleString("en-IN")}</td>
                  <td className="p-4">
                    <span className={`font-semibold capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    {p.status === "rejected" && p.rejectionReason && (
                      <p className="text-xs text-slate-500 mt-1 max-w-[180px]">{p.rejectionReason}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleAvailability(p._id)}
                      className={`font-semibold ${p.available ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {p.available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                  <td className="p-4 space-x-2 whitespace-nowrap">
                    <button className="border border-accent-500 text-accent-400 px-3 py-1 rounded-lg hover:bg-accent-500/10">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="border border-rose-500 text-rose-400 px-3 py-1 rounded-lg hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No properties yet. Add your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "All Bookings" && (
        <div className="glass rounded-2xl border border-white/5 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent-500 text-white">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Property ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Tenant / Buyer</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isSale = b.propertyId?.adType === "sale";
                return (
                  <tr key={b._id} className="border-t border-white/5">
                    <td className="p-4 text-slate-300 text-sm">{b._id}</td>
                    <td className="p-4 text-slate-300 text-sm">{b.propertyId?._id}</td>
                    <td className="p-4 text-slate-300 capitalize">{isSale ? "Sale" : "Rent"}</td>
                    <td className="p-4 text-slate-300">{b.tenantName}</td>
                    <td className="p-4 text-slate-300">{b.tenantPhone}</td>
                    <td className="p-4">
                      <span
                        className={`font-semibold ${
                          b.status === "booked" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {b.status === "booked" ? (isSale ? "sold" : "booked") : b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleBookingStatus(b)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-white ${
                          b.status === "booked" ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {b.status === "booked" ? "Mark Pending" : isSale ? "Mark Sold" : "Mark Booked"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
