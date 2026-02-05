import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";
import EditItemStaffRequirements from "./EditItemStaffRequirements";

export default function ManageInventory() {
  const { role, axios } = useAuthorizedAxios();

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
const [categories, setCategories] = useState([]);
const [showCategoryInput, setShowCategoryInput] = useState(false);
const [categoryInput, setCategoryInput] = useState("");
const [search, setSearch] = useState("");

useEffect(() => {
  const loadCategories = async () => {
    try {
      const res = await axios.get("/inventory/categories");
      setCategories(res.data || []);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  loadCategories();
}, [axios]);

  // 🔐 Only admin or manager
  if (!axios || (role !== "admin" && role !== "manager")) {
    return null;
  }

  const loadItems = async () => {
    try {
      const res = await axios.get("/inventory/items");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inventory");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

const startEdit = (item) => {
  setEditingId(item.id);
  setShowCategoryInput(false);
  setCategoryInput("");

  setForm({
    name: item.name,
    category: item.category,
    description: item.description || "",
    image_url: item.image_url || "",
    total_inventory: item.total_inventory,
  });
};

const cancelEdit = () => {
  setEditingId(null);
  setForm({});
  setShowCategoryInput(false);
  setCategoryInput("");
};


  const saveEdit = async (id) => {
    setLoading(true);
    try {
      await axios.put(`/inventory/items/${id}`, {
        ...form,
        total_inventory: Number(form.total_inventory),
      });
      toast.success("Inventory updated");
      setEditingId(null);

      loadItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update inventory");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    const ok = window.confirm("Delete this inventory item?");
    if (!ok) return;

    try {
      await axios.delete(`/inventory/items/${id}`);
      toast.success("Item deleted");
      loadItems();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    }
  };

const filteredItems = items.filter((item) => {
  const q = search.toLowerCase();

  return (
    item.name?.toLowerCase().includes(q) ||
    item.category?.toLowerCase().includes(q)
  );
});


return (
  <div className="space-y-8">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <h2 className="text-2xl font-extrabold text-emerald-800">
    🛠️ Manage Inventory
  </h2>

  <div className="relative w-full sm:w-72">
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search by item or category…"
      className="
        w-full rounded-xl border border-gray-300
        px-4 py-2 pl-10
        focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400
        transition
      "
    />
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      🔍
    </span>
  </div>
</div>


    {items.length === 0 && (
      <p className="text-gray-500 italic">No inventory items yet.</p>
    )}

    {/* 🔲 Card Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
{filteredItems.map((item) => {
        const isEditing = editingId === item.id;

        return (
          <div
            key={item.id}
            className="
              relative
              bg-white rounded-2xl p-6
              border border-gray-200
              shadow-md
              hover:shadow-xl hover:-translate-y-0.5
              transition-all
              ring-1 ring-transparent
              hover:ring-emerald-200
            "
          >
            {/* Header */}
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {item.category || "Uncategorized"}
                </p>
              </div>

              {/* Actions */}
              {!isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="px-3 py-1.5 text-sm font-semibold
                      bg-blue-100 text-blue-700 rounded-lg
                      hover:bg-blue-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-3 py-1.5 text-sm font-semibold
                      bg-red-100 text-red-700 rounded-lg
                      hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(item.id)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm font-semibold
                      bg-emerald-600 text-white rounded-lg
                      hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-sm font-semibold
                      bg-gray-200 text-gray-700 rounded-lg
                      hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Image */}
            {(isEditing ? form.image_url : item.image_url) && (
              <div className="mt-4 flex justify-center">
                <img
                  src={isEditing ? form.image_url : item.image_url}
                  alt={item.name}
                  className="max-h-40 object-contain rounded-xl border bg-gray-50"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Fields */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Name
                </label>
                {isEditing ? (
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    className="mt-1 w-full border rounded-lg p-2"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">{item.name}</p>
                )}
              </div>

              {/* Category */}
{/* Category */}
<div>
  <label className="text-xs font-semibold text-gray-500">
    Category
  </label>

  {!isEditing ? (
    <p className="mt-1 text-gray-800">
      {item.category || "—"}
    </p>
  ) : editingId === item.id && !showCategoryInput ? (
    <select
      value={form.category}
      onChange={(e) => {
        if (e.target.value === "__new__") {
          setShowCategoryInput(true);
          setForm({ ...form, category: "" });
        } else {
          setForm({ ...form, category: e.target.value });
        }
      }}
      className="
        mt-1 w-full border rounded-lg p-2
        focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400
      "
    >
      <option value="">Select category…</option>

      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}

      <option value="__new__">➕ Create new category</option>
    </select>
  ) : editingId === item.id && showCategoryInput ? (
    <div className="mt-1 flex gap-2">
      <input
        value={categoryInput}
        onChange={(e) => {
          setCategoryInput(e.target.value);
          setForm({ ...form, category: e.target.value });
        }}
        placeholder="New category name"
        className="
          flex-1 border rounded-lg p-2
          focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400
        "
      />
      <button
        type="button"
        onClick={() => {
          setShowCategoryInput(false);
          setCategoryInput("");
          setForm({ ...form, category: item.category || "" });
        }}
        className="px-3 rounded-lg border bg-gray-100 hover:bg-gray-200"
      >
        Cancel
      </button>
    </div>
  ) : null}
</div>


              {/* Image URL */}
              {isEditing && (
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500">
                    Image URL
                  </label>
                  <input
                    value={form.image_url || ""}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                    className="mt-1 w-full border rounded-lg p-2"
                  />
                </div>
              )}

              {/* Inventory */}
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Total Inventory
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={form.total_inventory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        total_inventory: e.target.value,
                      })
                    }
                    className="mt-1 w-full border rounded-lg p-2"
                  />
                ) : (
                  <p className="mt-1 text-gray-800">
                    {item.total_inventory}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-gray-500">
                Description
              </label>
              {isEditing ? (
                <textarea
                  value={form.description || ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full border rounded-lg p-2"
                />
              ) : (
                <p className="mt-1 text-gray-700 text-sm">
                  {item.description || "No description"}
                </p>
              )}
            </div>

            {/* Staff Requirements */}
            {isEditing && (
              <div className="mt-6 border-t pt-4">
                <EditItemStaffRequirements
                  axios={axios}
                  itemId={item.id}
                  initialRequirements={item.staff_requirements}
                  onSaved={loadItems}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

}
