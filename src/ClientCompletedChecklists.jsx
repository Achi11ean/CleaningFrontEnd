import React, { useState } from "react";
import { format } from "date-fns";

export default function ClientCompletedChecklists({ checklists }) {
  const [expandedSessionIds, setExpandedSessionIds] = useState([]);

  const toggleSession = (id) => {
    setExpandedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  if (!checklists || checklists.length === 0) {
    return (
      <p className="text-gray-600 italic">
        No completed checklist sessions found.
      </p>
    );
  }

  // 🔁 Helper: Group entries by section
  const groupEntriesBySection = (entries) => {
    const grouped = {};
    for (let entry of entries) {
      const section = entry.consultation_entry?.section_name || "Uncategorized";
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(entry);
    }
    return grouped;
  };

  return (
    <section className="space-y-8">
      {checklists.map((session) => {
        const isExpanded = expandedSessionIds.includes(session.id);
        const grouped = groupEntriesBySection(session.entries);

        return (
          <div
            key={session.id}
            className="bg-white border border-gray-200 rounded-xl shadow-md"
          >
            {/* Toggle Button */}
            <button
              onClick={() => toggleSession(session.id)}
              className="w-full text-left px-6 py-4 flex justify-between items-center font-semibold text-emerald-800 text-lg hover:bg-emerald-50 rounded-t-xl transition"
            >
              <span>
                ✅ {session.label || "Checklist Session"} (
                {format(new Date(session.created_at), "MMM d, yyyy")})
              </span>
              <span className="text-sm text-gray-500">
                {isExpanded ? "Hide ▲" : "View ▼"}
              </span>
            </button>

            {isExpanded && (
              <div className="px-6 pb-6 pt-2 space-y-6 text-sm">
                {session.entries.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No completed entries in this session.
                  </p>
                ) : (
                  Object.entries(grouped).map(([sectionName, entries]) => (
                    <div key={sectionName}>
                      <h5 className="text-md font-bold text-emerald-700 mb-2">
                        📍 {sectionName}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entries.map((entry) => {
                          const task = entry.consultation_entry || {};
                          const completedBy = entry.completed_by || {};
                          return (
                            <div
                              key={entry.id}
                              className="border border-gray-100 rounded-lg bg-gray-50 px-4 py-3"
                            >
                              <div className="font-medium text-emerald-900 mb-1">
                                🧽 {task.item_title || "Unnamed Task"}
                              </div>

                              <div className="text-xs text-gray-600 space-y-1">
                                {task.intensity_label && (
                                  <div>
                                    <strong>Intensity:</strong>{" "}
                                    {task.intensity_label}
                                  </div>
                                )}
                                {typeof task.calculated_points === "number" && (
                                  <div>
                                    <strong>Points:</strong>{" "}
                                    {task.calculated_points}
                                  </div>
                                )}
                                {task.notes && (
                                  <div className="italic text-gray-500">
                                    {task.notes}
                                  </div>
                                )}
                                <div>
                                  <strong>Completed At:</strong>{" "}
                                  {entry.completed_at
                                    ? format(
                                        new Date(entry.completed_at),
                                        "MMM d • h:mm a"
                                      )
                                    : "—"}
                                </div>
                                <div>
                                  <strong>Completed By:</strong>{" "}
                                  {completedBy.role && completedBy.name
                                    ? `${completedBy.role}: ${completedBy.name}`
                                    : "—"}
                                </div>
                                {entry.note && (
                                  <div className="mt-1 italic text-gray-500">
                                    "{entry.note}"
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
