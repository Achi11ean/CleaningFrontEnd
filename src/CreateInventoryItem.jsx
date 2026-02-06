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
  const [staffRequirements, setStaffRequirements] = useState({});
const CLOUD_NAME = "dcw0wqlse";       // your cloud
const UPLOAD_PRESET = "karaoke";     // unsigned preset
const [uploadingImage, setUploadingImage] = useState(false);
const uploadImageToCloudinary = async (file) => {
  if (!file) return;

  setUploadingImage(true);

  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();

    if (!json.secure_url) {
      throw new Error("Upload failed");
    }

    setForm((prev) => ({
      ...prev,
      image_url: json.secure_url,
    }));

    toast.success("Image uploaded");
  } catch (err) {
    console.error(err);
    toast.error("Image upload failed");
  } finally {
    setUploadingImage(false);
  }
};

const assignedTotal = Object.values(staffRequirements)
  .reduce((sum, qty) => sum + (Number(qty) || 0), 0);



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


  // 🔐 Only admin or manager allowed
  if (!axios || (role !== "admin" && role !== "manager")) {
    return null;
  }
const remainingInventory =
  Number(form.total_inventory || 0) - assignedTotal;
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
  const safeQty = Math.max(0, Number(qty) || 0);

  setStaffRequirements((prev) => ({
    ...prev,
    [staffId]: safeQty,
  }));
};

 const submit = async () => {
  if (!form.name || !form.category) {
    toast.error("Name and category are required");
    return;
  }

  if (Number(form.total_inventory) <= 0) {
    toast.error("Total inventory must be greater than 0");
    return;
  }

  if (assignedTotal > Number(form.total_inventory)) {
    toast.error(
      `Assigned quantity (${assignedTotal}) exceeds total inventory (${form.total_inventory})`
    );
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

<div className="space-y-2">
  <label className="text-sm font-semibold">
    Item Image
  </label>

  {/* 🌐 Paste Image URL */}
  <input
    name="image_url"
    value={form.image_url}
    onChange={(e) =>
      setForm((prev) => ({
        ...prev,
        image_url: e.target.value,
      }))
    }
    placeholder="Paste image URL (optional)"
    className="w-full border rounded p-2 text-sm"
  />

  <div className="text-center text-xs text-gray-400">
    — OR —
  </div>

  {/* ☁️ Upload Image */}
  <input
    type="file"
    accept="image/*"
    onChange={(e) =>
      uploadImageToCloudinary(e.target.files?.[0])
    }
    className="w-full text-sm"
  />

  {uploadingImage && (
    <p className="text-xs text-gray-500">
      Uploading image…
    </p>
  )}

  {/* 🖼️ Preview */}
  {form.image_url && (
    <div className="pt-2">
      <img
        src={form.image_url}
        alt="Preview"
        className="h-32 rounded-lg border object-cover"
      />

      <button
        type="button"
        onClick={() =>
          setForm((prev) => ({
            ...prev,
            image_url: "",
          }))
        }
        className="mt-2 text-xs text-red-600 hover:underline"
      >
        Remove image
      </button>
    </div>
  )}
</div>


      <input
        type="number"
        name="total_inventory"
        value={form.total_inventory}
        onChange={handleChange}
        placeholder="Total inventory on hand"
        className="w-full border rounded p-2"
      />
<p
  className={`text-sm ${
    remainingInventory < 0
      ? "text-red-600 font-semibold"
      : "text-gray-500"
  }`}
>
  Remaining inventory after assignment: {remainingInventory}
</p>

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
