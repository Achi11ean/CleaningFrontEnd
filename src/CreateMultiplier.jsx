import React, { useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateMultiplier({ onCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [label, setLabel] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚫 Auth guard
  if (!axios) {
    return (
      <div className="text-red-600">
        You must be logged in to create multipliers.
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!label || multiplier === "") {
      setError("Label and multiplier are required");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/consultation/multipliers", {
        label,
        multiplier: Number(multiplier),
        notes,
      });

      setLabel("");
      setMultiplier("");
      setNotes("");
      setLoading(false);

      if (onCreated) {
        onCreated(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to create multiplier"
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white"
    >
      <h3 className="text-lg font-semibold">
        Create Consultation Multiplier
      </h3>

      <div className="text-sm text-gray-500">
        Logged in as: <strong>{role}</strong>
      </div>

      {/* Label */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Label
        </label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Heavy buildup, Biohazard, Extreme clutter…"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Multiplier */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Multiplier
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={multiplier}
          onChange={(e) => setMultiplier(e.target.value)}
          placeholder="2.0"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Applied when excessive grime or safety concerns are present…"
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
        {loading ? "Creating…" : "Create Multiplier"}
      </button>
    </form>
  );
}
