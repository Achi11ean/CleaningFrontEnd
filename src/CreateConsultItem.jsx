import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateConsultItem({ onCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [basePoints, setBasePoints] = useState(1);
const [applyToAll, setApplyToAll] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚫 Auth guard
  if (!axios) {
    return (
      <div className="text-red-600">
        You must be logged in to create consultation items.
      </div>
    );
  }
   async function loadSections() {
      try {
        const res = await axios.get("/consultation/sections");
        setSections(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load sections");
      }
    }
useEffect(() => {
  if (!axios) return;
  loadSections();
}, [axios]);

 async function handleSubmit(e) {
  e.preventDefault();
  setError(null);

  if ((!sectionId && !applyToAll) || !title) {
    setError("Section (or apply to all) and title are required");
    return;
  }

  setLoading(true);

  try {
    let res;

    if (applyToAll) {
      res = await axios.post("/consultation/items/apply-to-all", {
        title,
        notes,
        base_points: basePoints,
      });
    } else {
      res = await axios.post("/consultation/items", {
        section_id: sectionId,
        title,
        notes,
        base_points: basePoints,
      });
    }

    setSectionId("");
    setTitle("");
    setNotes("");
    setBasePoints(1);
    setApplyToAll(false);
    setLoading(false);

    if (onCreated) onCreated(res.data);

  } catch (err) {
    console.error(err);
    setError(err.response?.data?.error || "Failed to create item");
    setLoading(false);
  }
}


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white"
    >
      <h3 className="text-lg font-semibold">
        Create Consultation Item
      </h3>

      <div className="text-sm text-gray-500">
        Logged in as: <strong>{role}</strong>
      </div>

      {/* Section */}
      <div>
<div className="flex items-center justify-between mb-1">
  <label className="block text-sm font-medium">
    Section
  </label>

  <button
    type="button"
    onClick={loadSections}
    className="text-xs text-blue-600 hover:text-blue-800"
  >
    🔄 Refresh
  </button>
</div>

<select
  disabled={applyToAll}
  value={sectionId}
  onChange={(e) => setSectionId(e.target.value)}
  className="w-full border rounded px-3 py-2"
>

          <option value="">Select section…</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
<div className="flex items-center gap-2 mt-2">
  <input
    type="checkbox"
    checked={applyToAll}
    onChange={(e) => setApplyToAll(e.target.checked)}
  />
  <label className="text-sm font-medium text-gray-700">
    Apply this item to ALL sections
  </label>
</div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Item Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Sink, Stove, Toilet, Shower…"
        />
      </div>

      {/* Base Points */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Base Points
        </label>
        <input
          type="number"
          min={1}
          value={basePoints}
          onChange={(e) => setBasePoints(Number(e.target.value))}
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
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Item"}
      </button>
    </form>
  );
}
