import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function LiveActiveShiftsManager() {
  const { role, axios } = useAuthorizedAxios();

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState({});
  const [imageMap, setImageMap] = useState({});

  const loadShifts = async () => {
    if (!axios) return;

    try {
      setLoading(true);
      const res = await axios.get("/admin/shifts/active/all");
      setShifts(res.data || []);
    } catch (err) {
      console.error("Failed to load active shifts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, [axios]);

  const forceCheckout = async (shiftId) => {
    if (!axios) return;

    try {
      await axios.post(`/admin/shifts/${shiftId}/force-checkout`, {
        image_urls: imageMap[shiftId] || [],
        message: noteMap[shiftId] || null,
      });

      loadShifts();
    } catch (err) {
      console.error(err);
      alert("Failed to force checkout");
    }
  };

  // 🚫 Not authorized
  if (!role || (role !== "admin" && role !== "manager")) {
    return null;
  }

  if (loading) {
    return <p className="text-gray-500">Loading active shifts...</p>;
  }

  if (!shifts.length) {
    return (
      <div className="bg-gray-50 border rounded-xl p-4 text-gray-600 italic">
        No active shifts right now.
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      {shifts.map((shift) => {
        const profile = shift.profile;

        const fullName =
          profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : shift.owner_type === "staff"
            ? "Staff Member"
            : "Admin";

        return (
          <div
            key={shift.id}
            className="bg-white rounded-2xl shadow-md border p-5 space-y-4"
          >
            {/* USER HEADER */}
            <div className="flex items-center gap-4">
              <img
                src={
                  profile?.photo_url ||
                  "https://via.placeholder.com/60"
                }
                alt="profile"
                className="w-14 h-14 rounded-full object-cover border"
              />

              <div>
                <p className="font-bold text-lg">{fullName}</p>
                <p className="text-sm text-gray-500 capitalize">
                  {shift.owner_type}
                </p>
              </div>
            </div>

            {/* CLIENT */}
            <div>
              <p className="font-semibold text-gray-800">
                {shift.client?.first_name} {shift.client?.last_name}
              </p>

              <p className="text-sm text-gray-500">
                Checked in{" "}
                {format(new Date(shift.check_in_at), "MMM d • h:mm a")}
              </p>
            </div>

            {/* NOTES */}
            <textarea
              placeholder="Add checkout note..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={noteMap[shift.id] || ""}
              onChange={(e) =>
                setNoteMap((prev) => ({
                  ...prev,
                  [shift.id]: e.target.value,
                }))
              }
            />

            {/* IMAGE URL */}
            <input
              type="text"
              placeholder="Add image URL (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={(imageMap[shift.id] || [])[0] || ""}
              onChange={(e) =>
                setImageMap((prev) => ({
                  ...prev,
                  [shift.id]: [e.target.value],
                }))
              }
            />

            {/* ACTION */}
            <button
              onClick={() => forceCheckout(shift.id)}
              className="w-full bg-red-600 text-white py-2 rounded-xl font-semibold hover:bg-red-700 transition"
            >
              ⏹ Force Checkout
            </button>
          </div>
        );
      })}
    </div>
  );
}