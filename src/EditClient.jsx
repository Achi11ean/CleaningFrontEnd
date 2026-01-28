// EditClient.jsx
export default function EditClient({
  client,
  updateClientField,
  handlePhoneChange,
  saveClient,
}) {
  if (!client) return null;

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        Edit Client: {client.first_name} {client.last_name}
      </h2>

      {/* BASIC INFO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          value={client.first_name}
          onChange={(e) =>
            updateClientField("first_name", e.target.value)
          }
          placeholder="First Name"
        />

        <input
          className="border p-2 rounded"
          value={client.last_name}
          onChange={(e) =>
            updateClientField("last_name", e.target.value)
          }
          placeholder="Last Name"
        />

        <input
          className="border p-2 rounded"
          value={client.email}
          onChange={(e) =>
            updateClientField("email", e.target.value)
          }
          placeholder="Email"
        />

        <input
          className="border p-2 rounded"
          value={client.phone || ""}
          onChange={handlePhoneChange}
          placeholder="(123) 456-7890"
          maxLength={14}
          inputMode="numeric"
        />

        <input
          className="border p-2 rounded md:col-span-2"
          value={client.address || ""}
          onChange={(e) =>
            updateClientField("address", e.target.value)
          }
          placeholder="Address"
        />

        <select
          className="border p-2 rounded"
          value={client.status}
          onChange={(e) =>
            updateClientField("status", e.target.value)
          }
        >
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* INQUIRY MESSAGE */}
      <div className="mt-4">
        <label className="block font-semibold mb-1">
          Inquiry Message
        </label>
        <textarea
          className="border p-2 rounded w-full"
          rows={4}
          value={client.message}
          onChange={(e) =>
            updateClientField("message", e.target.value)
          }
        />
      </div>

      {/* INTERNAL NOTES */}
      <div className="mt-6 grid grid-cols-1 gap-4">
        <div>
          <label className="block font-semibold mb-1">
            📝 General Notes (Internal)
          </label>
          <textarea
            className="border p-2 rounded w-full"
            rows={3}
            value={client.general_notes || ""}
            onChange={(e) =>
              updateClientField("general_notes", e.target.value)
            }
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            🧹 Cleaning Notes (For Staff)
          </label>
          <textarea
            className="border p-2 rounded w-full"
            rows={3}
            value={client.cleaning_notes || ""}
            onChange={(e) =>
              updateClientField("cleaning_notes", e.target.value)
            }
          />
        </div>
      </div>

      {/* SAVE */}
      <button
        onClick={saveClient}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Client
      </button>
    </div>
  );
}
