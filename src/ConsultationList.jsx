import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConsultationList({ onSelect }) {
  const { axios } = useAuthorizedAxios();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!axios) return;

    async function load() {
      try {
        const res = await axios.get("/consultations");
        setConsultations(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [axios]);

  if (loading) {
    return <div className="text-gray-500">Loading consultations…</div>;
  }

  if (consultations.length === 0) {
    return <div className="text-gray-500 italic">No consultations yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border rounded-lg">
        <thead className="bg-gray-100 text-sm uppercase text-gray-600">
          <tr>
            <th className="px-4 py-2 text-left">ID</th>
            <th className="px-4 py-2 text-left">Client</th>
            <th className="px-4 py-2 text-left">Total Points</th>
            <th className="px-4 py-2 text-left">Created</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {consultations.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 font-semibold">{c.id}</td>
              <td className="px-4 py-2">Client #{c.client_id}</td>
              <td className="px-4 py-2">
                {c.total_points ?? "—"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-500">
                {new Date(c.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onSelect(c.id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
