import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../components/Toast";
import { timeAgo } from "../utils/timeAgo";

const TABS = ["All Users", "All Properties", "All Bookings", "Support"];

const STATUS_STYLES = {
  pending: "text-amber-400",
  approved: "text-emerald-400",
  rejected: "text-rose-400",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState("All Users");
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const toast = useToast();

  // Support inbox ("Contact Admin" messages from users)
  const [supportMsgs, setSupportMsgs] = useState([]);
  const [supportFilter, setSupportFilter] = useState("open");
  const [openCount, setOpenCount] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [replying, setReplying] = useState(null);

  const loadUsers = () => api.get("/users").then((res) => setUsers(res.data.users));
  const loadProperties = () =>
    api.get("/properties/admin/all", { params: { status: statusFilter } }).then((res) => setProperties(res.data.properties));
  const loadBookings = () => api.get("/bookings").then((res) => setBookings(res.data.bookings));

  const loadSupport = () =>
    api
      .get("/support", { params: supportFilter === "all" ? {} : { status: supportFilter } })
      .then((res) => {
        setSupportMsgs(res.data.messages);
        setOpenCount(res.data.openCount);
      });

  // keep the "Support" tab badge fresh even before the tab is opened
  useEffect(() => {
    api.get("/support", { params: { status: "open" } }).then((res) => setOpenCount(res.data.openCount)).catch(() => {});
  }, []);

  const handleSupportReply = async (m) => {
    const reply = (drafts[m._id] || "").trim();
    if (!reply) return toast("Write a reply first", "error");
    setReplying(m._id);
    try {
      await api.patch(`/support/${m._id}/reply`, { reply });
      toast("Reply sent and request marked resolved", "success");
      setDrafts((d) => ({ ...d, [m._id]: "" }));
      loadSupport();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to send reply", "error");
    } finally {
      setReplying(null);
    }
  };

  const handleSupportStatus = async (m, status) => {
    await api.patch(`/support/${m._id}/status`, { status });
    loadSupport();
  };

  useEffect(() => {
    if (tab === "Support") loadSupport();
    if (tab === "All Users") loadUsers();
    if (tab === "All Properties") loadProperties();
    if (tab === "All Bookings") loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter, supportFilter]);

  const handleGrantToggle = async (u) => {
    await api.patch(`/users/${u._id}/grant`);
    loadUsers();
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/users/${id}`);
    loadUsers();
  };

  const handleApprove = async (id) => {
    await api.patch(`/properties/${id}/status`, { status: "approved" });
    loadProperties();
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection (shown to the owner):", "");
    if (reason === null) return;
    await api.patch(`/properties/${id}/status`, { status: "rejected", rejectionReason: reason });
    loadProperties();
  };

  const pendingCount = properties.filter((p) => p.status === "pending").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex gap-8 border-b border-white/10 mb-8">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 font-medium transition-colors relative ${
              tab === t ? "text-accent-400 border-b-2 border-accent-500" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
            {t === "Support" && openCount > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full align-top">
                {openCount}
              </span>
            )}
            {t === "All Properties" && pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full align-top">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "All Users" && (
        <div className="glass rounded-2xl border border-white/5 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent-500 text-white">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Type</th>
                <th className="p-4">Granted (Owners Only)</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-white/5">
                  <td className="p-4 text-slate-300 text-sm">{u._id}</td>
                  <td className="p-4 text-slate-300">{u.name}</td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4 text-accent-400 capitalize">{u.userType}</td>
                  <td className="p-4">
                    {u.userType === "owner" && (
                      <span className={u.granted ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                        {u.granted ? "granted" : "not granted"}
                      </span>
                    )}
                  </td>
                  <td className="p-4 space-x-2 whitespace-nowrap">
                    {u.userType === "owner" && (
                      <button
                        onClick={() => handleGrantToggle(u)}
                        className={`px-3 py-1.5 rounded-lg font-medium text-white ${
                          u.granted ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {u.granted ? "Ungrant" : "Grant"}
                      </button>
                    )}
                    {u.userType !== "admin" && (
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        className="border border-rose-500 text-rose-400 px-3 py-1 rounded-lg hover:bg-rose-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "All Properties" && (
        <div>
          <div className="flex gap-2 mb-4">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  statusFilter === s ? "bg-accent-500 text-white" : "bg-base-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="glass rounded-2xl border border-white/5 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-accent-500 text-white">
                <tr>
                  <th className="p-4">Property ID</th>
                  <th className="p-4">Owner ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Ad Type</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Review Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p._id} className="border-t border-white/5">
                    <td className="p-4 text-slate-300 text-sm">{p._id}</td>
                    <td className="p-4 text-slate-300 text-sm">{p.ownerId}</td>
                    <td className="p-4 text-accent-400 capitalize">{p.propertyType}</td>
                    <td className="p-4 text-slate-300 capitalize">{p.adType}</td>
                    <td className="p-4 text-slate-300">{p.address}</td>
                    <td className="p-4 text-emerald-400">₹{p.amount?.toLocaleString("en-IN")}</td>
                    <td className="p-4">
                      <span className={`font-semibold capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="p-4 space-x-2 whitespace-nowrap">
                      {p.status !== "approved" && (
                        <button
                          onClick={() => handleApprove(p._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {p.status !== "rejected" && (
                        <button
                          onClick={() => handleReject(p._id)}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-medium"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {properties.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No properties in this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "All Bookings" && (
        <div className="glass rounded-2xl border border-white/5 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent-500 text-white">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Owner ID</th>
                <th className="p-4">Property ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Tenant / Buyer</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-t border-white/5">
                  <td className="p-4 text-slate-300 text-sm">{b._id}</td>
                  <td className="p-4 text-slate-300 text-sm">{b.ownerId?._id}</td>
                  <td className="p-4 text-accent-400 text-sm">{b.propertyId?._id}</td>
                  <td className="p-4 text-slate-300 capitalize">{b.propertyId?.adType === "sale" ? "Sale" : "Rent"}</td>
                  <td className="p-4 text-slate-300">{b.tenantName}</td>
                  <td className="p-4">
                    <span className={b.status === "booked" ? "text-emerald-400" : "text-amber-400"}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "Support" && (
        <div>
          <div className="flex gap-2 mb-4">
            {["open", "resolved", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setSupportFilter(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  supportFilter === s ? "bg-accent-500 text-white" : "bg-base-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {supportMsgs.length === 0 ? (
            <div className="glass rounded-2xl border border-white/5 p-10 text-center text-slate-500">
              No {supportFilter === "all" ? "" : supportFilter} support messages.
            </div>
          ) : (
            <div className="space-y-4">
              {supportMsgs.map((m) => (
                <div key={m._id} className="glass rounded-2xl border border-white/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{m.subject}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {m.name} · {m.email} · <span className="capitalize">{m.role}</span> ·{" "}
                        <span className="capitalize">{m.category}</span> · {timeAgo(m.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        m.status === "resolved" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm mt-3 whitespace-pre-line">{m.message}</p>

                  {m.adminReply && (
                    <div className="mt-3 rounded-xl border border-accent-500/30 bg-accent-500/5 p-3">
                      <p className="text-xs text-accent-400 font-semibold mb-1">
                        Replied by {m.repliedBy || "Admin"} · {timeAgo(m.repliedAt)}
                      </p>
                      <p className="text-slate-200 text-sm whitespace-pre-line">{m.adminReply}</p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <textarea
                      rows={2}
                      placeholder={m.adminReply ? "Send another reply..." : "Write a reply..."}
                      value={drafts[m._id] || ""}
                      onChange={(e) => setDrafts((d) => ({ ...d, [m._id]: e.target.value }))}
                      className="input-field flex-1 resize-none text-sm"
                    />
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleSupportReply(m)}
                        disabled={replying === m._id}
                        className="btn-primary !px-4 !py-2 text-sm"
                      >
                        {replying === m._id ? "Sending..." : "Reply & Resolve"}
                      </button>
                      {m.status === "open" ? (
                        <button onClick={() => handleSupportStatus(m, "resolved")} className="btn-ghost !px-4 !py-2 text-sm">
                          Mark resolved
                        </button>
                      ) : (
                        <button onClick={() => handleSupportStatus(m, "open")} className="btn-ghost !px-4 !py-2 text-sm">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
