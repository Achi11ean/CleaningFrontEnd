import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import { toast } from "react-toastify";

export default function MyInventory() {
  const { staff, authAxios } = useStaff();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authAxios.get("/staff/inventory");
      setItems(res.data.items || []); // ✅ DIRECT
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const useItem = async (itemId) => {
    try {
      await authAxios.post("/staff/inventory/use", {
        item_id: itemId,
        quantity: 1,
      });

      toast.success("Item marked as used");
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to use item"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-500">
        Loading your inventory…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        You don’t have any assigned inventory yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        const met = item.quantity >= item.required_quantity;

        return (
          <div
            key={item.item_id}
            className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
          >
            {/* Item info */}
            <div className="flex items-center gap-3">
              {item.item_image_url ? (
                <img
                  src={item.item_image_url}
                  alt={item.item_name}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-300 flex items-center justify-center text-xs font-bold">
                  {item.item_name[0]}
                </div>
              )}

              <div>
                <div className="font-semibold text-gray-800">
                  {item.item_name}
                </div>

                <div className="text-xs text-gray-500">
                  {item.quantity} / {item.required_quantity} required
                </div>

                <div
                  className={`text-xs ${
                    met ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {met ? "✓ Requirement met" : "Needs more"}
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => useItem(item.item_id)}
              disabled={item.quantity <= 0}
              className="px-3 py-1 text-xs bg-red-600 text-white rounded
                         hover:bg-red-700 disabled:opacity-50"
            >
              🧹 Remove (1)
            </button>
          </div>
        );
      })}
    </div>
  );
}
