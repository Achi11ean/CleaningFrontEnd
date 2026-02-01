import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ViewConsultation({ consultationId }) {
  const { axios } = useAuthorizedAxios();
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!consultationId || !axios) return;

    async function load() {
      try {
        const res = await axios.get(`/consultations/${consultationId}`);
        setConsultation(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load consultation");
      }
    }

    load();
  }, [consultationId, axios]);

  /* ───────────────────────────────
     Group entries by section
     ─────────────────────────────── */
  const groupedSections = useMemo(() => {
    if (!consultation?.entries) return {};

    return consultation.entries.reduce((acc, entry) => {
      const key = entry.section_name;

      if (!acc[key]) {
        acc[key] = {
          section_name: key,
          entries: [],
          total_points: 0,
        };
      }

      acc[key].entries.push(entry);
      acc[key].total_points += entry.calculated_points;

      return acc;
    }, {});
  }, [consultation]);

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!consultation) {
    return <div className="text-gray-500">Loading consultation…</div>;
  }

  return (
    <div className="space-y-8 p-6 border rounded-lg bg-white">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Consultation Summary</h2>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div>
            <strong>Date:</strong>{" "}
            {new Date(consultation.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Total Points:</strong>{" "}
            <span className="font-semibold text-lg">
              {consultation.total_points ?? 0}
            </span>
          </div>

          {consultation.notes && (
            <div className="mt-2">
              <strong>Notes:</strong> {consultation.notes}
            </div>
          )}
        </div>
      </div>

      <hr />

      {/* Sections */}
      {Object.keys(groupedSections).length === 0 && (
        <div className="text-gray-500 italic">No entries yet.</div>
      )}

      <div className="space-y-6">
        {Object.values(groupedSections).map((section) => (
          <div
            key={section.section_name}
            className="border rounded-lg p-4 bg-gray-50"
          >
            {/* Section Header */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                {section.section_name}
              </h3>
              <div className="text-sm font-semibold text-gray-700">
                Section Total:{" "}
                <span className="text-base">
                  {section.total_points} pts
                </span>
              </div>
            </div>

            {/* Entries */}
            <div className="space-y-3">
              {section.entries.map((e) => (
                <div
                  key={e.id}
                  className="border rounded p-3 bg-white"
                >
                  <div className="font-medium">
                    {e.item_title}
                  </div>

                  <div className="text-sm text-gray-600">
                    Intensity:{" "}
                    <strong>{e.intensity_label}</strong>
                  </div>

                  <div className="text-sm">
                    Points:{" "}
                    <strong>{e.calculated_points}</strong>
                  </div>

                  {e.notes && (
                    <div className="text-sm italic mt-1 text-gray-500">
                      “{e.notes}”
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(e.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Total (reinforced) */}
      <div className="pt-4 border-t flex justify-end">
        <div className="text-xl font-bold">
          Grand Total:{" "}
          <span className="text-green-700">
            {consultation.total_points ?? 0} pts
          </span>
        </div>
      </div>
    </div>
  );
}
