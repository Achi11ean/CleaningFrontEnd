import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";

export default function CreateInventoryItem({ onCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);
const [categories, setCategories] = useState([]);
const [categoryInput, setCategoryInput] = useState("");
const [showCategoryInput, setShowCategoryInput] = useState(false);
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

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    image_url: "",
    total_inventory: 0,
  });

  const [staffRequirements, setStaffRequirements] = useState({});

  // 🔐 Only admin or manager allowed
  if (!axios || (role !== "admin" && role !== "manager")) {
    return null;
  }

  // 🔽 Load staff list
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await axios.get("/staff/all"); // 👈 adjust if needed
        setStaffList(res.data || []);
      } catch (err) {
        toast.error("Failed to load staff");
      }
    };

    loadStaff();
  }, [axios]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleStaffQtyChange = (staffId, qty) => {
    setStaffRequirements((prev) => ({
      ...prev,
      [staffId]: Number(qty),
    }));
  };

  const submit = async () => {
    if (!form.name || !form.category) {
      toast.error("Name and category are required");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        total_inventory: Number(form.total_inventory),
        staff_requirements: Object.entries(staffRequirements)
          .filter(([, qty]) => qty > 0)
          .map(([staff_id, required_quantity]) => ({
            staff_id: Number(staff_id),
            required_quantity,
          })),
      };

      const res = await axios.post("/inventory/items", payload);

      toast.success("Inventory item created");

      setForm({
        name: "",
        category: "",
        description: "",
        image_url: "",
        total_inventory: 0,
      });
      setCategoryInput("");
setShowCategoryInput(false);
      setStaffRequirements({});

      onCreated?.(res.data);
    } catch (err) {
      toast.error("Failed to create item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border p-6 bg-white space-y-4">
      <h2 className="text-xl font-bold">📦 Create Inventory Item</h2>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Item name"
        className="w-full border rounded p-2"
      />

{/* 📂 Category */}
<div className="space-y-2">
  <label className="text-sm font-semibold">Category</label>

  {!showCategoryInput ? (
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
      className="w-full border rounded p-2"
    >
      <option value="">Select category…</option>

      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}

      <option value="__new__">➕ Create new category</option>
    </select>
  ) : (
    <div className="flex gap-2">
      <input
        value={categoryInput}
        onChange={(e) => {
          setCategoryInput(e.target.value);
          setForm({ ...form, category: e.target.value });
        }}
        placeholder="New category name"
        className="flex-1 border rounded p-2"
      />

      <button
        type="button"
        onClick={() => {
          setShowCategoryInput(false);
          setCategoryInput("");
        }}
        className="px-3 rounded border bg-gray-100 hover:bg-gray-200"
      >
        Cancel
      </button>
    </div>
  )}
</div>


      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description (optional)"
        className="w-full border rounded p-2"
      />

      <input
        name="image_url"
        value={form.image_url}
        onChange={handleChange}
        placeholder="Image URL (optional)"
        className="w-full border rounded p-2"
      />

      <input
        type="number"
        name="total_inventory"
        value={form.total_inventory}
        onChange={handleChange}
        placeholder="Total inventory on hand"
        className="w-full border rounded p-2"
      />

      {/* 👥 Staff Requirements */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">👥 Staff Requirements</h3>

        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="flex items-center justify-between gap-4 mb-2"
          >
            <span className="text-sm font-medium">
              {staff.username}
            </span>

            <input
              type="number"
              min="0"
              value={staffRequirements[staff.id] || ""}
              onChange={(e) =>
                handleStaffQtyChange(staff.id, e.target.value)
              }
              placeholder="Qty"
              className="w-20 border rounded p-1 text-center"
            />
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
      >
        {loading ? "Creating..." : "Create Item"}
      </button>
    </div>
  );
}
