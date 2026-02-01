import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateConsultation({
  onCreated,        // optional callback(consultation)
}) {
  const { role, axios } = useAuthorizedAxios();

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);

  // 🚫 Not logged in
  if (!axios) {
    return (
      <div className="text-red-600">
        You must be logged in to create a consultation.
      </div>
    );
  }

  // 🔄 Load clients
  useEffect(() => {
    async function loadClients() {
      try {
const res = await axios.get("/consultation/clients");
        setClients(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load clients");
      }
    }

    loadClients();
  }, [axios]);

  // 📝 Submit
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a client");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/consultations", {
        client_id: clientId,
        notes,
      });

      setLoading(false);
      setClientId("");
      setNotes("");

      if (onCreated) {
        onCreated(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to create consultation"
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white"
    >
      <h2 className="text-xl font-semibold">
        Create Consultation
      </h2>

      <div className="text-sm text-gray-500">
        Logged in as: <strong>{role}</strong>
      </div>

      {/* Client */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Client
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">Select a client…</option>
          {clients.map((c) => (
  <option key={c.id} value={c.id}>
    {c.first_name} {c.last_name}
  </option>
))}

        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Consultation Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Summary, recommendations, disclaimers…"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Consultation"}
      </button>
    </form>
  );
}
