import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "./AdminContext";
import axios from "axios";
import AssignCleaners from "./AssignCleaners";
import EditClient from "./EditClient";

/* ------------------------------------------------------------------ *
 * Night-sky theme tokens
 * ------------------------------------------------------------------ */

const NIGHT_BG =
  "radial-gradient(1200px 620px at 12% -8%, rgba(56,189,248,0.14), transparent 60%)," +
  "radial-gradient(1100px 700px at 112% 4%, rgba(129,140,248,0.16), transparent 55%)," +
  "radial-gradient(900px 900px at 50% 120%, rgba(45,212,191,0.08), transparent 60%)," +
  "linear-gradient(180deg, #04070f 0%, #060b1f 42%, #0a1130 100%)";

// Each status gets a luminous accent tuned to read against deep navy.
const STATUS_META = {
  waitlist: { label: "Waitlist", color: "#22d3ee", soft: "rgba(34,211,238,0.12)" },
  new: { label: "New", color: "#60a5fa", soft: "rgba(96,165,250,0.12)" },
  contacted: { label: "Contacted", color: "#818cf8", soft: "rgba(129,140,248,0.12)" },
  active: { label: "Active", color: "#34d399", soft: "rgba(52,211,153,0.12)" },
  inactive: { label: "Inactive", color: "#94a3b8", soft: "rgba(148,163,184,0.12)" },
  unresponsive: { label: "Unresponsive", color: "#fbbf24", soft: "rgba(251,191,36,0.12)" },
  paused: { label: "Paused", color: "#c084fc", soft: "rgba(192,132,252,0.12)" },
  archived: { label: "Archived", color: "#64748b", soft: "rgba(100,116,139,0.10)" },
};

const NS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');

.ns-display { font-family: 'Fraunces', ui-serif, Georgia, 'Times New Roman', serif; }

.ns-title-grad {
  color: #fdf4d8;
  text-shadow: 0 0 24px rgba(252,211,77,0.35), 0 2px 10px rgba(0,0,0,0.45);
  animation: ns-title-glow 6s ease-in-out infinite;
}
@keyframes ns-title-glow {
  0%,100% { text-shadow: 0 0 20px rgba(252,211,77,0.28), 0 2px 10px rgba(0,0,0,0.45); }
  50%     { text-shadow: 0 0 36px rgba(252,211,77,0.55), 0 2px 10px rgba(0,0,0,0.45); }
}

.ns-star {
  animation: ns-twinkle var(--dur,3s) ease-in-out infinite;
  animation-delay: var(--delay,0s);
}
@keyframes ns-twinkle {
  0%,100% { opacity: var(--o,.6); }
  50%     { opacity: calc(var(--o,.6) * .2); }
}

.ns-sparkle {
  animation: ns-sparkle-anim var(--dur,4s) ease-in-out infinite;
  animation-delay: var(--delay,0s);
  transform-origin: center;
}
@keyframes ns-sparkle-anim {
  0%,100% { opacity:.2; transform: scale(.7) rotate(0deg); }
  50%     { opacity:.85; transform: scale(1.05) rotate(30deg); }
}

.ns-card { transition: transform .3s ease, box-shadow .3s ease; will-change: transform; }
.ns-card:hover { transform: translateY(-3px); }

.ns-spinner { animation: ns-spin .9s linear infinite; }
@keyframes ns-spin { to { transform: rotate(360deg); } }

.ns-root :focus-visible {
  outline: 2px solid rgba(252,211,77,0.65);
  outline-offset: 2px;
  border-radius: 10px;
}

.ns-search input:-webkit-autofill,
.ns-search input:-webkit-autofill:focus {
  -webkit-text-fill-color: #e2e8f0;
  -webkit-box-shadow: 0 0 0 1000px rgba(9,14,33,0.9) inset;
  transition: background-color 9999s ease-in-out 0s;
}

