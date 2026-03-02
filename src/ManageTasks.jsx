import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function ManageTasks() {
const { axios: authAxios, role } = useAuthorizedAxios();

const [myTasks, setMyTasks] = useState([]);
const [allTasks, setAllTasks] = useState([]);

const [loading, setLoading] = useState(true);

const isManager = role === "admin" || role === "manager";

/* ================= LOAD DATA ================= */

const loadData = async () => {
try {
setLoading(true);


  const myRes = await authAxios.get("/tasks/my");
  setMyTasks(myRes.data || []);

  if (isManager) {
    const allRes = await authAxios.get("/tasks/all");
    setAllTasks(allRes.data || []);
  }
} catch (err) {
  console.error("Failed loading tasks", err);
} finally {
  setLoading(false);
}


};

useEffect(() => {
loadData();
}, []);

/* ================= COMPLETE ================= */

const completeAssignment = async (id, override = false) => {
try {
const url = override
? `/tasks/assignment/${id}/complete/override`
: `/tasks/assignment/${id}/complete`;


  await authAxios.patch(url);

  loadData();
} catch (err) {
  console.error("Failed completing", err);
}


};

/* ================= EDIT TASK ================= */

const [editingTask, setEditingTask] = useState(null);

const saveEdit = async () => {
try {
await authAxios.patch(`/tasks/${editingTask.id}`, editingTask);
setEditingTask(null);
loadData();
} catch (err) {
console.error("Failed updating task", err);
}
};

/* ================= HELPERS ================= */

const formatDate = (d) => {
if (!d) return "—";
const date = new Date(d);
return date.toLocaleDateString();
};

/* ================= UI ================= */

if (loading) return <div className="p-6">Loading tasks...</div>;

return ( <div className="max-w-6xl mx-auto p-6 space-y-8">


  {/* ================= MY TASKS ================= */}
  <div>
    <h2 className="text-2xl font-bold mb-4">✅ My Tasks</h2>

    <div className="space-y-3">
      {myTasks.map((a) => (
        <div key={a.id} className="border rounded-lg p-4 bg-white shadow">

          <div className="flex justify-between">

            <div>
              <div className="font-semibold text-lg">
                {a.task.title}
              </div>

              <div className="text-sm text-gray-600">
                {a.task.description}
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Due: {formatDate(a.task.due_date)}
              </div>
            </div>

            <button
              disabled={a.completed}
              onClick={() => completeAssignment(a.id)}
              className={`px-4 py-2 rounded ${
                a.completed
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {a.completed ? "✔ Done" : "Mark Done"}
            </button>

          </div>
        </div>
      ))}
    </div>
  </div>

  {/* ================= ALL TASKS ================= */}
  {isManager && (
    <div>
      <h2 className="text-2xl font-bold mb-4">📋 All Tasks</h2>

      <div className="space-y-4">
        {allTasks.map((task) => (
          <div key={task.id} className="border rounded-xl p-4 bg-gray-50">

            <div className="flex justify-between">

              <div>
                <div className="font-bold text-lg">
                  {task.title}
                </div>

                <div className="text-sm text-gray-600">
                  {task.description}
                </div>

                <div className="text-xs mt-1">
                  Due: {formatDate(task.due_date)}
                </div>
              </div>

              <button
                onClick={() => setEditingTask(task)}
                className="text-blue-600 text-sm"
              >
                ✏ Edit
              </button>
            </div>

            {/* ASSIGNMENTS */}
            <div className="mt-3 space-y-2">
              {task.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center border p-2 rounded bg-white"
                >
                  <div>
                    {a.owner?.profile?.first_name ||
                      a.owner?.username}
                  </div>

                  <button
                    disabled={a.completed}
                    onClick={() => completeAssignment(a.id, true)}
                    className={`px-3 py-1 rounded text-sm ${
                      a.completed
                        ? "bg-green-500 text-white"
                        : "bg-purple-600 text-white"
                    }`}
                  >
                    {a.completed ? "✔ Done" : "Complete"}
                  </button>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  )}

  {/* ================= EDIT MODAL ================= */}
  {editingTask && (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

      <div className="bg-white p-6 rounded-xl w-96 space-y-4">
        <h3 className="text-xl font-bold">Edit Task</h3>

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
              description: e.target.value,
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
              due_date: e.target.value,
            })
          }
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2">
          <button onClick={() => setEditingTask(null)}>Cancel</button>
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
