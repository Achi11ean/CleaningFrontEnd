import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import ManagerClients from "./ManagerClients";

/* ------------------------------------------------------------------ */
/*  Status ordering + refined theming                                   */
/* ------------------------------------------------------------------ */
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

const STATUS_STYLES = {
  waitlist: { dot: "bg-amber-500", bar: "bg-amber-400", pill: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  new: { dot: "bg-blue-500", bar: "bg-blue-500", pill: "bg-blue-50 text-blue-700 ring-blue-600/15" },
  contacted: { dot: "bg-indigo-500", bar: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 ring-indigo-600/15" },
  active: { dot: "bg-emerald-500", bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15" },
  inactive: { dot: "bg-gray-400", bar: "bg-gray-300", pill: "bg-gray-100 text-gray-600 ring-gray-500/15" },
  unresponsive: { dot: "bg-rose-500", bar: "bg-rose-400", pill: "bg-rose-50 text-rose-700 ring-rose-600/15" },
  paused: { dot: "bg-violet-500", bar: "bg-violet-500", pill: "bg-violet-50 text-violet-700 ring-violet-600/15" },
  archived: { dot: "bg-slate-500", bar: "bg-slate-400", pill: "bg-slate-100 text-slate-600 ring-slate-500/15" },
};
const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.inactive;

/* ------------------------------------------------------------------ */
/*  Inline line-icons (no dependency, inherit currentColor)             */
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

const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </Icon>
);
const XIcon = (p) => (
  <Icon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Icon>
);
const ChevronDownIcon = (p) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
const UsersIcon = (p) => (
  <Icon {...p}>
    <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="9" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87" />
    <path d="M16 3.63a4 4 0 0 1 0 6.74" />
  </Icon>
);
const MapPinIcon = (p) => (
  <Icon {...p}>
    <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);
const NoteIcon = (p) => (
  <Icon {...p}>
    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M9 12h6M9 16h4" />
  </Icon>
);
const LockIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Icon>
);

/* Initials for the client avatar */
const getInitials = (c) => {
  const a = (c.first_name || "").trim()[0] || "";
  const b = (c.last_name || "").trim()[0] || "";
  return (a + b).toUpperCase() || "?";
};

export default function StaffClients() {
  const { authAxios, staff } = useStaff();
  const canEdit = staff?.role === "manager";

  const [clients, setClients] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/staff/clients");
      setClients(res.data || []);
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!canEdit && c.status === "new") return false;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    return (
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const groupedClients = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filteredClients.filter((c) => (c.status || "").toLowerCase() === status);
    return acc;
  }, {});

  // Role-visible total (independent of the current search) — for the header count
  const visibleTotal = clients.filter((c) => canEdit || c.status !== "new").length;

  /* --------------------------- states --------------------------- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-500" />
          <p className="text-sm font-medium">Loading clients…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <p className="mt-1 text-xs text-rose-600/80">Check your connection and try again.</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            fetchClients();
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200 transition hover:bg-rose-100"
        >
          Try again
        </button>
      </div>
    );
  }

  /* --------------------------- render --------------------------- */
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* ============================ HEADER ============================ */}
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
              <UsersIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Client Directory
                </h1>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                    canEdit
                      ? "bg-indigo-50 text-indigo-600 ring-indigo-600/15"
                      : "bg-slate-100 text-slate-500 ring-slate-500/15"
                  }`}
                >
                  {canEdit ? "Manager" : "View only"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">
                {canEdit
                  ? "Browse, search, and manage every client by status."
                  : "Browse and search clients across every status."}
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200">
            <span className="text-base font-semibold text-slate-900">{visibleTotal}</span>
            clients
          </span>
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ========================= STATUS SECTIONS ========================= */}
      <div className="space-y-10">
        {STATUS_ORDER.map((status) => {
          const clientsInSection = groupedClients[status];
          if (!clientsInSection || clientsInSection.length === 0) return null;

          const style = statusStyle(status);

          return (
            <section key={status}>
              {/* SECTION HEADER */}
              <div className="mb-5 flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                  {status}
                </h2>
                <span
                  className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${style.pill}`}
                >
                  {clientsInSection.length}
                </span>
                <div className="ml-1 h-px flex-1 bg-slate-200/70" />
              </div>

              {/* CLIENT GRID */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {clientsInSection.map((client) => {
                  const isOpen = expandedId === client.id;

                  return (
                    <div
                      key={client.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                    >
                      {/* status accent bar */}
                      <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} aria-hidden="true" />

                      {/* CARD HEADER (toggle) */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : client.id)}
                        className="flex w-full items-center gap-3.5 py-4 pl-6 pr-4 text-left transition hover:bg-slate-50/60"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                          {getInitials(client)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">
                            {client.first_name} {client.last_name}
                          </p>
                          {client.email && (
                            <p className="truncate text-xs text-slate-400">{client.email}</p>
                          )}
                        </div>

                        <span
                          className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset sm:inline-flex ${style.pill}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                          {client.status}
                        </span>

                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* EXPANDED CONTENT */}
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 py-4 pl-6 pr-4">
                          {canEdit ? (
                            <ManagerClients
                              client={client}
                              onClientUpdated={() => {
                                fetchClients();
                                setExpandedId(null);
                              }}
                            />
                          ) : (
                            <div className="space-y-3 text-sm">
                              <div className="flex gap-2.5">
                                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Address
                                  </p>
                                  <p className="text-slate-700">{client.address || "—"}</p>
                                </div>
                              </div>

                              <div className="flex gap-2.5">
                                <NoteIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Notes
                                  </p>
                                  <p className="whitespace-pre-line text-slate-700">
                                    {client.general_notes || "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
                                <LockIcon className="h-3.5 w-3.5 shrink-0" />
                                View only — contact a manager to make changes.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {filteredClients.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
            <SearchIcon className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {searchTerm ? "No matches found" : "No clients yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {searchTerm
              ? `Nothing matches “${searchTerm}”. Try a different name or email.`
              : "Clients will appear here once added."}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
}