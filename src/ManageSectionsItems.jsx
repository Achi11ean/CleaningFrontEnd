import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageSectionsItems() {
  const { role, axios } = useAuthorizedAxios();

  const [sections, setSections] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);

  /* ───────────────────────────────
     Load sections + items
     ─────────────────────────────── */
  useEffect(() => {
    if (!axios) return;

    async function load() {
      try {
        const res = await axios.get("/consultation/sections");

        const full = await Promise.all(
          res.data.map(async (s) => {
            const items = await axios.get(
              `/consultation/sections/${s.id}`
            );
            return { ...s, items: items.data.items || [] };
          })
        );

        setSections(full);
      } catch {
        setError("Failed to load sections");
      }
    }

    load();
  }, [axios]);

  /* ───────────────────────────────
     Helpers
     ─────────────────────────────── */
  const toggle = (id) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const isAdmin = role === "admin";

  /* ───────────────────────────────
     Save / Delete
     ─────────────────────────────── */
async function saveSection(id) {
  const res = await axios.patch(
    `/consultation/sections/${id}`,
    form
  );

  setSections((prev) =>
    prev.map((section) =>
      section.id === id
        ? {
            ...section,        // ✅ keep items
            ...res.data,       // ✅ update name/description
          }
        : section
    )
  );

  setEditingSection(null);
  setForm({});
}


async function saveItem(sectionId, itemId) {
  const res = await axios.patch(
    `/consultation/items/${itemId}`,
    form
  );

  setSections((prev) =>
    prev.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.map((item) =>
              item.id === itemId ? res.data : item
            ),
          }
        : section
    )
  );

  setEditingItem(null);
  setForm({});
}


  async function deleteSection(id) {
    if (!window.confirm("Delete this section and all items?")) return;
    await axios.delete(`/consultation/sections/${id}`);
    setSections((p) => p.filter((s) => s.id !== id));
  }

async function deleteItem(sectionId, itemId) {
  if (!window.confirm("Delete this item?")) return;

  await axios.delete(`/consultation/items/${itemId}`);

  setSections((prev) =>
    prev.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            items: section.items.filter(
              (item) => item.id !== itemId
            ),
          }
        : section
    )
  );
}


  if (!axios) return null;

  /* ───────────────────────────────
     Render
     ─────────────────────────────── */
  return (
    <div className="space-y-6 p-4 bg-white border rounded-lg">
      <h3 className="text-xl font-bold text-slate-800">
        🧩 Manage Sections & Items
      </h3>

      {error && <div className="text-red-600">{error}</div>}

      {sections.map((section) => (
        <div
          key={section.id}
          className="border rounded-lg overflow-hidden bg-slate-50"
        >
          {/* SECTION HEADER */}
          <div
            className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-indigo-50 to-sky-50 cursor-pointer"
            onClick={() => toggle(section.id)}
          >
            <div>
              <div className="font-semibold text-slate-800">
                📁 {section.name}
              </div>
              {section.description && (
                <div className="text-xs text-slate-500">
                  {section.description}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                {section.items.length} items
              </span>
              <span>{expanded[section.id] ? "▾" : "▸"}</span>
            </div>
          </div>

          {/* SECTION BODY */}
          {expanded[section.id] && (
            <div className="p-4 space-y-3 bg-white">
              {/* SECTION EDIT */}
              {editingSection === section.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full border rounded px-2 py-1"
                    value={form.name ?? section.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                  <textarea
                    rows={2}
                    className="w-full border rounded px-2 py-1"
                    value={form.description ?? section.description ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveSection(section.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSection(null)}
                      className="text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                isAdmin && (
                  <div className="flex gap-3 text-sm">
                    <button
                      onClick={() => {
                        setEditingSection(section.id);
                        setForm(section);
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Edit Section
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑 Delete Section
                    </button>
                  </div>
                )
              )}

              {/* ITEMS */}
              <div className="grid gap-3 md:grid-cols-2 pt-3">
                {section.items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded p-3 bg-slate-50"
                  >
                    {editingItem === item.id ? (
                      <>
                        <input
                          className="w-full border rounded px-2 py-1 mb-1"
                          value={form.title ?? item.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                        />
                        <input
                          type="number"
                          className="w-full border rounded px-2 py-1 mb-1"
                          value={form.base_points ?? item.base_points}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              base_points: +e.target.value,
                            })
                          }
                        />
                        <textarea
                          rows={2}
                          className="w-full border rounded px-2 py-1"
                          value={form.notes ?? item.notes ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                        />
                        <div className="flex gap-2 mt-2">
            <button
  onClick={() => saveItem(section.id, item.id)}
  className="bg-green-600 text-white px-3 py-1 rounded"
>
  Save
</button>

                          <button
                            onClick={() => setEditingItem(null)}
                            className="text-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <div className="font-medium">
                            {item.title}
                          </div>
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            {item.base_points} pts
                          </span>
                        </div>

                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.notes}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="flex gap-3 mt-2 text-sm">
                            <button
                              onClick={() => {
                                setEditingItem(item.id);
                                setForm(item);
                              }}
                              className="text-blue-600 hover:underline"
                            >
                              ✏️ Edit
                            </button>
                           <button
  onClick={() => deleteItem(section.id, item.id)}
  className="text-red-600 hover:underline"
>
  🗑 Delete
</button>

                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
