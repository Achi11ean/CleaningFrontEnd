// ArchivedTasks.jsx
import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ArchivedTasks({ onClose }) {
  const { axios: authAxios } = useAuthorizedAxios();
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchived();
  }, []);

  const loadArchived = async () => {
    try {
      const res = await authAxios.get("/tasks/archived");
      setArchivedTasks(res.data || []);
    } catch (err) {
      console.error("Failed loading archived tasks", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow border border-slate-200 p-6">
      
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-700">
          🗄 Archived Tasks
        </h3>

        <button
          onClick={onClose}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      {loading && (
        <div className="text-sm text-slate-400">Loading archived tasks...</div>
      )}

      {!loading && archivedTasks.length === 0 && (
        <div className="text-sm text-slate-400">
          No archived tasks.
        </div>
      )}

      <div className="space-y-4">
        {archivedTasks.map(task => (
          <div
            key={task.id}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200"
          >
            <div className="font-semibold text-slate-700">
              {task.title}
            </div>

            {task.description && (
              <div className="text-sm text-slate-500 mt-1">
                {task.description}
              </div>
            )}

            <div className="text-xs text-slate-400 mt-2">
              Due: {formatDate(task.due_date)}
            </div>

            {task.repeat_type !== "none" && (
              <div className="text-xs text-purple-500 mt-1">
                🔁 Repeated every {task.repeat_interval} {task.repeat_type}
              </div>
            )}

            <div className="mt-2 text-xs text-slate-400">
              {task.assignments.length} assignments
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}