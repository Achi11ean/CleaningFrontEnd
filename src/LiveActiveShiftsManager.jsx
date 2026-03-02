import { useEffect, useState } from "react";
import { useStaff } from "./StaffContext";
import { format } from "date-fns";

export default function LiveActiveShiftsManager() {
  const { authAxios } = useStaff();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState({});
  const [imageMap, setImageMap] = useState({});

  const loadShifts = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/admin/shifts/active/all");
      setShifts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const forceCheckout = async (shiftId) => {
    try {
      await authAxios.post(`/admin/shifts/${shiftId}/force-checkout`, {
        image_urls: imageMap[shiftId] || [],
        message: noteMap[shiftId] || null,
      });

      loadShifts();
    } catch (err) {
      console.error(err);
      alert("Failed to force checkout");
    }
  };

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
                Checked in:
                {" "}
                {format(
                  new Date(shift.check_in_at),
                  "MMM d • h:mm a"
                )}
              </p>
            </div>

            {/* NOTES INPUT */}
            <textarea
              placeholder="Add checkout note..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              value={noteMap[shift.id] || ""}
              onChange={(e) =>
                setNoteMap({
                  ...noteMap,
                  [shift.id]: e.target.value,
                })
              }
            />

            {/* IMAGE URL INPUT */}
            <input
              type="text"
              placeholder="Add image URL (optional)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={(imageMap[shift.id] || [])[0] || ""}
              onChange={(e) =>
                setImageMap({
                  ...imageMap,
                  [shift.id]: [e.target.value],
                })
              }
            />

            {/* BUTTON */}
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