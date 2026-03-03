import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateTask({ onCreated }) {
  const { axios: authAxios } = useAuthorizedAxios();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [repeatType, setRepeatType] = useState("none");
  const [repeatInterval, setRepeatInterval] = useState(1);

  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [selected, setSelected] = useState([]);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [staffRes, adminRes] = await Promise.all([
          authAxios.get("/staff/all"),
          authAxios.get("/admin/all"),
        ]);

        setStaff(staffRes.data || []);
        setAdmins(adminRes.data || []);
      } catch (err) {
        console.error("Failed loading users", err);
      }
    };

    loadUsers();
  }, []);

  const toggleAssign = (owner_type, owner_id) => {
    const exists = selected.find(
      (a) => a.owner_type === owner_type && a.owner_id === owner_id
    );

    if (exists) {
      setSelected((prev) =>
        prev.filter(
          (a) =>
            !(a.owner_type === owner_type && a.owner_id === owner_id)
        )
      );
    } else {
      setSelected((prev) => [...prev, { owner_type, owner_id }]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatus("Title required");
      return;
    }

    if (selected.length === 0) {
      setStatus("Select at least one assignee");
      return;
    }

    if (repeatType !== "none" && !dueDate) {
      setStatus("Recurring tasks require a due date");
      return;
    }

    try {
      setLoading(true);
      setStatus(null);

      await authAxios.post("/tasks", {
        title,
        description,
        due_date: dueDate || null,
        repeat_type: repeatType,
        repeat_interval: repeatInterval,
        assignments: selected,
      });

      setStatus("✅ Task created");

      setTitle("");
      setDescription("");
      setDueDate("");
      setRepeatType("none");
      setRepeatInterval(1);
      setSelected([]);

      onCreated?.();
    } catch (err) {
      setStatus(err.response?.data?.error || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (type, id) =>
    selected.some((a) => a.owner_type === type && a.owner_id === id);

  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📝 Create Task</h2>

      <form onSubmit={submit} className="space-y-4">

        {/* TITLE */}
        <input
          placeholder="Task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
        />

        {/* DESCRIPTION */}
        <textarea
          placeholder="Details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2"
        />

        {/* DUE DATE */}
        <div>
          <label className="text-sm font-semibold">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {/* REPEAT OPTIONS */}
       {/* REPEAT OPTIONS */}
<div className="border rounded p-4 bg-gray-50 space-y-3">
  <label className="font-semibold block">Repeat</label>

  <select
    value={repeatType}
    onChange={(e) => {
      const value = e.target.value;

      // Presets
      if (value === "biweekly") {
        setRepeatType("weekly");
        setRepeatInterval(2);
      } else if (value === "quarterly") {
        setRepeatType("monthly");
        setRepeatInterval(3);
      } else if (value === "semiannual") {
        setRepeatType("monthly");
        setRepeatInterval(6);
      } else if (value === "annual") {
        setRepeatType("monthly");
        setRepeatInterval(12);
      } else {
        setRepeatType(value);
        setRepeatInterval(1);
      }
    }}
    className="w-full border rounded p-2"
  >
    <option value="none">Does not repeat</option>
    <option value="daily">Daily</option>
    <option value="weekly">Weekly</option>
    <option value="biweekly">Bi-Weekly</option>
    <option value="monthly">Monthly</option>
    <option value="quarterly">Quarterly</option>
    <option value="semiannual">Semi-Annually</option>
    <option value="annual">Annually</option>
  </select>

  {/* Show interval only for basic daily/weekly/monthly */}
  {["daily", "weekly", "monthly"].includes(repeatType) && (
    <div className="flex items-center gap-2">
      <span>Every</span>
      <input
        type="number"
        min="1"
        value={repeatInterval}
        onChange={(e) =>
          setRepeatInterval(parseInt(e.target.value) || 1)
        }
        className="w-20 border rounded p-2"
      />
      <span>
        {repeatType === "daily"
          ? "day(s)"
          : repeatType === "weekly"
          ? "week(s)"
          : "month(s)"}
      </span>
    </div>
  )}
</div>
      

        {/* ASSIGNMENTS */}
        <div>
          <label className="font-semibold mb-2 block">
            Assign To
          </label>

          <div className="space-y-4">

            {/* ADMINS */}
            <div>
              <div className="text-sm font-semibold mb-1 text-gray-600">
                Admins
              </div>

              <div className="flex flex-wrap gap-2">
                {admins.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAssign("admin", a.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      isSelected("admin", a.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {a.profile?.first_name || a.username}
                  </button>
                ))}
              </div>
            </div>

            {/* STAFF */}
            <div>
              <div className="text-sm font-semibold mb-1 text-gray-600">
                Staff
              </div>

              <div className="flex flex-wrap gap-2">
                {staff.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleAssign("staff", s.id)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      isSelected("staff", s.id)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {s.profile?.first_name || s.username}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex items-center gap-4">
          <button
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Saving..." : "Create Task"}
          </button>

          {status && (
            <span className="text-sm font-semibold">{status}</span>
          )}
        </div>
      </form>
    </div>
  );
}