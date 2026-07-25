import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

export default function CalendarAssign({ clientId }) {
  const { authAxios } = useAdmin();

  const [loading, setLoading] = useState(true);

  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);

  const getDisplayName = (u) => {
    if (u.profile?.first_name || u.profile?.last_name) {
      return `${u.profile?.first_name || ""} ${u.profile?.last_name || ""}`.trim();
    }
    return u.username;
  };

  const loadAssignments = async () => {
    const res = await authAxios.get(
      `/clients/${clientId}/assignments`
    );

    setAssignments(res.data.assignments || []);
  };

  const loadLists = async () => {
    const [staffRes, adminRes] = await Promise.all([
      authAxios.get("/staff/all"),
      authAxios.get("/admin/all"),
    ]);

    setStaff(staffRes.data || []);
    setAdmins(adminRes.data || []);
  };

  useEffect(() => {
    if (!clientId) return;

    const load = async () => {
      setLoading(true);

      try {
        await Promise.all([
          loadAssignments(),
          loadLists(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [clientId]);

  const assign = async ({ staff_id = null, admin_id = null }) => {
    if (!staff_id && !admin_id) return;

    try {
      await authAxios.post(
        `/clients/${clientId}/assign-one`,
        {
          staff_id,
          admin_id,
        }
      );

      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Unable to assign.");
    }
  };

  const removeAssignment = async (assignment) => {
    if (!assignment?.assignment_id) {
      console.error("Missing assignment_id", assignment);
      return;
    }

    if (!window.confirm(`Unassign ${assignment.username}?`))
      return;

    try {
      await authAxios.delete(
        `/clients/${clientId}/assignments/${assignment.assignment_id}`
      );

      await loadAssignments();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Unable to unassign.");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-500">
        Loading assignments...
      </div>
    );
  }

  return (
    <div className="space-y-5">

      <div>
        <h3 className="font-bold text-slate-800">
          Assigned Cleaners
        </h3>

        <div className="mt-3 space-y-2">

          {assignments.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              No one assigned
            </div>
          )}

          {assignments.map((a) => (
            <div
              key={a.assignment_id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div>
                <div className="font-semibold">
                  {getDisplayName(a)}
                </div>

                <div className="text-xs text-slate-500 capitalize">
                  {a.type}
                  {a.role && ` • ${a.role}`}
                </div>
              </div>

              <button
                onClick={() => removeAssignment(a)}
                className="rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">

        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;

            assign({
              staff_id: Number(e.target.value),
            });

            e.target.value = "";
          }}
          className="rounded-xl border border-slate-300 px-3 py-2"
        >
          <option value="">
            Assign staff...
          </option>

          {staff
            .filter((s) => s.is_active)
            .map((s) => (
              <option
                key={s.id}
                value={s.id}
              >
                {s.username} ({s.role})
              </option>
            ))}
        </select>

        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;

            assign({
              admin_id: Number(e.target.value),
            });

            e.target.value = "";
          }}
          className="rounded-xl border border-slate-300 px-3 py-2"
        >
          <option value="">
            Assign admin...
          </option>

          {admins
            .filter((a) => a.is_active)
            .map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.username}
              </option>
            ))}
        </select>

      </div>

    </div>
  );
}