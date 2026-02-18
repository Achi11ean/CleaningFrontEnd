import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConductConsultation({ consultationId, onEntryCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [sections, setSections] = useState([]);
  const [intensities, setIntensities] = useState([]);
  const [multipliers, setMultipliers] = useState([]);
const [rooms, setRooms] = useState([]);
const [activeRoomId, setActiveRoomId] = useState(null);

const [newRoomLabel, setNewRoomLabel] = useState("");
const [newRoomSqft, setNewRoomSqft] = useState("");

  const [selectedSections, setSelectedSections] = useState([]);
  const [itemsBySection, setItemsBySection] = useState({});
  const [itemState, setItemState] = useState({});
const [savingAll, setSavingAll] = useState(false);
const [creatingItemFor, setCreatingItemFor] = useState(null);
const [newItemTitle, setNewItemTitle] = useState("");
const [newItemPoints, setNewItemPoints] = useState(1);
const [creatingItemLoading, setCreatingItemLoading] = useState(false);
const [newItemNotes, setNewItemNotes] = useState("");

  const [error, setError] = useState(null);
  const [savingItemId, setSavingItemId] = useState(null);
/* ───────────────────────────────
   Prefill when consultation changes
   ─────────────────────────────── */
useEffect(() => {
  if (!consultationId || !axios) return;

  async function loadExisting() {
    try {
      const res = await axios.get(`/consultations/${consultationId}`);

      const allEntries = res.data.entries || [];
      const roomsData = res.data.rooms || [];

      setRooms(roomsData);

      // 👉 If rooms exist → select first room and hydrate it
      if (roomsData.length > 0) {
        const firstRoomId = roomsData[0].id;
        setActiveRoomId(firstRoomId);

        const roomEntries = allEntries.filter(
          e => e.room_id === firstRoomId
        );

        await hydrateFromEntries(roomEntries);

      } else {
        // 👉 No rooms yet → clear UI state
        setSelectedSections([]);
        setItemsBySection({});
        setItemState({});
      }

    } catch (err) {
      console.error(err);
      setError("Failed to load existing consultation data");
    }
  }

  loadExisting();
}, [consultationId, axios]);


async function createRoom() {
  if (!newRoomLabel.trim()) return;

  try {
    const res = await axios.post(
      `/consultations/${consultationId}/rooms`,
      {
        label: newRoomLabel,
        square_feet: newRoomSqft || null
      }
    );

    setRooms(prev => [...prev, res.data]);
    setActiveRoomId(res.data.id);

    setNewRoomLabel("");
    setNewRoomSqft("");
  } catch {
    setError("Failed to create room");
  }
}


async function deleteRoom(roomId) {
  if (!window.confirm("Delete this room and all its items?")) return;

  try {
    await axios.delete(`/consultation-rooms/${roomId}`);

    // Remove from state
    setRooms(prev => prev.filter(r => r.id !== roomId));

    // If deleting active room → switch to another
    if (activeRoomId === roomId) {
      const remaining = rooms.filter(r => r.id !== roomId);

      if (remaining.length > 0) {
        setActiveRoomId(remaining[0].id);
      } else {
        setActiveRoomId(null);

        // clear UI state
        setSelectedSections([]);
        setItemsBySection({});
        setItemState({});
      }
    }

  } catch (err) {
    console.error(err);
    setError("Failed to delete room");
  }
}

  /* ───────────────────────────────
     Load reference data
     ─────────────────────────────── */
  useEffect(() => {
    async function load() {
      const [s, i, m] = await Promise.all([
        axios.get("/consultation/sections"),
        axios.get("/consultation/intensities"),
        axios.get("/consultation/multipliers"),
      ]);

      setSections(s.data || []);
      setIntensities(i.data || []);
      setMultipliers(m.data || []);
    }
    load();
  }, [axios]);
useEffect(() => {
  if (!activeRoomId || !axios) return;

  async function loadRoomEntries() {
    try {
      const res = await axios.get(`/consultations/${consultationId}`);
      const allEntries = res.data.entries || [];

      const roomEntries = allEntries.filter(
        e => e.room_id === activeRoomId
      );

      await hydrateFromEntries(roomEntries);

    } catch (err) {
      console.error(err);
      setError("Failed to load room entries");
    }
  }

  loadRoomEntries();
}, [activeRoomId, consultationId, axios]);


  /* ───────────────────────────────
     Toggle section
     ─────────────────────────────── */
async function handleSectionChange(newSectionIds) {
  const added = newSectionIds.filter(id => !selectedSections.includes(id));

  setSelectedSections(newSectionIds);

  // Load items for newly added sections
  for (const sectionId of added) {
    if (!itemsBySection[sectionId]) {
      const res = await axios.get(`/consultation/sections/${sectionId}`);

      setItemsBySection(prev => ({
        ...prev,
        [sectionId]: res.data.items || []
      }));
    }
  }
}

async function createNewItem(sectionId) {
  if (!newItemTitle.trim()) return;

  setCreatingItemLoading(true);

  try {
    const res = await axios.post("/consultation/items", {
      section_id: sectionId,
      title: newItemTitle,
      notes: newItemNotes || null,
      base_points: newItemPoints || 1,
    });

    setItemsBySection(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), res.data]
    }));

    setNewItemTitle("");
    setNewItemNotes("");
    setNewItemPoints(1);
    setCreatingItemFor(null);

  } catch (err) {
    console.error(err);
    setError("Failed to create item");
  } finally {
    setCreatingItemLoading(false);
  }
}


