import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import axios from "axios";
import AssignCleaners from "./AssignCleaners";
import EditClient from "./EditClient";
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
const STATUS_STYLES = {
  new: {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-500 text-white",
  },
  contacted: {
    bg: "bg-indigo-50",
    border: "border-indigo-500",
    text: "text-indigo-700",
    badge: "bg-indigo-500 text-white",
  },
  active: {
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-500 text-white",
  },
  inactive: {
    bg: "bg-gray-100",
    border: "border-gray-400",
    text: "text-gray-700",
    badge: "bg-gray-500 text-white",
  },
  unresponsive: {
    bg: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-700",
    badge: "bg-amber-500 text-white",
  },
  paused: {
    bg: "bg-purple-50",
    border: "border-purple-500",
    text: "text-purple-700",
    badge: "bg-purple-500 text-white",
  },
  archived: {
    bg: "bg-slate-100",
    border: "border-slate-500",
    text: "text-slate-700",
    badge: "bg-slate-600 text-white",
  },
};

  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    alert(
      err.response?.data?.error ||
      "Failed to delete client"
    );
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
    !filteredClients.some(c => c.id === selectedClient.id)
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



  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

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


  return (
    <div className="p-4 max-w-7xl text-center mx-auto">
  <h1 className="text-3xl font-bold mb-6 text-center md:text-center">
    All Clients
  </h1>
  <div className="mb-6">
  <input
    type="text"
    placeholder="Search by name, email, phone, or status…"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="
      w-full
      rounded-xl
      border
      px-4
      py-3
      shadow-sm
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
    "
  />
</div>

<p className="text-sm text-gray-500 mb-2">
  Showing {filteredClients.length} of {clients.length} clients
</p>

  <div className="space-y-10">
  {STATUS_ORDER.map((status) => {
    const clientsInSection = groupedClients[status];

    if (!clientsInSection || clientsInSection.length === 0) return null;

    return (
      <div key={status}>
        {/* Section Header */}
   <div
  className={`
    flex items-center justify-between
    px-5 py-3 mb-6
    rounded-xl border-l-4 shadow-sm
    ${STATUS_STYLES[status]?.bg}
    ${STATUS_STYLES[status]?.border}
  `}
>
  <div
    className={`
      text-lg font-extrabold tracking-wide uppercase
      ${STATUS_STYLES[status]?.text}
    `}
  >
    {status}
  </div>

  <div
    className={`
      text-xs font-semibold px-3 py-1 rounded-full
      ${STATUS_STYLES[status]?.badge}
    `}
  >
    {clientsInSection.length}
  </div>
</div>


        <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-6">
          {clientsInSection.map((client) => {
            const isOpen = selectedClient?.id === client.id;

            return (
              <div
                key={client.id}
                className={`rounded-2xl border shadow-sm bg-white transition-all
                  ${isOpen ? "ring-2 ring-blue-500" : "hover:shadow-md"}
                `}
              >
                {/* CARD HEADER */}
                <button
                  onClick={() =>
                    setSelectedClient(isOpen ? null : client)
                  }
                  className="w-full text-left p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-lg">
                      {client.first_name} {client.last_name}
                    </div>

                    <div className="text-xs text-gray-400 capitalize">
                      Status: {client.status}
                    </div>

                    <div className="text-xs text-gray-400">
                      Created: {formatDate(client.created_at)}
                    </div>
                  </div>

                  <span className="text-sm font-semibold text-blue-600">
                    {isOpen ? "Close" : "Edit"}
                  </span>
                </button>

                {/* EXPANDED CONTENT */}
                {isOpen && (
                  <div className="border-t p-4 space-y-6">
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

                    <div className="border-t pt-4">
                      <button
                        onClick={deleteClient}
                        className="w-full bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 transition"
                      >
                        🗑️ Delete Client
                      </button>

                      <p className="text-xs text-gray-500 mt-2 text-center">
                        This permanently deletes the client, assignments, and schedules.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</div>

</div>

  );
}
