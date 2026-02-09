import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

export default function AssignClients({ client, onUpdated }) {
  const { authAxios } = useStaff();

  const [staffList, setStaffList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  const [cleaners, setCleaners] = useState(client?.cleaners || []);

  const getDisplayName = (a) => {
    const p = a.profile;
    if (p?.first_name || p?.last_name) {
      return `${p.first_name || ""} ${p.last_name || ""}`.trim();
    }
    return a.username;
  };

  useEffect(() => {
    setCleaners(client?.cleaners || []);
  }, [client]);

  useEffect(() => {
    Promise.all([
      authAxios.get("/staff/all"),
      authAxios.get("/admin/all"),
    ])
      .then(([staffRes, adminRes]) => {
        setStaffList(staffRes.data || []);
        setAdminList(adminRes.data || []);
      })
      .catch(console.error);
  }, []);

const refreshAssignments = async () => {
  const res = await authAxios.get(
    `/clients/${client.id}/assignments`
  );

  const updated = res.data.assignments || [];
  setCleaners(updated);

  // 🔥 notify parent WITH DATA
  onUpdated?.(updated);
};


  const assign = async ({ staff_id = null, admin_id = null }) => {
    if (!staff_id && !admin_id) return;

    await authAxios.post(
      `/clients/${client.id}/assign-one`,
      { staff_id, admin_id }
    );

    refreshAssignments();
  };

  const unassign = async (assignment) => {
    if (!window.confirm(`Unassign ${assignment.username}?`)) return;

    await authAxios.delete(
      `/clients/${client.id}/assignments/${assignment.assignment_id}`
    );

    refreshAssignments();
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-600 uppercase">
        Assigned Cleaners
      </h4>

      {cleaners.length > 0 ? (
        cleaners.map((a) => (
          <div
            key={a.assignment_id}
            className="flex justify-between items-center rounded-lg border bg-gray-50 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-sm">
                {getDisplayName(a)}
              </p>
              <p className="text-xs text-gray-500">
                {a.type === "staff" ? "Staff" : "Admin"}
                {a.role ? ` • ${a.role}` : ""}
              </p>
            </div>

            <button
              onClick={() => unassign(a)}
              className="text-red-600 font-bold hover:text-red-800"
            >
              ✕
            </button>
          </div>
        ))
      ) : (
        <p className="text-xs italic text-gray-400">
          No cleaners assigned
        </p>
      )}

      {/* ASSIGN NEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          defaultValue=""
          onChange={(e) =>
            assign({ staff_id: Number(e.target.value) })
          }
        >
          <option value="">Assign staff…</option>
          {staffList
            .filter((s) => s.is_active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.username} ({s.role})
              </option>
            ))}
        </select>

        <select
          className="border rounded px-2 py-1 text-sm"
          defaultValue=""
          onChange={(e) =>
            assign({ admin_id: Number(e.target.value) })
          }
        >
          <option value="">Assign admin…</option>
          {adminList
            .filter((a) => a.is_active)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.username}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