function updateItem(itemId, patch) {
  setItemState(prev => ({
    ...prev,
    [itemId]: {
      ...prev[itemId],   // ← preserve existing state FIRST
      intensityId: prev[itemId]?.intensityId ?? null,
      multiplierIds: prev[itemId]?.multiplierIds ?? [],
      notes: prev[itemId]?.notes ?? "",
      quantity: prev[itemId]?.quantity ?? 1,   // ← safe default
      ...patch
    }
  }));
}

  /* ───────────────────────────────
     Save single item
     ─────────────────────────────── */
async function saveItem(sectionId, item) {
  // 🚨 Must have a room selected
  if (!activeRoomId) {
    setError("Please select a room before saving items.");
    return;
  }

  const state = itemState[item.id];

  // 🚨 Must have intensity selected
  if (!state?.intensityId) {
    setError("Each item requires an intensity.");
    return;
  }

  setSavingItemId(item.id);
  setError(null);

  try {
    const res = await axios.post(
      `/consultations/${consultationId}/entries`,
     {
  room_id: activeRoomId,
  section_id: sectionId,
  item_id: item.id,
  intensity_id: state.intensityId,
  multiplier_ids: state.multiplierIds || [],
  notes: state.notes || "",
  quantity: state.quantity || 1,   // ⭐ NEW
}

    );

    // Notify parent component
    onEntryCreated?.(res.data);

  } catch (err) {
    console.error(err);
    setError(
      err.response?.data?.error ||
      "Failed to save item. Please try again."
    );
  } finally {
    setSavingItemId(null);
  }
}
async function saveAllItems() {
  if (!activeRoomId) {
    setError("Please select a room first.");
    return;
  }

  setSavingAll(true);
  setError(null);

  try {
    const requests = [];

    selectedSections.forEach(sectionId => {
      const items = itemsBySection[sectionId] || [];

      items.forEach(item => {
        const state = itemState[item.id];

        // ONLY save completed items
        if (state?.intensityId) {
         requests.push(
  axios.post(`/consultations/${consultationId}/entries`, {
    room_id: activeRoomId,
    section_id: sectionId,
    item_id: item.id,
    intensity_id: state.intensityId,
    multiplier_ids: state.multiplierIds || [],
    notes: state.notes || "",
    quantity: state.quantity || 1,   // ⭐ NEW
  })
);

        }
      });
    });

    if (requests.length === 0) {
      setError("No completed items to save.");
      setSavingAll(false);
      return;
    }

    const results = await Promise.all(requests);

    results.forEach(res => onEntryCreated?.(res.data));

  } catch (err) {
    console.error(err);
    setError("Failed to save some items.");
  } finally {
    setSavingAll(false);
  }
}


