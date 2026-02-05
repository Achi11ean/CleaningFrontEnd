import { format } from "date-fns";
import { useMemo } from "react";

export default function ClientViewConsults({ consultations }) {
  console.log("📋 Full consultation data:", consultations);

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return format(new Date(iso), "MMM d, yyyy • h:mm a");
  };

  if (!consultations || consultations.length === 0) {
    return <p className="italic text-gray-500">No consultations found.</p>;
  }

 return (
  <div className="grid gap-10">
    {consultations.map((c) => {
      const groupedSections = useMemo(() => {
        if (!c.entries) return {};

        return c.entries.reduce((acc, entry) => {
          const key = entry.section_name;
          if (!acc[key]) {
            acc[key] = {
              section_description: entry.section_description,
              entries: [],
            };
          }

          acc[key].entries.push(entry);
          return acc;
        }, {});
      }, [c.entries]);

      return (
        <div
          key={c.id}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-6"
        >
          {/* Consultation Header */}
          <div className="space-y-1 text-sm text-gray-600">
            <div>
              <strong>Date:</strong> {formatDateTime(c.created_at)}
            </div>
            {c.performed_by?.username && (
              <div>
                <strong>Performed by:</strong> {c.performed_by.username}
                <span className="text-gray-400 italic"> ({c.performed_by.role})</span>
              </div>
            )}
            {c.notes && (
              <div className="text-gray-700">
                <strong>📝 Notes:</strong> {c.notes}
              </div>
            )}
          </div>

          {/* Grouped Sections */}
          {Object.entries(groupedSections).map(([section, data]) => (
            <div
              key={section}
              className="border border-gray-100 rounded-xl bg-gray-50"
            >
              <div className="px-4 py-3 border-b bg-white rounded-t-xl">
                <h3 className="font-semibold text-gray-800">{section}</h3>
                {data.section_description && (
                  <p className="text-xs text-gray-500 italic">
                    {data.section_description}
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 p-4">
                {data.entries.map((e) => (
                  <div key={e.id} className="bg-white border rounded-lg p-4 space-y-2 shadow-sm">
                    <div className="font-medium text-gray-800">{e.item_title}</div>
                    <div className="text-xs text-gray-500">
                      Intensity: <span className="font-semibold">{e.intensity_label}</span>
                    </div>

                    {e.item_notes && (
                      <div className="text-xs text-gray-500 italic">
                        Item notes: {e.item_notes}
                      </div>
                    )}

                    {e.multipliers?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                        <div className="font-semibold text-amber-700 mb-1">Applied Multipliers</div>
                        {e.multipliers.map((m) => (
                          <div key={m.id} className="text-amber-800">
                            • {m.label} × {m.multiplier}
                            {m.notes && (
                              <div className="italic text-amber-600 ml-3">{m.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {e.entry_notes && (
                      <div className="text-xs italic text-gray-600">
                        Entry notes: “{e.entry_notes}”
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    })}
  </div>
);
}
