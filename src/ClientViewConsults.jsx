import { format } from "date-fns";
function groupByRooms(entries, rooms = []) {
  if (!entries) return {};

  const map = {};

  entries.forEach((entry) => {
    const roomId = entry.room_id || "no-room";

    const room =
      rooms.find((r) => r.id === entry.room_id) || {
        id: "no-room",
        label: "General / Unassigned",
      };

    if (!map[roomId]) {
      map[roomId] = {
        room,
        sections: {},
      };
    }

    const sectionKey = entry.section_name;

    if (!map[roomId].sections[sectionKey]) {
      map[roomId].sections[sectionKey] = {
        section_description: entry.section_description,
        entries: [],
      };
    }

    map[roomId].sections[sectionKey].entries.push(entry);
  });

  return map;
}
export default function ClientViewConsults({ consultations }) {
  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return format(new Date(iso), "MMM d, yyyy • h:mm a");
  };

  if (!consultations?.length) {
    return <p className="italic text-gray-500">No consultations found.</p>;
  }

  return (
    <div className="grid gap-10">
      {consultations.map((c) => {
        const groupedRooms = groupByRooms(c.entries, c.rooms);

        return (
          <div
            key={c.id}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-6"
          >
            {/* HEADER */}
            <div className="space-y-1 text-sm text-gray-600">
              <div>
                <strong>Date:</strong> {formatDateTime(c.created_at)}
              </div>

              {c.performed_by?.username && (
                <div>
                  <strong>Performed by:</strong> {c.performed_by.username}
                  <span className="text-gray-400 italic">
                    {" "}({c.performed_by.role})
                  </span>
                </div>
              )}

              {c.notes && (
                <div className="text-gray-700">
                  <strong>📝 Notes:</strong> {c.notes}
                </div>
              )}
            </div>

            {/* ROOMS */}
            {Object.values(groupedRooms).map((roomGroup) => (
              <div
                key={roomGroup.room.id}
                className="border rounded-xl bg-gray-50 overflow-hidden"
              >
                {/* ROOM HEADER */}
                <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-sky-50 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {roomGroup.room.label}
                    </h3>

                    {roomGroup.room.square_feet && (
                      <div className="text-xs text-gray-500">
                        {roomGroup.room.square_feet} sqft
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTIONS INSIDE ROOM */}
                <div className="space-y-4 p-4">
                  {Object.entries(roomGroup.sections).map(
                    ([sectionName, sectionData]) => (
                      <div key={sectionName} className="space-y-3">
                        {/* SECTION HEADER */}
                        <div>
                          <h4 className="font-semibold text-gray-700">
                            {sectionName}
                          </h4>

                          {sectionData.section_description && (
                            <p className="text-xs text-gray-500 italic">
                              {sectionData.section_description}
                            </p>
                          )}
                        </div>

                        {/* ENTRIES */}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {sectionData.entries.map((e) => (
                            <div
                              key={e.id}
                              className="bg-white border rounded-lg p-4 space-y-2 shadow-sm"
                            >
                              <div className="font-medium text-gray-800">
                                {e.item_title}
                              </div>

                              <div className="text-xs text-gray-500">
                                Intensity:
                                <span className="font-semibold ml-1">
                                  {e.intensity_label}
                                </span>
                              </div>

                              {e.item_notes && (
                                <div className="text-xs text-gray-500 italic">
                                  {e.item_notes}
                                </div>
                              )}

                              {e.multipliers?.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs">
                                  <div className="font-semibold text-amber-700 mb-1">
                                    Applied Multipliers
                                  </div>

                                  {e.multipliers.map((m) => (
                                    <div key={m.id}>
                                      • {m.label} × {m.multiplier}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {e.entry_notes && (
                                <div className="text-xs italic text-gray-600">
                                  “{e.entry_notes}”
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}