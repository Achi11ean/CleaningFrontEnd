import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ConductConsultation({ consultationId, onEntryCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [sections, setSections] = useState([]);
  const [intensities, setIntensities] = useState([]);
  const [multipliers, setMultipliers] = useState([]);

  const [selectedSections, setSelectedSections] = useState([]);
  const [itemsBySection, setItemsBySection] = useState({});
  const [itemState, setItemState] = useState({});

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
      const entries = res.data.entries || [];

      // 1️⃣ Determine active sections
      const sectionIds = [
        ...new Set(entries.map(e => e.section_id))
      ];
      setSelectedSections(sectionIds);

      // 2️⃣ Load items for those sections
      const sectionResults = await Promise.all(
        sectionIds.map(id =>
          axios.get(`/consultation/sections/${id}`)
        )
      );

      const itemsMap = {};
      sectionResults.forEach((r, idx) => {
        itemsMap[sectionIds[idx]] = r.data.items || [];
      });
      setItemsBySection(itemsMap);

      // 3️⃣ Build item state from existing entries
      const hydratedItemState = {};
      entries.forEach(e => {
        hydratedItemState[e.item_id] = {
          intensityId: e.intensity_id,
          multiplierIds: e.multiplier_ids || [],
          notes: e.notes || "",
        };
      });

      setItemState(hydratedItemState);

    } catch (err) {
      console.error(err);
      setError("Failed to load existing consultation data");
    }
  }

  loadExisting();
}, [consultationId, axios]);

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

  /* ───────────────────────────────
     Toggle section
     ─────────────────────────────── */
  async function toggleSection(sectionId) {
    if (selectedSections.includes(sectionId)) {
      setSelectedSections(prev => prev.filter(id => id !== sectionId));
      return;
    }

    setSelectedSections(prev => [...prev, sectionId]);

    if (!itemsBySection[sectionId]) {
      const res = await axios.get(`/consultation/sections/${sectionId}`);
      setItemsBySection(prev => ({
        ...prev,
        [sectionId]: res.data.items || []
      }));
    }
  }

  function updateItem(itemId, patch) {
    setItemState(prev => ({
      ...prev,
      [itemId]: {
        intensityId: null,
        multiplierIds: [],
        notes: "",
        ...prev[itemId],
        ...patch
      }
    }));
  }

  /* ───────────────────────────────
     Save single item
     ─────────────────────────────── */
  async function saveItem(sectionId, item) {
    const state = itemState[item.id];
    if (!state?.intensityId) {
      setError("Each item requires an intensity");
      return;
    }

    setSavingItemId(item.id);
    setError(null);

    try {
      const res = await axios.post(
        `/consultations/${consultationId}/entries`,
        {
          section_id: sectionId,
          item_id: item.id,
          intensity_id: state.intensityId,
          multiplier_ids: state.multiplierIds,
          notes: state.notes,
        }
      );

      onEntryCreated?.(res.data);
    } catch (err) {
      setError("Failed to save item");
    } finally {
      setSavingItemId(null);
    }
  }

  /* ───────────────────────────────
     Render
     ─────────────────────────────── */
  return (
    <div className="space-y-6 p-4 border rounded bg-white">
      <h3 className="text-xl font-semibold">Conduct Consultation</h3>
      <div className="text-sm text-gray-500">Logged in as {role}</div>

      {/* Section selector */}
      <div className="space-y-2">
        {sections.map(section => (
          <label key={section.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedSections.includes(section.id)}
              onChange={() => toggleSection(section.id)}
            />
            <span className="font-medium">{section.name}</span>
          </label>
        ))}
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
        <span className="text-xs text-slate-500">
          {itemsBySection[sectionId]?.length || 0} items
        </span>
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
                  </div>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                    {item.base_points} pts
                  </span>
                </div>
              </div>

              {/* ITEM BODY */}
              <div className="p-4 space-y-4 flex-1">
                {/* INTENSITY */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    🔥 Intensity
                  </label>
                  <select
                    value={state.intensityId || ""}
                    onChange={e =>
                      updateItem(item.id, { intensityId: +e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">Select intensity…</option>
                    {intensities.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.label} (×{i.points})
                      </option>
                    ))}
                  </select>
                </div>

                {/* MULTIPLIERS */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    ✖️ Multipliers
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {multipliers.map(m => {
                      const checked =
                        state.multiplierIds?.includes(m.id) || false;

                      return (
                        <label
                          key={m.id}
                          className={`flex items-center gap-2 text-sm rounded px-2 py-1 cursor-pointer border
                            ${checked
                              ? "bg-green-50 border-green-300 text-green-800"
                              : "bg-gray-50 border-gray-200"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? state.multiplierIds.filter(x => x !== m.id)
                                : [...(state.multiplierIds || []), m.id];
                              updateItem(item.id, { multiplierIds: next });
                            }}
                          />
                          {m.label} ×{m.multiplier}
                        </label>
                      );
                    })}
                  </div>
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
                  disabled={saving}
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
