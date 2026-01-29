import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";

export default function ControlStaffInventory({  }) {
  const { role, axios } = useAuthorizedAxios();

  const [staffList, setStaffList] = useState([]);
  const [staffInventory, setStaffInventory] = useState({});
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
const [items, setItems] = useState([]);
const [selectedItemId, setSelectedItemId] = useState("");
const [selectedItem, setSelectedItem] = useState(null);

  // 🔐 Only admin or manager
  if (!axios || (role !== "admin" && role !== "manager")) {
    return null;
  }
  const getDisplayName = (staff) => {
  if (!staff) return "";
  const p = staff.profile;
  if (p && (p.first_name || p.last_name)) {
    return `${p.first_name || ""} ${p.last_name || ""}`.trim();
  }
  return staff.username;
};

useEffect(() => {
  const loadItems = async () => {
    try {
      const res = await axios.get("/inventory/items");
      setItems(res.data || []);
      
    } catch {
      toast.error("Failed to load inventory items");
    }
  };

  loadItems();
}, [axios]);

  // Load staff list
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await axios.get("/staff/all");
        setStaffList(res.data || []);
      } catch {
        toast.error("Failed to load staff");
      }
    };

    loadStaff();
  }, [axios]);

  // Load current staff inventory for this item
useEffect(() => {
  if (!selectedItemId) return;
setSelectedStaffId("");
setQuantity(0);
setStaffInventory({});
  if (!selectedItemId) {
    setSelectedItem(null);
    return;
  }
  const loadInventory = async () => {
    try {
      const res = await axios.get(
        `/inventory/items/${selectedItemId}`
      );

      setSelectedItem(res.data);

      const map = {};
      (res.data.staff_inventory || []).forEach(inv => {
        map[inv.staff_id] = inv.quantity;
      });

      setStaffInventory(map);
    } catch {
      toast.error("Failed to load item inventory");
    }
  };

  loadInventory();
}, [axios, selectedItemId]);


  const currentQty = staffInventory[selectedStaffId] || 0;

  const handleAssign = async () => {
    if (!selectedStaffId || quantity <= 0) {
      toast.error("Select staff and enter a quantity");
      return;
    }

    if (quantity > selectedItem.total_inventory) {
      toast.error("Not enough inventory available");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `/inventory/items/${selectedItem.id}/assign`,
        {
          staff_id: Number(selectedStaffId),
          quantity: Number(quantity),
        }
      );

      setStaffInventory((prev) => ({
        ...prev,
        [selectedStaffId]: (prev[selectedStaffId] || 0) + quantity,
      }));

setSelectedItem(prev => ({
  ...prev,
  total_inventory: res.data.item.total_inventory
}));
      setQuantity(0);

      toast.success("Inventory assigned");
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
    } finally {
      setLoading(false);
    }
  };
const selectedStaff = staffList.find(
  s => String(s.id) === String(selectedStaffId)
);

  const handleReturn = async () => {
    if (!selectedStaffId || quantity <= 0) {
      toast.error("Select staff and enter a quantity");
      return;
    }

    if (quantity > currentQty) {
      toast.error("Staff does not have that many items");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/inventory/items/${selectedItem.id}/return`,
        {
          staff_id: Number(selectedStaffId),
          quantity: Number(quantity),
        }
      );

      setStaffInventory((prev) => ({
        ...prev,
        [selectedStaffId]: prev[selectedStaffId] - quantity,
      }));

setSelectedItem(prev => ({
  ...prev,
  total_inventory: prev.total_inventory + quantity
}));
      setQuantity(0);

      toast.success("Inventory returned");
    } catch (err) {
      toast.error(err.response?.data?.error || "Return failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-white">
      <h3 className="font-bold text-lg">🧰 Control Staff Inventory</h3>

    
{selectedItem && (
  <div className="text-sm text-gray-600">
    Available inventory:{" "}
    <span className="font-semibold">
      {selectedItem.total_inventory}
    </span>
  </div>
)}

<select
  value={selectedItemId}
  onChange={(e) => setSelectedItemId(e.target.value)}
  className="w-full border rounded p-2"
>
  <option value="">Select inventory item…</option>
  {items.map(item => (
    <option key={item.id} value={item.id}>
      {item.name}
    </option>
  ))}
</select>
{!selectedItem && (
  <div className="text-gray-500 italic text-center py-6">
    Select an inventory item to manage staff assignments
  </div>
)}


{selectedItem && (
  <>
      <select
        value={selectedStaffId}
        onChange={(e) => setSelectedStaffId(e.target.value)}
        className="w-full border rounded p-2"
      >
        <option value="">Select staff member…</option>
        {staffList.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.username}
          </option>
        ))}
      </select>
{selectedStaff && (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
    {selectedStaff.profile?.photo_url ? (
      <img
        src={selectedStaff.profile.photo_url}
        alt={getDisplayName(selectedStaff)}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-700">
        {getDisplayName(selectedStaff)[0]?.toUpperCase()}
      </div>
    )}

    <div>
      <div className="font-semibold text-gray-800">
        {getDisplayName(selectedStaff)}
      </div>
      <div className="text-xs text-gray-500">
        @{selectedStaff.username}
      </div>
    </div>
  </div>
)}

      {selectedStaffId && (
        <div className="text-sm text-gray-500">
          Staff currently has:{" "}
          <span className="font-semibold">{currentQty}</span>
        </div>
      )}

      <input
        type="number"
        min="0"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        placeholder="Quantity"
        className="w-full border rounded p-2"
      />

      <div className="flex gap-2">
<button
  onClick={handleAssign}
  disabled={loading || !selectedStaffId || quantity <= 0}
  className="flex-1 bg-green-600 text-white py-2 rounded
             hover:bg-green-700 disabled:opacity-50"
>
  ➕ Assign
</button>

<button
  onClick={handleReturn}
  disabled={loading || !selectedStaffId || quantity <= 0}
  className="flex-1 bg-yellow-500 text-white py-2 rounded
             hover:bg-yellow-600 disabled:opacity-50"
>
  ↩️ Return
</button>

      </div>
      </>)}
    </div>
  );
}
