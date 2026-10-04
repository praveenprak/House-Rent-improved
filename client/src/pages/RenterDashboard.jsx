import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios";
import Properties from "./Properties";

export default function RenterDashboard() {
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab") === "history" ? "Booking History" : "All Properties";
  const [tab, setTab] = useState(initialTab);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (tab === "Booking History") {
      api.get("/bookings/mine").then((res) => setBookings(res.data.bookings));
    }
  }, [tab]);

  const switchTab = (t) => {
    setTab(t);
    setParams(t === "Booking History" ? { tab: "history" } : {});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="glass rounded-2xl border border-white/5 p-6">
        <div className="flex gap-8 border-b border-white/10 mb-6">
          {["All Properties", "Booking History"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`pb-3 font-medium transition-colors ${
                tab === t ? "text-accent-400 border-b-2 border-accent-500" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "All Properties" && (
          <div className="-mx-6 -mb-6">
            <Properties embedded />
          </div>
        )}

        {tab === "Booking History" && (
          <div>
            <h2 className="text-accent-400 font-bold text-xl mb-4">All My Bookings</h2>
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left">
                <thead className="bg-accent-500 text-white">
                  <tr>
                    <th className="p-4">Booking ID</th>
                    <th className="p-4">Property ID</th>
                    <th className="p-4">Tenant Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Booking Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-t border-white/5">
                      <td className="p-4 text-slate-300 text-sm">{b._id}</td>
                      <td className="p-4 text-slate-300 text-sm">{b.propertyId?._id}</td>
                      <td className="p-4 text-slate-300">{b.tenantName}</td>
                      <td className="p-4 text-slate-300">{b.tenantPhone}</td>
                      <td className="p-4">
                        <span className={b.status === "booked" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        You haven't made any bookings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
