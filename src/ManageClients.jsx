import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import axios from "axios";

export default function ManageClients() {
  const { authAxios } = useAdmin();

  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Manage Clients</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CLIENT LIST */}
        <div className="border rounded-lg p-4 overflow-y-auto max-h-[600px]">
          <h2 className="font-bold mb-4">Clients</h2>
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedClient(c)}
              className={`p-3 rounded cursor-pointer mb-2 border hover:bg-blue-50 ${
                selectedClient?.id === c.id ? "bg-blue-100" : ""
              }`}
            >
              <div className="font-semibold">
                {c.first_name} {c.last_name}
              </div>
              <div className="text-sm text-gray-500">{c.email}</div>
              <div className="text-xs text-gray-400">Status: {c.status}</div>
            </div>
          ))}
        </div>

        {/* CLIENT EDIT PANEL */}
        {selectedClient && (
          <div className="md:col-span-2 border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Edit Client: {selectedClient.first_name} {selectedClient.last_name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                value={selectedClient.first_name}
                onChange={(e) => updateClientField("first_name", e.target.value)}
                placeholder="First Name"
              />

              <input
                className="border p-2 rounded"
                value={selectedClient.last_name}
                onChange={(e) => updateClientField("last_name", e.target.value)}
                placeholder="Last Name"
              />

              <input
                className="border p-2 rounded"
                value={selectedClient.email}
                onChange={(e) => updateClientField("email", e.target.value)}
                placeholder="Email"
              />

      <input
  className="border p-2 rounded"
  value={selectedClient.phone || ""}
  onChange={handlePhoneChange}      // 👈 formatted handler
  placeholder="(123) 456-7890"
  maxLength={14}                    // 👈 prevents extra chars
  inputMode="numeric"              // 👈 mobile numeric keypad
/>

              <input
                className="border p-2 rounded md:col-span-2"
                value={selectedClient.address || ""}
                onChange={(e) => updateClientField("address", e.target.value)}
                placeholder="Address"
              />

              <select
                className="border p-2 rounded"
                value={selectedClient.status}
                onChange={(e) => updateClientField("status", e.target.value)}
              >
                <option value="new">New</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block font-semibold mb-1">Inquiry Message</label>
              <textarea
                className="border p-2 rounded w-full"
                rows={4}
                value={selectedClient.message}
                onChange={(e) => updateClientField("message", e.target.value)}
              />
            </div>
{/* INTERNAL NOTES */}
<div className="mt-6 grid grid-cols-1 gap-4">
  <div>
    <label className="block font-semibold mb-1">
      📝 General Notes (Internal)
    </label>
    <textarea
      className="border p-2 rounded w-full"
      rows={3}
      value={selectedClient.general_notes || ""}
      onChange={(e) =>
        updateClientField("general_notes", e.target.value)
      }
      placeholder="Internal notes about this client (billing, behavior, preferences, etc.)"
    />
  </div>

  <div>
    <label className="block font-semibold mb-1">
      🧹 Cleaning Notes (For Staff)
    </label>
    <textarea
      className="border p-2 rounded w-full"
      rows={3}
      value={selectedClient.cleaning_notes || ""}
      onChange={(e) =>
        updateClientField("cleaning_notes", e.target.value)
      }
      placeholder="Cleaning-specific instructions (pets, access codes, fragile areas, supplies, etc.)"
    />
  </div>
</div>

            <button
              onClick={saveClient}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Client
            </button>

            {/* ASSIGNMENTS */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-2">Assigned Cleaners</h3>

              {selectedClient.cleaners && selectedClient.cleaners.length > 0 ? (
                selectedClient.cleaners.map((a) => (
                  <div
                    key={a.assigned_at}
                    className="flex justify-between items-center border p-2 rounded mb-2"
                  >
                    <div>
                      {a.type.toUpperCase()}: {a.username}
                    </div>
                    <button
onClick={() => removeAssignment(a.assignment_id)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No cleaners assigned</p>
              )}

              {/* ASSIGN NEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="font-semibold">Assign Staff</label>
                  <select
                    className="border p-2 rounded w-full"
                    onChange={(e) =>
                      assignCleaner({ staff_id: Number(e.target.value) })
                    }
                    defaultValue=""
                  >
                    <option value="">Select staff...</option>
                    {staff
                      .filter((s) => s.is_active)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.username} ({s.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold">Assign Admin</label>
                  <select
                    className="border p-2 rounded w-full"
                    onChange={(e) =>
                      assignCleaner({ admin_id: Number(e.target.value) })
                    }
                    defaultValue=""
                  >
                    <option value="">Select admin...</option>
                    {admins
                      .filter((a) => a.is_active)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.username}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
