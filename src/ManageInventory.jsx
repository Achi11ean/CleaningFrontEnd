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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">🛠️ Manage Inventory</h2>

      {items.length === 0 && (
        <p className="text-gray-500 italic">No inventory items yet.</p>
      )}

      {items.map((item) => {
        const isEditing = editingId === item.id;

        return (
          <div
            key={item.id}
            className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {item.name}
              </h3>
{/* 📸 Image Preview */}
{(isEditing ? form.image_url : item.image_url) && (
  <div className="flex justify-center">
    <img
      src={isEditing ? form.image_url : item.image_url}
      alt={item.name}
      className="max-h-40 object-contain rounded border bg-gray-50"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  </div>
)}


              {!isEditing ? (
                <div className="space-x-2">
                  <button
                    onClick={() => startEdit(item)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => saveEdit(item.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Editable fields */}
            <div className="grid md:grid-cols-2 gap-3">
              <input
                disabled={!isEditing}
                value={isEditing ? form.name : item.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="border rounded p-2"
                placeholder="Name"
              />

              <input
                disabled={!isEditing}
                value={isEditing ? form.category : item.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border rounded p-2"
                placeholder="Category"
              />

              <input
                disabled={!isEditing}
                value={isEditing ? form.image_url : item.image_url || ""}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                className="border rounded p-2"
                placeholder="Image URL"
              />

              <input
                type="number"
                disabled={!isEditing}
                value={
                  isEditing
                    ? form.total_inventory
                    : item.total_inventory
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_inventory: e.target.value,
                  })
                }
                className="border rounded p-2"
                placeholder="Total Inventory"
              />
            </div>

            <textarea
              disabled={!isEditing}
              value={isEditing ? form.description : item.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="border rounded p-2 w-full"
              placeholder="Description"
            />

            {/* Staff Requirements (read-only here) */}
         {isEditing && (
  <EditItemStaffRequirements
    axios={axios}
    itemId={item.id}
    initialRequirements={item.staff_requirements}
        onSaved={loadItems}   // 👈 THIS

  />
)}

          </div>
        );
      })}
    </div>
  );
}
