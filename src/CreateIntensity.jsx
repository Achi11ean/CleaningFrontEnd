import React, { useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateIntensity({ onCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [label, setLabel] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!axios) {
    return <div className="text-red-600">Not authorized</div>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!label || points === "") {
      setError("Label and points are required");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/consultation/intensities", {
        label,
        points: Number(points),
      });

      setLabel("");
      setPoints("");

      if (onCreated) {
        onCreated(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to create intensity"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white"
    >
      <h3 className="text-lg font-semibold">
        ➕ Create Intensity
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
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. Light, Moderate, Heavy"
        />
      </div>

      {/* Points */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Points
        </label>
        <input
          type="number"
          min="1"
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="e.g. 1, 2, 3"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Intensity"}
      </button>
    </form>
  );
}

