import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function TodayTasksSlider() {

  const { axios: authAxios } = useAuthorizedAxios();

  const [myTasks, setMyTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState(null);

  /* ================= LOAD ================= */

  const loadData = async () => {
    try {
      const res = await authAxios.get("/tasks/my");
      setMyTasks(res.data || []);
    } catch (err) {
      console.error("Failed loading today tasks", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= FILTER TODAY ================= */

const todayTasks = useMemo(() => {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayStr);

  const overdue = [];
  const today = [];
  const completedToday = [];

  myTasks.forEach(a => {
    const due = a.task?.due_date;
    if (!due) return;

    const dueDate = new Date(due);

    // OVERDUE (incomplete only)
    if (!a.completed && dueDate < todayDate) {
      overdue.push(a);
    }

    // DUE TODAY
    if (due === todayStr) {
      if (a.completed) {
        completedToday.push(a);
      } else {
        today.push(a);
      }
    }
  });

  return [
    ...overdue,
    ...today,
    ...completedToday
  ];
}, [myTasks]);
  /* ================= TOGGLE ================= */

  const toggleAssignment = async (id) => {
    try {
      const res = await authAxios.patch(`/tasks/assignment/${id}/toggle`);
      const updated = res.data;

      setMyTasks(prev =>
        prev.map(a =>
          a.id === id
            ? { ...a, completed: updated.completed }
            : a
        )
      );

    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  /* ================= AUTOSAVE ================= */

  const autoSaveTask = async (taskId, fields) => {
    try {
      setSavingTaskId(taskId);

      await authAxios.patch(`/tasks/${taskId}`, fields);

      setMyTasks(prev =>
        prev.map(a =>
          a.task?.id === taskId
            ? { ...a, task: { ...a.task, ...fields } }
            : a
        )
      );

    } catch (err) {
      console.error("Autosave failed", err);
    } finally {
      setSavingTaskId(null);
    }
  };

  /* ================= DELETE ================= */

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task permanently?")) return;

    try {
      await authAxios.delete(`/tasks/${taskId}`);
      loadData();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  /* ================= SAVE EDIT ================= */

const saveEdit = async () => {
  try {
    const payload = {
      title: editingTask.title,
      description: editingTask.description,
      due_date: editingTask.due_date || null,
    };

    await authAxios.patch(`/tasks/${editingTask.id}`, payload);

    setEditingTask(null);
    loadData();
  } catch (err) {
    console.error("Edit failed", err);
  }
};

  /* ================= UI ================= */

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-700">
          🔥 Today's Tasks
        </h2>

        <span className="text-xs bg-white px-3 py-1 rounded-full shadow border text-slate-500">
          {todayTasks.length}
        </span>
      </div>

      {/* Horizontal Slider */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">

        {todayTasks.map((a) => (
          <div
            key={a.id}
            className={`
              min-w-[280px] max-w-[280px]
              snap-start
              relative p-4 rounded-2xl shadow-md border
              ${a.completed
                ? "bg-emerald-50 border-emerald-200"
                : "bg-yellow-50 border-yellow-200"}
            `}
          >

            {/* Toggle + Actions */}
            <div className="flex justify-between items-start mb-3 mt-2">

              <button
                onClick={() => toggleAssignment(a.id)}
                className={`
                  h-5 w-5 rounded-full border flex items-center justify-center
                  ${
                    a.completed
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-slate-400"
                  }
                `}
              >
                {a.completed && <span className="text-[11px]">✓</span>}
              </button>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setEditingTask(a.task)}
                  className="text-blue-500"
                >
                  ✏️
                </button>

                <button
                  onClick={() => deleteTask(a.task.id)}
                  className="text-rose-500"
                >
                  🗑
                </button>
              </div>
            </div>

            {/* Title */}
            <textarea
              rows={2}
              value={a.task?.title || ""}
              onChange={(e) =>
                setMyTasks(prev =>
                  prev.map(item =>
                    item.id === a.id
                      ? {
                          ...item,
                          task: { ...item.task, title: e.target.value }
                        }
                      : item
                  )
                )
              }
              onBlur={() =>
                autoSaveTask(a.task.id, { title: a.task.title })
              }
              className={`
                font-semibold text-sm bg-transparent outline-none
                w-full resize-none whitespace-pre-wrap break-words
                mb-2
                ${
                  a.completed
                    ? "line-through text-slate-400"
                    : "text-slate-700"
                }
              `}
            />

            {/* Description */}
            <textarea
              rows={3}
              value={a.task?.description || ""}
              onChange={(e) =>
                setMyTasks(prev =>
                  prev.map(item =>
                    item.id === a.id
                      ? {
                          ...item,
                          task: { ...item.task, description: e.target.value }
                        }
                      : item
                  )
                )
              }
              onBlur={() =>
                autoSaveTask(a.task.id, { description: a.task.description })
              }
              className="text-sm text-slate-500 bg-transparent outline-none w-full resize-none"
            />
{/* Due Date Footer */}
{a.task?.due_date && (
  <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] flex justify-between items-center">

    <span
      className={`
        ${
          !a.completed &&
          new Date(a.task.due_date) < new Date().setHours(0,0,0,0)
            ? "text-rose-600 font-semibold"
            : a.completed
            ? "text-slate-400 line-through"
            : "text-slate-500"
        }
      `}
    >
      📅 {new Date(a.task.due_date).toLocaleDateString()}
    </span>

  </div>
)}
            {savingTaskId === a.task.id && (
              <div className="text-[10px] text-slate-400 mt-1">
                Saving...
              </div>
            )}

          </div>
        ))}

        {todayTasks.length === 0 && (
          <div className="min-w-full text-center text-slate-400 py-10">
            🎉 Nothing due today
          </div>
        )}

      </div>

      {/* EDIT MODAL */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">

            <h3 className="text-lg font-bold">Edit Task</h3>

            <input
              value={editingTask.title}
              onChange={(e) =>
                setEditingTask({ ...editingTask, title: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <textarea
              value={editingTask.description}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  description: e.target.value
                })
              }
              className="w-full border p-2 rounded"
            />
<input
  type="date"
  value={editingTask.due_date || ""}
  onChange={(e) =>
    setEditingTask({
      ...editingTask,
      due_date: e.target.value || null
    })
  }
  className="w-full border p-2 rounded"
/>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTask(null)}>
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}