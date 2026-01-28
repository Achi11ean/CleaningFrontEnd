import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function EditItemStaffRequirements({
  axios,
  itemId,
  initialRequirements = [],
    onSaved,   // 👈 add this

}) {
  const [staff, setStaff] = useState([]);
  const [requirements, setRequirements] = useState({});
  const [loading, setLoading] = useState(false);

  // Normalize existing requirements into map
  useEffect(() => {
    const map = {};
    initialRequirements.forEach((r) => {
      map[r.staff_id] = r.required_quantity;
    });
    setRequirements(map);
  }, [initialRequirements]);

  // Load all staff
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await axios.get("/staff/all");
        setStaff(res.data || []);
      } catch {
        toast.error("Failed to load staff list");
      }
    };

    loadStaff();
  }, [axios]);

  const updateQty = (staffId, qty) => {
    setRequirements((prev) => ({
      ...prev,
      [staffId]: Number(qty),
    }));
  };

const save = async () => {
  setLoading(true);
  try {
    await axios.put(`/inventory/items/${itemId}/staff-requirements`, {
      staff_requirements: Object.entries(requirements)
        .filter(([, qty]) => qty > 0)
        .map(([staff_id, required_quantity]) => ({
          staff_id: Number(staff_id),
          required_quantity,
        })),
    });

    toast.success("Staff requirements updated");
    onSaved?.(); // ✅ refresh inventory list
  } catch (err) {
    console.error(err);
    toast.error("Failed to update staff requirements");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="border-t pt-4 space-y-3">
      <h4 className="text-sm font-semibold">👥 Staff Requirements</h4>

      {staff.map((s) => (
        <div
          key={s.id}
          className="flex items-center justify-between gap-4"
        >
          <span className="text-sm">{s.username}</span>

          <input
            type="number"
            min="0"
            value={requirements[s.id] || ""}
            onChange={(e) => updateQty(s.id, e.target.value)}
            className="w-20 border rounded p-1 text-center"
            placeholder="Qty"
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={loading}
        className="px-3 py-1 text-sm bg-black text-white rounded hover:bg-gray-800"
      >
        {loading ? "Saving…" : "Save Staff Requirements"}
      </button>
    </div>
  );
}
