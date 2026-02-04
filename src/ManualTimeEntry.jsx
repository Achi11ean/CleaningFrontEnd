import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import toast from "react-hot-toast";

export default function ManualTimeEntry() {
  const { authAxios } = useAdmin();
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    staff_id: "",
    clock_in_at: "",
    clock_out_at: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load staff list on mount
    const loadStaff = async () => {
      try {
        const res = await authAxios.get("/staff/all");
        setStaffList(res.data);
      } catch (err) {
        toast.error("Failed to load staff list");
      }
    };
    loadStaff();
  }, [authAxios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.staff_id || !form.clock_in_at || !form.clock_out_at) {
      toast.error("Please complete all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAxios.post("/admin/staff-time-entry", form);
      toast.success("Time entry added successfully!");
      // Reset form
      setForm({ staff_id: "", clock_in_at: "", clock_out_at: "" });
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to create time entry.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-xl mx-auto mt-8 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        ➕ Manual Time Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Staff Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Staff Member
          </label>
          <select
            name="staff_id"
            value={form.staff_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.profile?.first_name && s.profile?.last_name
                  ? `${s.profile.first_name} ${s.profile.last_name}`
                  : s.username}
              </option>
            ))}
          </select>
        </div>

        {/* Clock In */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clock In Time
          </label>
          <input
            type="datetime-local"
            name="clock_in_at"
            value={form.clock_in_at}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Clock Out */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clock Out Time
          </label>
          <input
            type="datetime-local"
            name="clock_out_at"
            value={form.clock_out_at}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-semibold py-2 px-4 rounded hover:bg-emerald-700 transition"
        >
          {loading ? "Saving..." : "Create Time Entry"}
        </button>
      </form>
    </div>
  );
}