async function hydrateFromEntries(entries) {
  // Determine active sections
  const sectionIds = [...new Set(entries.map(e => e.section_id))];
  setSelectedSections(sectionIds);

  // Load items
  const sectionResults = await Promise.all(
    sectionIds.map(id => axios.get(`/consultation/sections/${id}`))
  );

  const itemsMap = {};
  sectionResults.forEach((r, idx) => {
    itemsMap[sectionIds[idx]] = r.data.items || [];
  });
  setItemsBySection(itemsMap);

  // Build item state
  const hydratedItemState = {};
  entries.forEach(e => {
   hydratedItemState[e.item_id] = {
  intensityId: e.intensity_id,
  multiplierIds: e.multiplier_ids || [],
notes: e.notes || "",
  quantity: e.quantity || 1,   // ⭐ NEW
};

  });

  setItemState(hydratedItemState);
}

  /* ───────────────────────────────
     Render
     ─────────────────────────────── */
  return (
    <div className="space-y-6 pb-32 p-4 border rounded bg-white">
      <h3 className="text-xl font-semibold">Conduct Consultation</h3>
      <div className="text-sm text-gray-500">Logged in as {role}</div>
{/* ROOM MANAGEMENT */}
<div className="space-y-3 border-b pb-4">

  <div className="font-semibold text-slate-700">
    Rooms
  </div>

 <div className="flex gap-3 flex-wrap">
  {rooms.map(room => {
    const active = activeRoomId === room.id;

    return (
      <div
        key={room.id}
        className={`relative px-4 py-2 rounded-lg border shadow-sm transition
          ${active
            ? "bg-indigo-600 text-white border-indigo-600"
            : "bg-white hover:bg-indigo-50"}
        `}
      >
        <button
          onClick={() => setActiveRoomId(room.id)}
          className="text-left"
        >
          {/* ROOM NAME */}
          <div className="font-semibold">
            {room.label}
          </div>

          {/* SQ FT + MULTIPLIER */}
          <div className={`text-xs mt-0.5 ${active ? "text-indigo-100" : "text-slate-500"}`}>
            {room.square_feet
              ? `${room.square_feet} sq ft`
              : "No size entered"}
            {" • "}
            ×{room.sqft_multiplier} size factor
          </div>
        </button>

        {/* DELETE BUTTON */}
        <button
          onClick={() => deleteRoom(room.id)}
          className={`absolute top-1 right-1 text-xs opacity-70
            ${active
              ? "hover:text-red-200"
              : "hover:text-red-500"}
          `}
          title="Delete Room"
        >
          ✕
        </button>
      </div>
    );
  })}
</div>


  {/* Add Room */}
  <div className="flex gap-2">
    <input
      placeholder="Room name"
      value={newRoomLabel}
      onChange={e => setNewRoomLabel(e.target.value)}
      className="border rounded px-2 py-1 text-sm"
    />

    <input
      placeholder="Sq ft"
      value={newRoomSqft}
      onChange={e => setNewRoomSqft(e.target.value)}
      className="border rounded px-2 py-1 text-sm w-24"
    />

    <button
      onClick={createRoom}
      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
    >
      Add Room
    </button>
  </div>

</div>

      {/* Section selector */}
    <div className="space-y-2">
  <label className="text-sm font-semibold text-slate-600">
    Categories for this Room
  </label>

  <SectionMultiSelect
    sections={sections}
    values={selectedSections}
    onChange={handleSectionChange}
  />
</div>


      {/* Sections → Items */}
    {selectedSections.map(sectionId => {
  const section = sections.find(s => s.id === sectionId);

  return (
    <div
      key={sectionId}
      className="rounded-lg border bg-slate-50 p-5 space-y-5"
    >
      {/* SECTION HEADER */}
    <div className="flex items-center justify-between border-b pb-2">

  <h4 className="text-lg font-bold text-slate-800">
    {section?.name}
  </h4>

  <div className="flex items-center gap-3">
    <span className="text-xs text-slate-500">
      {itemsBySection[sectionId]?.length || 0} items
    </span>

    <button
      onClick={() => setCreatingItemFor(sectionId)}
      className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700"
    >
      + New Item
    </button>
  </div>
</div>
{creatingItemFor === sectionId && (
  <div className="relative rounded-2xl border shadow-lg overflow-hidden bg-white">

    {/* HEADER */}
    <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold flex items-center gap-2">
      ✨ Create New Item
    </div>

    {/* BODY */}
    <div className="p-4 space-y-4">

      {/* TITLE */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">
          Item Title
        </label>
        <input
          placeholder="Ex: Upholstery Cleaning"
          value={newItemTitle}
          onChange={e => setNewItemTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>

      {/* POINTS */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">
          Base Points
        </label>
        <input
          type="number"
          placeholder="1"
          value={newItemPoints}
          onChange={e => setNewItemPoints(e.target.value)}
          className="w-32 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>

      {/* NOTES */}
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">
          Notes / Instructions
        </label>
        <textarea
          placeholder="Optional details for cleaners..."
          value={newItemNotes}
          onChange={e => setNewItemNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
        />
      </div>

    </div>

    {/* FOOTER */}
    <div className="px-4 py-3 border-t bg-slate-50 flex justify-end gap-3">

      <button
        onClick={() => setCreatingItemFor(null)}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 hover:bg-gray-300"
      >
        Cancel
      </button>

      <button
        onClick={() => createNewItem(sectionId)}
        disabled={creatingItemLoading}
        className={`px-5 py-2 rounded-lg text-sm font-semibold shadow
          ${creatingItemLoading
            ? "bg-gray-300 text-gray-600"
            : "bg-indigo-600 text-white hover:bg-indigo-700"}
        `}
      >
        {creatingItemLoading ? "Creating…" : "Create Item"}
      </button>

    </div>
  </div>
)}


<div className="flex justify-end">
  <button
    onClick={saveAllItems}
    disabled={savingAll || !activeRoomId}
    className={`px-6 py-2 rounded font-semibold shadow
      ${savingAll
        ? "bg-gray-300 text-gray-600"
        : "bg-indigo-600 text-white hover:bg-indigo-700"}
    `}
  >
    {savingAll ? "Saving All…" : "💾 Save All Completed Items"}
  </button>
</div>

      {/* ITEMS GRID */}
      <div className="grid gap-4 md:grid-cols-2">
        {(itemsBySection[sectionId] || []).map(item => {
          const state = itemState[item.id] || {};
          const saving = savingItemId === item.id;

          return (
            <div
              key={item.id}
              className="rounded-lg border bg-white shadow-sm flex flex-col"
            >
              {/* ITEM HEADER */}
              <div className="px-4 py-3 border-b bg-gradient-to-r from-sky-50 to-indigo-50">
                <div className="flex justify-between items-center">
         <div className="font-semibold text-slate-800">
  {item.title}
  {state.quantity > 1 && (
    <span className="ml-2 text-xs text-indigo-600 font-semibold">
      × {state.quantity}
    </span>
  )}
</div>

                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {item.base_points} pts
                  </span>


                </div>                  {item.notes && (
  <div className="text-xs text-slate-500 mt-1">
    {item.notes}
  </div>
)}
              </div>

              {/* ITEM BODY */}
              <div className="p-4 space-y-4 flex-1">
                {/* QUANTITY */}
<div>
  <label className="block text-xs font-semibold text-slate-500 mb-1">
    Quantity
  </label>

  <QuantityStepper
    value={state.quantity || 1}
    onChange={(qty) =>
      updateItem(item.id, { quantity: qty })
    }
  />
</div>

                {/* INTENSITY */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Conditions
                  </label>
               <IntensitySelect
  value={state.intensityId}
  intensities={intensities}
  onChange={(id) =>
    updateItem(item.id, { intensityId: id })
  }
/>

                </div>

                {/* MULTIPLIERS */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    ✖️ Multipliers
                  </div>
                 <MultiMultiplierSelect
  values={state.multiplierIds || []}
  options={multipliers}
  onChange={(ids) =>
    updateItem(item.id, { multiplierIds: ids })
  }
/>

                </div>

                {/* NOTES */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    📝 Notes
                  </label>
                  <textarea
                    rows={2}
                    value={state.notes || ""}
                    onChange={e =>
                      updateItem(item.id, { notes: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              {/* ITEM FOOTER */}
              <div className="px-4 py-3 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => saveItem(sectionId, item)}
disabled={saving || !activeRoomId}
                  className={`px-4 py-1.5 rounded text-sm font-semibold transition
                    ${saving
                      ? "bg-gray-300 text-gray-600"
                      : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                >
                  {saving ? "Saving…" : "Save Item"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
})}


      {error && <div className="text-red-600 text-sm">{error}</div>}
    </div>
  );
}

function QuantityStepper({ value = 1, onChange }) {
  function decrease() {
    onChange(Math.max(1, value - 1));
  }

  function increase() {
    onChange(value + 1);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrease}
        className="w-8 h-8 rounded border bg-gray-100 hover:bg-gray-200"
      >
        −
      </button>

      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) =>
          onChange(Math.max(1, parseInt(e.target.value) || 1))
        }
        className="w-16 text-center border rounded px-1 py-1 text-sm"
      />

     <button
  type="button"
  onClick={increase}

        className="w-8 h-8 rounded border bg-gray-100 hover:bg-gray-200"
      >
        +
      </button>
    </div>
  );
}


function IntensitySelect({ value, onChange, intensities }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef();

  const selected = intensities.find(i => i.id === value);

  // CLOSE ON OUTSIDE CLICK
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = intensities.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">

      {/* INPUT WRAPPER */}
      <div className="relative">

        <input
          type="text"
          value={
            open
              ? search
              : selected
              ? `${selected.label} (×${selected.points})`
              : ""
          }
          onChange={e => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search intensity…"
          className="w-full border rounded px-2 py-1 pr-8"
        />

        {/* ⭐ CLEAR BUTTON */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);   // reset intensity
              setSearch("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-sm"
          >
            ✕
          </button>
        )}

      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow w-full max-h-48 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-2 text-gray-400 text-sm">
              No results
            </div>
          )}

          {filtered.map(i => (
            <div
              key={i.id}
              onClick={() => {
                onChange(i.id);
                setSearch("");
                setOpen(false);
              }}
              className="p-2 cursor-pointer hover:bg-indigo-50"
            >
              <div className="font-medium">{i.label}</div>
              <div className="text-xs text-gray-500">
                Multiplier ×{i.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




function MultiMultiplierSelect({
  values = [],
  onChange,
  options = []
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef();

  // ✅ CLOSE ON CLICK OUTSIDE
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id));
    } else {
      onChange([...values, id]);
    }
  }

  const selectedObjects = options.filter(o =>
    values.includes(o.id)
  );

  return (
    <div ref={ref} className="relative space-y-2">
      {/* CHIPS */}
      {selectedObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedObjects.map(o => (
            <div
              key={o.id}
              className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm"
            >
              {o.label} ×{o.multiplier}
              <button
                onClick={() => toggle(o.id)}
                className="text-xs hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT */}
      <input
        type="text"
        placeholder="Search multipliers..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full border rounded px-2 py-1"
      />

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow w-full max-h-56 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-2 text-gray-400 text-sm">
              No results
            </div>
          )}

          {filtered.map(o => {
            const selected = values.includes(o.id);

            return (
              <div
                key={o.id}
                onClick={() => toggle(o.id)}
                className={`p-2 cursor-pointer border-b last:border-none
                  ${selected
                    ? "bg-indigo-50 text-indigo-700"
                    : "hover:bg-gray-50"}
                `}
              >
                <div className="font-medium">{o.label}</div>
                <div className="text-xs text-gray-500">
                  Multiplier ×{o.multiplier}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionMultiSelect({ sections, values, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = React.useRef();

  useEffect(() => {
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = sections.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id) {
    if (values.includes(id)) {
      onChange(values.filter(v => v !== id));
    } else {
      onChange([...values, id]);
    }
  }

  const selectedObjects = sections.filter(s =>
    values.includes(s.id)
  );

  return (
    <div ref={ref} className="relative space-y-2">

      {/* CHIPS */}
      {selectedObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedObjects.map(s => (
            <div
              key={s.id}
              className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm flex items-center gap-2"
            >
              {s.name}
              <button
                onClick={() => toggle(s.id)}
                className="text-xs hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT */}
      <input
        type="text"
        placeholder="Search categories..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full border rounded px-2 py-1"
      />

      {/* DROPDOWN */}
      {open && (
        <div className="absolute z-50 bg-white border rounded shadow w-full max-h-56 overflow-y-auto">
          {filtered.map(s => {
            const selected = values.includes(s.id);

            return (
              <div
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`p-2 cursor-pointer border-b last:border-none
                  ${selected
                    ? "bg-indigo-50 text-indigo-700"
                    : "hover:bg-gray-50"}
                `}
              >
                {s.name}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
