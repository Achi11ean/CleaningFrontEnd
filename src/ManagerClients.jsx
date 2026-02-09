import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

export default function ManagerClients({ client, onClientUpdated }) {
  const { authAxios } = useStaff();

  const [localClient, setLocalClient] = useState(client);
  const [staffList, setStaffList] = useState([]);
  const [adminList, setAdminList] = useState([]);
  
const getDisplayName = (assignment) => {
  const profile = assignment.profile;

  if (profile?.first_name || profile?.last_name) {
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  }

  return assignment.username; // fallback
};

  useEffect(() => {
    setLocalClient(client);
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
      .catch((err) =>
        console.error("Failed to load staff/admin", err)
      );
  }, []);

  const updateField = (field, value) => {
    setLocalClient((c) => ({ ...c, [field]: value }));
  };

  const saveClient = async () => {
    await authAxios.patch(`/clients/${localClient.id}`, {
      first_name: localClient.first_name,
      last_name: localClient.last_name,
      email: localClient.email,
      phone: localClient.phone,
      address: localClient.address,
      message: localClient.message,
      general_notes: localClient.general_notes,
      cleaning_notes: localClient.cleaning_notes,
      status: localClient.status,
    });

    onClientUpdated();
  };

  /* ===========================
     ASSIGN CLEANER (same logic)
     =========================== */
  const assignCleaner = async ({ staff_id = null, admin_id = null }) => {
    await authAxios.post(
      `/clients/${localClient.id}/assign-one`,
      { staff_id, admin_id }
    );

    const res = await authAxios.get(
      `/clients/${localClient.id}/assignments`
    );

    setLocalClient((c) => ({
      ...c,
      cleaners: res.data.assignments,
    }));
  };

  /* ===========================
     UNASSIGN CLEANER
     =========================== */
  const unassignCleaner = async (assignment) => {
    if (
      !window.confirm(`Unassign ${assignment.username}?`)
    )
      return;

    await authAxios.delete(
      `/clients/${localClient.id}/assignments/${assignment.assignment_id}`
    );

    const res = await authAxios.get(
      `/clients/${localClient.id}/assignments`
    );

    setLocalClient((c) => ({
      ...c,
      cleaners: res.data.assignments,
    }));
  };

  return (
    <div className="space-y-6">
      {/* BASIC INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          value={localClient.first_name}
          onChange={(e) =>
            updateField("first_name", e.target.value)
          }
        />
        <input
          className="border p-2 rounded"
          value={localClient.last_name}
          onChange={(e) =>
            updateField("last_name", e.target.value)
          }
        />
        <input
          className="border p-2 rounded"
          value={localClient.email}
          onChange={(e) =>
            updateField("email", e.target.value)
          }
        />
        <input
          className="border p-2 rounded"
          value={localClient.phone || ""}
          onChange={(e) =>
            updateField("phone", e.target.value)
          }
        />
        <div className="md:col-span-2">
  <label className="block text-sm font-semibold mb-1">
    Address
  </label>

  <textarea
    className="
      border p-2 rounded w-full
      focus:ring-2 focus:ring-blue-500
    "
    rows={2}
    value={localClient.address || ""}
    onChange={(e) =>
      updateField("address", e.target.value)
    }
    placeholder="Street, City, State, Zip"
  />
</div>

      </div>
{/* CLIENT STATUS */}
<div className="flex items-center gap-4 bg-slate-50 border rounded-lg p-3">
  <label className="text-sm font-semibold text-gray-700">
    Client Status
  </label>

  <select
    className={`
      px-3 py-2 rounded-md border font-semibold text-sm
      ${
        localClient.status === "new"
          ? "bg-blue-50 text-blue-700 border-blue-300"
          : localClient.status === "active"
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : localClient.status === "paused"
          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
          : localClient.status === "inactive"
          ? "bg-gray-100 text-gray-600 border-gray-300"
          : "bg-red-50 text-red-700 border-red-300"
      }
    `}
    value={localClient.status || "new"}
    onChange={(e) =>
      updateField("status", e.target.value)
    }
  >
    <option value="new">🆕 New</option>
    <option value="active">✅ Active</option>
        <option value="contacted">📞 Contacted</option>

    <option value="paused">⏸️ Paused</option>
    <option value="inactive">⚠️ Inactive</option>
    <option value="archived">🗄️ Archived</option>
  </select>
</div>

      {/* NOTES */}
      <textarea
        className="border p-2 rounded w-full"
        rows={3}
        value={localClient.general_notes || ""}
        onChange={(e) =>
          updateField("general_notes", e.target.value)
        }
        placeholder="General notes"
      />

      <textarea
        className="border p-2 rounded w-full"
        rows={3}
        value={localClient.cleaning_notes || ""}
        onChange={(e) =>
          updateField("cleaning_notes", e.target.value)
        }
        placeholder="Cleaning notes"
      />

      {/* ASSIGNED CLEANERS */}
      {/* ASSIGNED CLEANERS */}
<div>
  <h3 className="font-semibold mb-2">
    Assigned Cleaners
  </h3>

  {localClient.cleaners?.length > 0 ? (
    localClient.cleaners.map((a) => (
      <div
        key={a.assignment_id}
        className="flex justify-between items-center border rounded-lg p-3 mb-2 bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {/* Optional avatar later */}
          <div className="text-sm">
            <p className="font-semibold">
              {getDisplayName(a)}
            </p>

            <p className="text-xs text-gray-500">
              {a.type === "staff" ? "Staff" : "Admin"}
              {a.role ? ` • ${a.role}` : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => unassignCleaner(a)}
          className="text-red-600 font-bold hover:text-red-800"
        >
          ✕
        </button>
      </div>
    ))
  ) : (
    <p className="text-sm italic text-gray-500">
      No cleaners assigned.
    </p>
  )}
</div>


      {/* ASSIGN NEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className="border p-2 rounded"
          defaultValue=""
          onChange={(e) =>
            assignCleaner({ staff_id: Number(e.target.value) })
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
          className="border p-2 rounded"
          defaultValue=""
          onChange={(e) =>
            assignCleaner({ admin_id: Number(e.target.value) })
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

      {/* SAVE */}
      <div className="flex justify-end">
        <button
          onClick={saveClient}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
