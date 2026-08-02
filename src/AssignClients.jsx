import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

/* ------------------------------------------------------------------ */
/*  Small inline icons (no extra dependency)                          */
/* ------------------------------------------------------------------ */

const Icon = ({ path, className = "h-4 w-4", stroke = 2 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {path}
  </svg>
);

const UsersIcon = (p) => (
  <Icon
    {...p}
    path={
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </>
    }
  />
);
const PlusIcon = (p) => <Icon {...p} path={<path d="M12 5v14M5 12h14" />} />;
const XIcon = (p) => <Icon {...p} path={<path d="M18 6L6 18M6 6l12 12" />} />;
const ChevronIcon = (p) => <Icon {...p} path={<path d="M6 9l6 6 6-6" />} />;

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/*                                                                    */
/*  Accepts EITHER:                                                   */
/*    <AssignClients client={clientObj} onUpdated={fn} />             */
/*    <AssignClients clientId={123}    onChanged={fn} />              */
/*                                                                    */
/*  Always fetches the live roster from the API so it never depends   */
/*  on a seed being passed in.                                        */
/* ------------------------------------------------------------------ */

export default function AssignClients({
  client,
  clientId,
  onUpdated,
  onChanged,
}) {
  const { authAxios } = useStaff();

  // Resolve the id from whichever prop was supplied.
  const resolvedClientId = client?.id ?? clientId ?? null;
  const seededCleaners = client?.cleaners || [];

  const [cleaners, setCleaners] = useState(seededCleaners);
  const [rosterLoading, setRosterLoading] = useState(Boolean(resolvedClientId));
  const [staffList, setStaffList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const notify = (updated) => {
    onUpdated?.(updated);
    onChanged?.(updated);
  };

  const getDisplayName = (a) => {
    const p = a.profile;
    if (p?.first_name || p?.last_name) {
      return `${p.first_name || ""} ${p.last_name || ""}`.trim();
    }
    return a.username;
  };
  const getInitial = (a) => getDisplayName(a).charAt(0).toUpperCase() || "?";

  /* Load the client's current assignments straight from the API */
  useEffect(() => {
    if (!resolvedClientId) {
      setRosterLoading(false);
      return;
    }
    let alive = true;
    setRosterLoading(true);
    authAxios
      .get(`/clients/${resolvedClientId}/assignments`)
      .then((res) => {
        if (alive) setCleaners(res.data?.assignments || []);
      })
      .catch((err) => console.error("Failed to load assignments", err))
      .finally(() => {
        if (alive) setRosterLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [resolvedClientId, authAxios]);

  /* Load assignable staff + admins once */
  useEffect(() => {
    let alive = true;
    setListsLoading(true);
    Promise.all([authAxios.get("/staff/all"), authAxios.get("/admin/all")])
      .then(([staffRes, adminRes]) => {
        if (!alive) return;
        setStaffList(staffRes.data || []);
        setAdminList(adminRes.data || []);
      })
      .catch(console.error)
      .finally(() => {
        if (alive) setListsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [authAxios]);

  const refreshAssignments = async () => {
    if (!resolvedClientId) return;
    const res = await authAxios.get(`/clients/${resolvedClientId}/assignments`);
    const updated = res.data?.assignments || [];
    setCleaners(updated);
    notify(updated); // fires both onUpdated and onChanged
  };

  const assign = async ({ staff_id = null, admin_id = null }) => {
    if (!resolvedClientId || (!staff_id && !admin_id)) return;
    try {
      setBusy(true);
      await authAxios.post(`/clients/${resolvedClientId}/assign-one`, {
        staff_id,
        admin_id,
      });
      await refreshAssignments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Unable to assign.");
    } finally {
      setBusy(false);
    }
  };

  const unassign = async (a) => {
    if (!resolvedClientId || !a?.assignment_id) return;
    if (!window.confirm(`Unassign ${getDisplayName(a)}?`)) return;
    try {
      setBusy(true);
      await authAxios.delete(
        `/clients/${resolvedClientId}/assignments/${a.assignment_id}`,
      );
      await refreshAssignments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Unable to unassign.");
    } finally {
      setBusy(false);
    }
  };

  /* Hide people who are already assigned (matched by id + type) */
  const assignedStaffIds = new Set(
    cleaners.filter((c) => c.type === "staff").map((c) => c.id),
  );
  const assignedAdminIds = new Set(
    cleaners.filter((c) => c.type === "admin").map((c) => c.id),
  );

  const availableStaff = staffList.filter(
    (s) => s.is_active && !assignedStaffIds.has(s.id),
  );
  const availableAdmins = adminList.filter(
    (a) => a.is_active && !assignedAdminIds.has(a.id),
  );

  const selectClass =
    "w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm font-medium text-slate-700 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <div className="space-y-5">
      {/* ------------------------------ Roster ------------------------------ */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <UsersIcon className="h-3.5 w-3.5" />
          Assigned cleaners
          {cleaners.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
              {cleaners.length}
            </span>
          )}
        </div>

        {cleaners.length > 0 ? (
          <div className="space-y-2">
            {cleaners.map((a) => (
              <div
                key={a.assignment_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {a.profile?.photo_url ? (
                    <img
                      src={a.profile.photo_url}
                      alt={getDisplayName(a)}
                      className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-sm font-bold text-slate-600">
                      {getInitial(a)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">
                      {getDisplayName(a)}
                    </div>
                    <div className="text-xs capitalize text-slate-500">
                      {a.type === "staff" ? "Staff" : "Admin"}
                      {a.role ? ` • ${a.role}` : ""}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => unassign(a)}
                  disabled={busy}
                  aria-label={`Unassign ${getDisplayName(a)}`}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-50"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : rosterLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-400" />
            Loading assignments…
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-400">
            No one assigned yet
          </div>
        )}
      </div>

      {/* ------------------------------ Add --------------------------------- */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <PlusIcon className="h-3.5 w-3.5" />
          Add a cleaner
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Staff */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">
              Staff member
            </span>
            <div className="relative">
              <select
                defaultValue=""
                disabled={listsLoading || busy}
                onChange={(e) => {
                  if (!e.target.value) return;
                  assign({ staff_id: Number(e.target.value) });
                  e.target.value = "";
                }}
                className={selectClass}
              >
                <option value="">
                  {listsLoading
                    ? "Loading…"
                    : availableStaff.length === 0
                      ? "All staff assigned"
                      : "Assign staff…"}
                </option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username} ({s.role})
                  </option>
                ))}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>

          {/* Admin */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Admin</span>
            <div className="relative">
              <select
                defaultValue=""
                disabled={listsLoading || busy}
                onChange={(e) => {
                  if (!e.target.value) return;
                  assign({ admin_id: Number(e.target.value) });
                  e.target.value = "";
                }}
                className={selectClass}
              >
                <option value="">
                  {listsLoading
                    ? "Loading…"
                    : availableAdmins.length === 0
                      ? "All admins assigned"
                      : "Assign admin…"}
                </option>
                {availableAdmins.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.username}
                  </option>
                ))}
              </select>
              <ChevronIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}