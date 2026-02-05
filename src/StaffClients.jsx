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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClients.map((client) => {
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
                  <p className="text-sm text-gray-500">
                    {client.email || "No email"}
                  </p>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-1 rounded ${
                    client.status === "active"
                      ? "bg-green-100 text-green-700"
                      : client.status === "paused"
                      ? "bg-yellow-100 text-yellow-700"
                      : client.status === "inactive"
                      ? "bg-gray-200 text-gray-600"
                      : "bg-blue-100 text-blue-700"
                  }`}
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

      {filteredClients.length === 0 && (
        <p className="text-gray-500 italic">
          No clients match your search.
        </p>
      )}
    </div>
  );
}
