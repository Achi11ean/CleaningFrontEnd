import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { useStaffInventoryActions } from "./UseStaffInventoryActions";
import { toast } from "react-toastify";

export default function StaffInventoryOverview() {
  const { role, axios } = useAuthorizedAxios();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const { assign, returnItem } = useStaffInventoryActions(axios, setLoading);

  if (!axios || (role !== "admin" && role !== "manager")) {
    return null;
  }

  const load = async () => {
    try {
      const res = await axios.get("/inventory/staff");
      setData(res.data || []);
    } catch {
      toast.error("Failed to load staff inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [axios]);

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-500">
        Loading inventory…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(staff => (
        <div
          key={staff.staff_id}
          className="border rounded-lg p-4 bg-gray-50"
        >
          {/* Staff header */}
          <div className="flex items-center gap-3 mb-3">
            {staff.photo_url ? (
              <img
                src={staff.photo_url}
                alt={staff.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                {staff.display_name?.[0]?.toUpperCase()}
              </div>
            )}

            <div>
              <div className="font-semibold text-gray-800">
                {staff.display_name}
              </div>
              <div className="text-xs text-gray-500">
                @{staff.username}
              </div>
            </div>
          </div>

          {/* Inventory list */}
          {staff.items.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              No inventory assigned
            </div>
          ) : (
            <ul className="space-y-2">
              {staff.items.map(item => (
                <li
                  key={item.item_id}
                  className="flex items-center justify-between text-sm gap-2"
                >
                  <div className="flex items-center gap-2">
                    {item.item_image_url && (
                      <img
                        src={item.item_image_url}
                        alt={item.item_name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <span>{item.item_name}</span>
                  </div>

      <div className="flex items-center gap-3">
<div className="flex flex-col items-end text-xs">
  <span className="font-semibold text-sm">
    {item.quantity} / {item.required_quantity || 0}
  </span>

  <span
    className={
      item.quantity >= (item.required_quantity || 0)
        ? "text-green-600"
        : "text-yellow-600"
    }
  >
    {item.quantity >= (item.required_quantity || 0)
      ? "✓ Requirement met"
      : "Needs more"}
  </span>

  <span className="text-gray-400">
    {item.total_inventory} left total
  </span>
</div>


                    <button
                      onClick={async () => {
                        await assign({
                          itemId: item.item_id,
                          staffId: staff.staff_id,
                          quantity: 1,
                        });
                        load();
                      }}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                    >
                      +
                    </button>

                    <button
                      onClick={async () => {
                        await returnItem({
                          itemId: item.item_id,
                          staffId: staff.staff_id,
                          quantity: 1,
                        });
                        load();
                      }}
                      disabled={item.quantity <= 0}
                      className="px-2 py-1 text-xs bg-yellow-500 text-white rounded disabled:opacity-50"
                    >
                      −
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
