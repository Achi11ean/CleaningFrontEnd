import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";

export default function StaffClients() {
  const { authAxios, staff } = useStaff();

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
const [searchTerm, setSearchTerm] = useState("");






  const canEdit = staff?.role === "manager"; // 🔐 permission gate

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const len = digits.length;
    if (len === 0) return "";
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    if (!canEdit) return;
    const formatted = formatPhone(e.target.value);
    setSelectedClient({ ...selectedClient, phone: formatted });
  };

const fetchClients = async () => {
  try {
    setLoading(true);
    const res = await authAxios.get("/staff/clients"); // 👈 FIXED
    setClients(res.data || []);
  } catch (err) {
    setError("Failed to load clients");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchClients();
  }, []);

  const updateClientField = (field, value) => {
    if (!canEdit) return;
    setSelectedClient({ ...selectedClient, [field]: value });
  };

 const saveClient = async () => {
  if (!canEdit) {
    alert("Only managers can edit clients.");
    return;
  }

  try {
    await authAxios.patch(`/clients/${selectedClient.id}`, {
      first_name: selectedClient.first_name,
      last_name: selectedClient.last_name,
      email: selectedClient.email,
      phone: selectedClient.phone,
      address: selectedClient.address,
      message: selectedClient.message,
      general_notes: selectedClient.general_notes,
      cleaning_notes: selectedClient.cleaning_notes,
      status: selectedClient.status,
    });

    fetchClients();
    alert("Client updated");
  } catch (err) {
    alert(
      err.response?.data?.error || "Failed to update client"
    );
  }
};


const filteredClients = clients.filter((c) => {
  // 🚫 Hide NEW inquiries from non-managers
  if (!canEdit && c.status === "new") {
    return false;
  }

  const q = searchTerm.toLowerCase().trim();

  if (!q) return true;

  const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
  const email = (c.email || "").toLowerCase();
  const phone = (c.phone || "").toLowerCase();
  const address = (c.address || "").toLowerCase();

  return (
    fullName.includes(q) ||
    email.includes(q) ||
    phone.includes(q) ||
    address.includes(q)
  );
});
  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
   <h1 className="text-3xl font-bold mb-6">
  Client Directory{" "}
  <span className="text-sm font-normal text-gray-500">
    {canEdit ? "(Manager – Editable)" : "(Staff – View Only)"}
  </span>
</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* CLIENT LIST */}
       <div className="border rounded-lg p-4 overflow-y-auto max-h-[600px]">
  <h2 className="font-bold mb-2">Clients</h2>

  {/* 🔍 SEARCH BAR */}
  <input
    type="text"
    placeholder="Search by name, email, phone, or address..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full mb-4 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />

  {filteredClients.length === 0 && (
    <p className="text-sm text-gray-500 italic">
      No clients match your search.
    </p>
  )}

  {filteredClients.map((c) => (

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

        {/* CLIENT VIEW PANEL */}
        {selectedClient && (
          <div className="md:col-span-2 border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Client: {selectedClient.first_name} {selectedClient.last_name}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                disabled={!canEdit}
                className="border p-2 rounded disabled:bg-gray-100"
                value={selectedClient.first_name}
                onChange={(e) => updateClientField("first_name", e.target.value)}
                placeholder="First Name"
              />

              <input
                disabled={!canEdit}
                className="border p-2 rounded disabled:bg-gray-100"
                value={selectedClient.last_name}
                onChange={(e) => updateClientField("last_name", e.target.value)}
                placeholder="Last Name"
              />

              <input
                disabled={!canEdit}
                className="border p-2 rounded disabled:bg-gray-100"
                value={selectedClient.email}
                onChange={(e) => updateClientField("email", e.target.value)}
                placeholder="Email"
              />

              <input
                disabled={!canEdit}
                className="border p-2 rounded disabled:bg-gray-100"
                value={selectedClient.phone || ""}
                onChange={handlePhoneChange}
                placeholder="(123) 456-7890"
                maxLength={14}
                inputMode="numeric"
              />

              <input
                disabled={!canEdit}
                className="border p-2 rounded md:col-span-2 disabled:bg-gray-100"
                value={selectedClient.address || ""}
                onChange={(e) => updateClientField("address", e.target.value)}
                placeholder="Address"
              />

              <select
                disabled={!canEdit}
                className="border p-2 rounded disabled:bg-gray-100"
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
                disabled={!canEdit}
                className="border p-2 rounded w-full disabled:bg-gray-100"
                rows={4}
                value={selectedClient.message}
                onChange={(e) => updateClientField("message", e.target.value)}
              />
            </div>

            {/* NOTES */}
            <div className="mt-6 grid grid-cols-1 gap-4">
              <div>
                <label className="block font-semibold mb-1">
                  📝 General Notes
                </label>
                <textarea
                  disabled={!canEdit}
                  className="border p-2 rounded w-full disabled:bg-gray-100"
                  rows={3}
                  value={selectedClient.general_notes || ""}
                  onChange={(e) =>
                    updateClientField("general_notes", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  🧹 Cleaning Notes
                </label>
                <textarea
                  disabled={!canEdit}
                  className="border p-2 rounded w-full disabled:bg-gray-100"
                  rows={3}
                  value={selectedClient.cleaning_notes || ""}
                  onChange={(e) =>
                    updateClientField("cleaning_notes", e.target.value)
                  }
                />
              </div>
              {/* ASSIGNED CLEANERS */}
<div className="mt-6">
  <h3 className="font-bold mb-2">Assigned Cleaners</h3>

  {selectedClient.cleaners && selectedClient.cleaners.length > 0 ? (
    selectedClient.cleaners.map((a) => (
      <div
        key={a.assignment_id}
        className="border p-2 rounded mb-2 flex justify-between items-center bg-gray-50"
      >
        <div>
          <span className="font-semibold">
            {a.type === "staff" ? "Staff" : "Admin"}:
          </span>{" "}
          {a.username}
          {a.role && (
            <span className="ml-2 text-xs text-gray-500">
              ({a.role})
            </span>
          )}
        </div>
      </div>
    ))
  ) : (
    <p className="text-sm text-gray-500 italic">
      No cleaners assigned to this client.
    </p>
  )}
</div>

            </div>

            {/* SAVE ONLY FOR MANAGERS */}
            {canEdit && (
              <button
                onClick={saveClient}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            )}

            {!canEdit && (
              <p className="mt-4 text-sm text-gray-500 italic">
                View-only mode. Contact a manager to make changes.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
