// AssignCleaners.jsx
export default function AssignCleaners({
  client,
  staff,
  admins,
  onAssign,
  onRemove,
}) {
  if (!client) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-2">Assigned Cleaners</h3>

      {/* EXISTING ASSIGNMENTS */}
      {client.cleaners && client.cleaners.length > 0 ? (
        client.cleaners.map((a) => (
          <div
            key={a.assignment_id}
            className="flex justify-between items-center border p-2 rounded mb-2"
          >
            <div>
              {a.type.toUpperCase()}: {a.username}
            </div>
            <button
              onClick={() => onRemove(a.assignment_id)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-500">No cleaners assigned</p>
      )}

      {/* ASSIGN NEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <label className="font-semibold">Assign Staff</label>
          <select
            className="border p-2 rounded w-full"
            onChange={(e) =>
              onAssign({ staff_id: Number(e.target.value) })
            }
            defaultValue=""
          >
            <option value="">Select staff...</option>
            {staff
              .filter((s) => s.is_active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username} ({s.role})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="font-semibold">Assign Admin</label>
          <select
            className="border p-2 rounded w-full"
            onChange={(e) =>
              onAssign({ admin_id: Number(e.target.value) })
            }
            defaultValue=""
          >
            <option value="">Select admin...</option>
            {admins
              .filter((a) => a.is_active)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.username}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
}
