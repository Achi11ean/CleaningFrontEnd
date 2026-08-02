// src/ManageReviews.jsx
import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

/* ------------------------------------------------------------------ */
/*  Status theming (approved / pending / rejected)                      */
/* ------------------------------------------------------------------ */
const STATUS_STYLES = {
  approved: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500", bar: "bg-emerald-400" },
  pending: { pill: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500", bar: "bg-amber-400" },
  rejected: { pill: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500", bar: "bg-rose-400" },
};
const reviewStatus = (s) => STATUS_STYLES[s] || STATUS_STYLES.pending;

const FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/* Shared field styling for edit mode */
const LABEL_CLS = "mb-1 block text-xs font-semibold text-slate-600";
const FIELD_CLS =
  "w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10";

/* ------------------------------------------------------------------ */
/*  Icons                                                               */
/* ------------------------------------------------------------------ */
function Icon({ children, className = "w-4 h-4", ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/* Filled four-point sparkle — the "clean shine" motif */
function Sparkle({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2c.5 4.7 3.3 7.5 8 8-4.7.5-7.5 3.3-8 8-.5-4.7-3.3-7.5-8-8 4.7-.5 7.5-3.3 8-8Z" />
    </svg>
  );
}

/* A single star, filled or hollow */
function StarIcon({ filled, className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.3 6.1 21.4l1.1-6.5L2.5 10.3l6.5-.9L12 3Z" />
    </svg>
  );
}

/* Row of 5 stars */
function Stars({ value = 0 }) {
  const v = Number(value) || 0;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          filled={n <= v}
          className={`h-4 w-4 ${n <= v ? "text-amber-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

const RefreshIcon = (p) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </Icon>
);
const PencilIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);
const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </Icon>
);
const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 1.75" />
  </Icon>
);
const XIcon = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

/* Initials for the reviewer avatar */
const getInitials = (r) =>
  `${(r.first_name || "").trim()[0] || ""}${r.last_initial || ""}`.toUpperCase() || "?";

export default function ManageReviews() {
  const { role, axios } = useAuthorizedAxios();
  const canManage = !!axios && (role === "admin" || role === "manager");

  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/reviews", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setReviews(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditForm({
      first_name: r.first_name,
      last_initial: r.last_initial,
      rating: r.rating,
      message: r.message,
      status: r.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await axios.patch(`/admin/reviews/${id}`, editForm);
      setEditingId(null);
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update review");
    }
  };

  const approve = async (id) => {
    await axios.patch(`/admin/reviews/${id}/approve`);
    loadReviews();
  };

  const remove = async (id) => {
    const ok = window.confirm("Delete this review permanently?");
    if (!ok) return;

    await axios.delete(`/admin/reviews/${id}`);
    loadReviews();
  };

  useEffect(() => {
    if (!canManage) return;
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, canManage]);

  /* 🔐 Only admin or manager */
  if (!canManage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <div className="max-w-sm rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <LockIcon className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access restricted</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            You need manager or admin access to manage reviews.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============================ HEADER ============================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-6 py-7 text-white shadow-lg shadow-blue-900/25 sm:px-8">
        {/* soap-suds bubbles */}
        <span className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute right-24 top-6 h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/20" />
        <span className="pointer-events-none absolute -bottom-12 left-28 h-28 w-28 rounded-full bg-cyan-300/10" />
        <span className="pointer-events-none absolute bottom-5 right-10 h-6 w-6 rounded-full bg-white/15" />
        <Sparkle className="pointer-events-none absolute right-8 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-cyan-200/60 sm:block" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Sparkle className="h-6 w-6 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Reviews</h2>
              <p className="mt-1 text-sm text-blue-100">
                Approve, polish, and show off your sparkle.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white ring-1 ring-inset ring-white/20 backdrop-blur">
            <span className="text-base font-bold">{reviews.length}</span>
            reviews
          </span>
        </div>
      </div>

      {/* ============================ TOOLBAR ============================ */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={
                active
                  ? "rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-700/25"
                  : "rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50"
              }
            >
              {f.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={loadReviews}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-800 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-50"
        >
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ============================ CONTENT ============================ */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-blue-400">
            <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
            <p className="text-sm font-medium text-slate-500">Loading reviews…</p>
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              loadReviews();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/40 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm ring-1 ring-blue-100">
            <Sparkle className="h-7 w-7" />
          </div>
          <p className="text-base font-bold text-slate-800">All clean here!</p>
          <p className="mt-1 text-sm text-slate-500">No reviews match this filter yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((r) => {
            const isEditing = editingId === r.id;
            const st = reviewStatus(r.status);

            return (
              <div
                key={r.id}
                className={`relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-200 ${
                  isEditing
                    ? "border border-blue-300 shadow-md ring-2 ring-blue-200"
                    : "border border-blue-100 shadow-sm hover:shadow-md"
                }`}
              >
                {!isEditing && (
                  <span className={`absolute inset-x-0 top-0 h-1 ${st.bar}`} aria-hidden="true" />
                )}

                {isEditing ? (
                  /* ----------------------- EDIT MODE ----------------------- */
                  <div className="flex flex-col gap-4 p-5">
                    <div className="flex items-center gap-2 text-blue-700">
                      <PencilIcon className="h-4 w-4" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">Editing review</h3>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className={LABEL_CLS}>First name</label>
                        <input
                          value={editForm.first_name}
                          onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                          className={FIELD_CLS}
                        />
                      </div>
                      <div className="w-20">
                        <label className={LABEL_CLS}>Initial</label>
                        <input
                          value={editForm.last_initial}
                          maxLength={1}
                          onChange={(e) => setEditForm({ ...editForm, last_initial: e.target.value })}
                          className={`${FIELD_CLS} text-center uppercase`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={LABEL_CLS}>Rating</label>
                        <select
                          value={editForm.rating}
                          onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })}
                          className={FIELD_CLS}
                        >
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n} ★
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className={FIELD_CLS}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLS}>Message</label>
                      <textarea
                        value={editForm.message}
                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                        rows={3}
                        className={`${FIELD_CLS} resize-none`}
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => saveEdit(r.id)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-700/25 transition hover:bg-blue-800"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
                      >
                        <XIcon className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ----------------------- VIEW MODE ----------------------- */
                  <div className="flex flex-1 flex-col gap-4 p-5 pt-6">
                    {/* reviewer + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {getInitials(r)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">
                            {r.first_name} {r.last_initial}.
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Stars value={r.rating} />
                            <span className="text-xs font-semibold text-slate-500">{r.rating}/5</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${st.pill}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {r.status}
                      </span>
                    </div>

                    {/* message — speech bubble */}
                    <div className="max-h-32 overflow-y-auto whitespace-pre-line rounded-2xl rounded-tl-sm bg-blue-50/70 p-3.5 text-sm leading-relaxed text-slate-700 ring-1 ring-inset ring-blue-100">
                      {r.message}
                    </div>

                    {/* created date */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {new Date(r.created_at).toLocaleString()}
                    </div>

                    {/* actions */}
                    <div className="mt-auto flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 transition hover:bg-blue-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </button>

                      {r.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => approve(r.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-100"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => remove(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}