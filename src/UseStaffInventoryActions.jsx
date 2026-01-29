import { toast } from "react-toastify";

export function useStaffInventoryActions(axios, setLoading) {
  const assign = async ({ itemId, staffId, quantity }) => {
    if (!staffId || quantity <= 0) {
      toast.error("Invalid assignment");
      return null;
    }

    try {
      const res = await axios.post(
        `/inventory/items/${itemId}/assign`,
        {
          staff_id: Number(staffId),
          quantity: Number(quantity),
        }
      );
      toast.success("Inventory assigned");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Assignment failed");
      return null;
    }
  };

  const returnItem = async ({ itemId, staffId, quantity }) => {
    if (!staffId || quantity <= 0) {
      toast.error("Invalid return");
      return null;
    }

    try {
      const res = await axios.post(
        `/inventory/items/${itemId}/return`,
        {
          staff_id: Number(staffId),
          quantity: Number(quantity),
        }
      );
      toast.success("Inventory returned");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || "Return failed");
      return null;
    }
  };

  return { assign, returnItem };
}