@media (prefers-reduced-motion: reduce) {
  .ns-star, .ns-sparkle, .ns-title-grad, .ns-card { animation: none !important; transition: none !important; }
  .ns-card:hover { transform: none !important; }
}
`;

/* ------------------------------------------------------------------ *
 * Small presentational helpers
 * ------------------------------------------------------------------ */

function Sparkle({ className = "", style, size = 16, color = "#fcd34d" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M12 1 L13.6 9.2 L22 11 L13.6 12.8 L12 21 L10.4 12.8 L2 11 L10.4 9.2 Z"
        fill={color}
      />
    </svg>
  );
}

const getMeta = (status) =>
  STATUS_META[status] || {
    label: status || "Other",
    color: "#64748b",
    soft: "rgba(100,116,139,0.10)",
  };

/* ------------------------------------------------------------------ */

export default function ManageClients() {
  const { authAxios } = useAdmin();

  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const STATUS_ORDER = [
    "waitlist",
    "new",
    "contacted",
    "active",
    "inactive",
    "unresponsive",
    "paused",
    "archived",
  ];

  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Decorative starfield — generated once so it doesn't jump between renders.
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: +(Math.random() * 1.8 + 0.8).toFixed(2),
        delay: +(Math.random() * 6).toFixed(2),
        dur: +(Math.random() * 3.5 + 2.5).toFixed(2),
        opacity: +(Math.random() * 0.5 + 0.35).toFixed(2),
        warm: Math.random() > 0.82,
      })),
    []
  );

  const sparkles = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        top: Math.random() * 88 + 3,
        left: Math.random() * 90 + 3,
        size: +(Math.random() * 10 + 10).toFixed(1),
        delay: +(Math.random() * 5).toFixed(2),
        dur: +(Math.random() * 3 + 3).toFixed(2),
      })),
    []
  );

  const deleteClient = async () => {
    if (!selectedClient) return;

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to permanently delete ${selectedClient.first_name} ${selectedClient.last_name}?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await authAxios.delete(`/clients/${selectedClient.id}`);

      setSelectedClient(null);
      await fetchAll();

      alert("Client deleted successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete client");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";

    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatPhone = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "").slice(0, 10); // max 10 digits

    const len = digits.length;

    if (len === 0) return "";
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setSelectedClient({ ...selectedClient, phone: formatted });
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [clientsRes, staffRes, adminsRes] = await Promise.all([
        authAxios.get("/clients"),
        authAxios.get("/staff/all"),
        authAxios.get("/admin/all"),
      ]);

      setClients(clientsRes.data || []);
      setStaff(staffRes.data || []);
      setAdmins(adminsRes.data || []);
    } catch (err) {
      setError("Failed to load clients or staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const updateClientField = (field, value) => {
    setSelectedClient({ ...selectedClient, [field]: value });
  };

  const saveClient = async () => {
    try {
      await authAxios.patch(`/clients/${selectedClient.id}`, {
        first_name: selectedClient.first_name,
        last_name: selectedClient.last_name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        address: selectedClient.address,
        message: selectedClient.message,

        // 🆕 Internal notes
        general_notes: selectedClient.general_notes,
        cleaning_notes: selectedClient.cleaning_notes,

        status: selectedClient.status,
      });

      fetchAll();
      alert("Client updated");
    } catch (err) {
      alert("Failed to update client");
    }
  };

  const assignCleaner = async ({ staff_id = null, admin_id = null }) => {
    if (!selectedClient) return;

    try {
      await authAxios.post(`/clients/${selectedClient.id}/assign-one`, {
        staff_id,
        admin_id,
      });

      const res = await authAxios.get(
        `/clients/${selectedClient.id}/assignments`
      );

      setSelectedClient({
        ...selectedClient,
        cleaners: res.data.assignments,
      });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign cleaner");
    }
  };

  useEffect(() => {
    if (
      selectedClient &&
      !filteredClients.some((c) => c.id === selectedClient.id)
    ) {
      setSelectedClient(null);
    }
  }, [searchTerm]);

  const removeAssignment = async (assignmentId) => {
    try {
      await authAxios.delete(
        `/clients/${selectedClient.id}/assignments/${assignmentId}`
      );

      const res = await authAxios.get(
        `/clients/${selectedClient.id}/assignments`
      );

      setSelectedClient({
        ...selectedClient,
        cleaners: res.data.assignments,
      });
    } catch (err) {
      alert("Failed to remove assignment");
    }
  };

  /* ----------------------------- states ----------------------------- */

  if (loading)
    return (
      <div
        className="ns-root relative flex min-h-screen w-full items-center justify-center overflow-hidden"
        style={{ background: NIGHT_BG }}
      >
        <style>{NS_CSS}</style>
        <div className="flex flex-col items-center gap-4">
          <div
            className="ns-spinner h-10 w-10 rounded-full border-2 border-white/10"
            style={{ borderTopColor: "#fcd34d" }}
          />
          <p className="text-sm tracking-wide text-slate-400">Loading clients…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="ns-root relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4"
        style={{ background: NIGHT_BG }}
      >
        <style>{NS_CSS}</style>
        <div
          className="max-w-sm rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center backdrop-blur-xl"
          style={{ boxShadow: "0 0 40px -12px rgba(239,68,68,0.5)" }}
        >
          <p className="font-semibold text-red-200">Something went wrong</p>
          <p className="mt-2 text-sm text-red-300/80">{error}</p>
        </div>
      </div>
    );

  /* --------------------------- derived data -------------------------- */

  const filteredClients = clients.filter((client) => {
    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();

    const phoneDigits = (client.phone || "").replace(/\D/g, "");
    const searchDigits = q.replace(/\D/g, "");

    return (
      client.first_name?.toLowerCase().includes(q) ||
      client.last_name?.toLowerCase().includes(q) ||
      client.email?.toLowerCase().includes(q) ||
      client.status?.toLowerCase().includes(q) ||
      (searchDigits && phoneDigits.includes(searchDigits))
    );
  });

  const groupedClients = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredClients.filter(
      (client) => (client.status || "").toLowerCase() === status
    );
    return acc;
  }, {});

  const otherClients = filteredClients.filter(
    (client) => !STATUS_ORDER.includes((client.status || "").toLowerCase())
  );

  /* ----------------------------- renderers --------------------------- */

  const renderCard = (client) => {
    const isOpen = selectedClient?.id === client.id;
    const meta = getMeta((client.status || "").toLowerCase());

    return (
      <div
        key={client.id}
        className="ns-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
        style={{
          boxShadow: isOpen
            ? `0 0 0 1px ${meta.color}66, 0 14px 46px -14px ${meta.color}66, inset 4px 0 0 ${meta.color}`
            : `inset 4px 0 0 ${meta.color}99`,
        }}
      >
        {/* Header / toggle */}
        <button
          onClick={() => setSelectedClient(isOpen ? null : client)}
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
        >
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-100">
              {client.first_name} {client.last_name}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
              />
              <span className="capitalize" style={{ color: meta.color }}>
                {client.status || "—"}
              </span>
            </div>

            <div className="mt-1 text-xs text-slate-400">
              Created {formatDate(client.created_at)}
            </div>
          </div>

          <span
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium"
            style={{ color: isOpen ? "#fcd34d" : "#93c5fd" }}
          >
            {isOpen ? "Close" : "Edit"}
            <svg
              className={`h-4 w-4 transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>

        {/* Expanded content */}
        {isOpen && (
          <div className="space-y-5 border-t border-white/10 bg-slate-950/40 p-4 sm:p-5">
            {/* Forms sit on a light "sheet" so EditClient / AssignCleaners
                (which are styled for a light background) stay readable. */}
            <div className="space-y-6 rounded-xl bg-slate-50 p-4 text-slate-800 shadow-lg ring-1 ring-black/5">
              <EditClient
                client={selectedClient}
                updateClientField={updateClientField}
                handlePhoneChange={handlePhoneChange}
                saveClient={saveClient}
              />

              <AssignCleaners
                client={selectedClient}
                staff={staff}
                admins={admins}
                onAssign={assignCleaner}
                onRemove={removeAssignment}
              />
            </div>

            <div className="pt-1">
              <button
                onClick={deleteClient}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                style={{ boxShadow: "0 0 26px -12px rgba(239,68,68,0.6)" }}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete client
              </button>

              <p className="mt-2 text-center text-xs text-slate-400">
                Permanently removes this client, their assignments, and schedules.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (titleKey, list) => {
    if (!list || list.length === 0) return null;
    const meta = getMeta(titleKey);

    return (
      <section key={titleKey} className="mb-12">
        {/* Section header */}
        <div
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-xl"
          style={{ boxShadow: `inset 3px 0 0 ${meta.color}, 0 0 26px -10px ${meta.color}80` }}
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: meta.color, boxShadow: `0 0 12px 1px ${meta.color}` }}
            />
            <span
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          <span
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              color: meta.color,
              borderColor: `${meta.color}40`,
              background: meta.soft,
            }}
          >
            {list.length}
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {list.map((client) => renderCard(client))}
        </div>
      </section>
    );
  };

  /* ------------------------------ view ------------------------------ */

  return (
    <div
      className="ns-root relative min-h-screen w-full overflow-hidden text-slate-200"
      style={{ background: NIGHT_BG }}
    >
      <style>{NS_CSS}</style>

      {/* Starfield */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((s) => (
          <span
            key={s.id}
            className="ns-star absolute rounded-full"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              background: s.warm ? "#fde68a" : "#ffffff",
              boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.65)`,
              "--o": s.opacity,
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
            }}
          />
        ))}

        {sparkles.map((s) => (
          <Sparkle
            key={`sp-${s.id}`}
            className="ns-sparkle absolute"
            size={s.size}
            color="#fcd34d"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              "--dur": `${s.dur}s`,
              "--delay": `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {/* Hero */}
        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3">
            <Sparkle className="ns-sparkle" size={18} style={{ "--dur": "4s" }} />
            <h1 className="ns-display ns-title-grad text-4xl font-semibold tracking-tight sm:text-5xl">
              All Clients
            </h1>
            <Sparkle
              className="ns-sparkle"
              size={18}
              style={{ "--dur": "4.6s", "--delay": "1.2s" }}
            />
          </div>

          <div className="mx-auto mt-4 h-px w-40 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

          <p className="mt-3 text-sm text-slate-400">
            Search, organize, and manage every client by status.
          </p>
        </header>

        {/* Search */}
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="ns-search group relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-amber-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>

            <input
              type="text"
              placeholder="Search by name, email, phone, or status…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-slate-100 placeholder-slate-500 shadow-inner outline-none backdrop-blur-xl transition focus:border-amber-300/40 focus:bg-white/10 focus:ring-2 focus:ring-amber-300/20"
            />
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
        </div>

        {/* Sections */}
        {filteredClients.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
            <Sparkle className="mx-auto mb-3" size={26} color="#64748b" />
            <p className="font-medium text-slate-200">No clients found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try a different name, email, phone, or status.
            </p>
          </div>
        ) : (
          <div>
            {STATUS_ORDER.map((status) =>
              renderSection(status, groupedClients[status])
            )}
            {renderSection("other", otherClients)}
          </div>
        )}
      </div>
    </div>
  );
}