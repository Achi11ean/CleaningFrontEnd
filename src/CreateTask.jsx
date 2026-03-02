import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateTask({ onCreated }) {
  const { axios: authAxios } = useAuthorizedAxios();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [selected, setSelected] = useState([]); // assignments

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // 🔹 Load assignable users
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

  // 🔹 Toggle assignment
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

  // 🔹 Submit
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

    try {
      setLoading(true);
      setStatus(null);

      await authAxios.post("/tasks", {
        title,
        description,
        due_date: dueDate || null,
        assignments: selected,
      });

      setStatus("✅ Task created");

      setTitle("");
      setDescription("");
      setDueDate("");
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
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
        />

        {/* DESCRIPTION */}
        <textarea
          placeholder="Description (optional)"
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