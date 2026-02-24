import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import ManagerClients from "./ManagerClients";

export default function StaffClients() {
  const { authAxios, staff } = useStaff();
  const canEdit = staff?.role === "manager";

  const [clients, setClients] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
  waitlist: {
  bg: "bg-yellow-50",
  border: "border-yellow-400",
  text: "text-yellow-700",
  badge: "bg-yellow-500 text-white",
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
  acc[status] = filteredClients.filter(
    (c) => (c.status || "").toLowerCase() === status
  );
  return acc;
}, {});

  if (loading) return <p className="p-6">Loading clients…</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">
        Client Directory{" "}
        <span className="text-sm font-normal text-gray-500">
          {canEdit ? "(Manager)" : "(Staff – View Only)"}
        </span>
      </h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search clients…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      {/* CLIENT CARDS */}
   <div className="space-y-10">
  {STATUS_ORDER.map((status) => {
    const clientsInSection = groupedClients[status];
    if (!clientsInSection || clientsInSection.length === 0) return null;

const style = STATUS_STYLES[status] || STATUS_STYLES["inactive"];
    return (
      <div key={status}>
        {/* SECTION HEADER */}
        <div
          className={`
            flex items-center justify-between
            px-5 py-3 mb-6
            rounded-xl border-l-4 shadow-sm
            ${style.bg}
            ${style.border}
          `}
        >
          <div
            className={`
              text-lg font-extrabold tracking-wide uppercase
              ${style.text}
            `}
          >
            {status}
          </div>

          <div
            className={`
              text-xs font-semibold px-3 py-1 rounded-full
              ${style.badge}
            `}
          >
            {clientsInSection.length}
          </div>
        </div>

        {/* CLIENT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientsInSection.map((client) => {
            const isOpen = expandedId === client.id;

            return (
              <div
                key={client.id}
                className="border rounded-xl bg-white shadow-sm hover:shadow-md transition"
              >
                {/* CARD HEADER */}
                <button
                  onClick={() =>
                    setExpandedId(isOpen ? null : client.id)
                  }
                  className="w-full text-left p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-lg">
                      {client.first_name} {client.last_name}
                    </p>
                  </div>

                  <span
                    className={`
                      text-xs font-bold px-2 py-1 rounded
                      ${style.badge}
                    `}
                  >
                    {client.status}
                  </span>
                </button>

                {/* EXPANDED CONTENT */}
                {isOpen && (
                  <div className="border-t p-4 bg-gray-50 space-y-4">
                    {canEdit ? (
                      <ManagerClients
                        client={client}
                        onClientUpdated={() => {
                          fetchClients();
                          setExpandedId(null);
                        }}
                      />
                    ) : (
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Address:</strong>{" "}
                          {client.address || "—"}
                        </p>
                        <p>
                          <strong>Notes:</strong>{" "}
                          {client.general_notes || "—"}
                        </p>
                        <p className="italic text-gray-500">
                          View-only. Contact a manager to make changes.
                        </p>
                      </div>
                    )}
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

      {filteredClients.length === 0 && (
        <p className="text-gray-500 italic">
          No clients match your search.
        </p>
      )}
    </div>
  );
}
