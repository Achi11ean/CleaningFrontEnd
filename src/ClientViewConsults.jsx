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
        total_points: 0
      };
    }

    const sectionKey = entry.section_name;

    if (!map[roomId].sections[sectionKey]) {
      map[roomId].sections[sectionKey] = {
        section_description: entry.section_description,
        entries: [],
      };
    }

    const points = Number(entry.calculated_points) || 0;

    map[roomId].sections[sectionKey].entries.push(entry);
    map[roomId].total_points += points;
  });

  return map;
}





function formatMinutes(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}


export default function ClientViewConsults({ consultations }) {
  const MINUTES_PER_POINT = 6;

  
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
        {/* ROOMS */}
{Object.values(groupedRooms).map((roomGroup) => {

  const roomPoints = Number(roomGroup.total_points) || 0;
  const roomMinutes = roomPoints * MINUTES_PER_POINT;

  return (
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

        <div className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
          {formatMinutes(roomMinutes)} estimated
        </div>
      </div>

      {/* SECTIONS */}
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

                    <div className="text-xs text-gray-600">
                      {Number(e.quantity) > 1 && (
                        <span className="mr-2 font-medium">
                          ×{Number(e.quantity)}
                        </span>
                      )}

                 

                      <span className="ml-2 text-gray-500">
                        ({formatMinutes(
                          Number(e.calculated_points || 0) *
                          MINUTES_PER_POINT
                        )})
                      </span>
                    </div>

                    {e.item_notes && (
                      <div className="text-xs text-gray-500 italic">
                        {e.item_notes}
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
  );

})} </div>
        );
      })}
    </div>
  );
}