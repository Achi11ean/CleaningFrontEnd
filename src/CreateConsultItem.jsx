import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateConsultItem({ onCreated }) {
  const { role, axios } = useAuthorizedAxios(); 
  const [sectionSearch, setSectionSearch] = useState("");

  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
const [selectedSections, setSelectedSections] = useState([]);
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

  if ((!selectedSections.length && !applyToAll) || !title) {
    setError("Select at least one section or apply to all");
    return;
  }

  setLoading(true);

  try {
    let res;

    if (applyToAll) {

      res = await axios.post("/consultation/items/apply-to-all", {
        title,
        notes,
        base_points: basePoints
      });

    } else if (selectedSections.length > 1) {

      res = await axios.post("/consultation/items/bulk", {
        section_ids: selectedSections,
        title,
        notes,
        base_points: basePoints
      });

    } else {

      res = await axios.post("/consultation/items", {
        section_id: selectedSections[0],
        title,
        notes,
        base_points: basePoints
      });

    }

    setSelectedSections([]);
    setTitle("");
    setNotes("");
    setBasePoints(1);
    setApplyToAll(false);

    if (onCreated) onCreated(res.data);

  } catch (err) {
    console.error(err);
    setError(err.response?.data?.error || "Failed to create item");
  }

  setLoading(false);
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
      Sections
    </label>

    <button
      type="button"
      onClick={loadSections}
      className="text-xs text-blue-600 hover:text-blue-800"
    >
      🔄 Refresh
    </button>
  </div>

  {/* Search Input */}
  <input
    type="text"
    placeholder="Search sections..."
    value={sectionSearch}
    onChange={(e) => setSectionSearch(e.target.value)}
    className="w-full border rounded px-3 py-2 mb-2"
    disabled={applyToAll}
  />
<div className="flex gap-2 mb-2 flex-wrap">
  <button
    type="button"
    onClick={() => setSelectedSections(sections.map(s => s.id))}
    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
    disabled={applyToAll}
  >
    Select All
  </button>

  <button
    type="button"
    onClick={() => setSelectedSections([])}
    className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
  >
    Clear
  </button>
</div>
  {/* Options */}
  <div className="border rounded max-h-40 overflow-y-auto bg-white">
    {sections
      .filter((s) =>
        s.name.toLowerCase().includes(sectionSearch.toLowerCase())
      )
      .map((s) => {
const selected = selectedSections.includes(s.id);
        return (
          <div
            key={s.id}
            onClick={() => {
              if (applyToAll) return;

            if (selected) {
  setSelectedSections(
    selectedSections.filter((id) => id !== s.id)
  );
} else {
  setSelectedSections([...selectedSections, s.id]);
}
            }}
            className={`px-3 py-2 cursor-pointer text-sm flex justify-between
              ${
                selected
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "hover:bg-gray-100"
              }
            `}
          >
            {s.name}
            {selected && <span>✓</span>}
          </div>
        );
      })}
  </div>

  {/* Selected Chips */}
  {selectedSections.length > 0 && (
    <div className="flex flex-wrap gap-2 mt-2">
      {selectedSections.map((id) => {
const section = sections.find((s) => s.id === id);
        if (!section) return null;

        return (
          <span
            key={id}
            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1"
          >
            {section.name}
            <button
              type="button"
              onClick={() =>
                setSelectedSections(
                  selectedSections.filter((sid) => sid !== id)
                )
              }
              className="text-blue-500 hover:text-red-500"
            >
              ✕
            </button>
          </span>
        );
      })}
    </div>
  )}
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
