import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CreateTask from "./CreateTask";
export default function ManageTasks() {
const { axios: authAxios, role } = useAuthorizedAxios();
const [assigningTask, setAssigningTask] = useState(null);
const [allStaff, setAllStaff] = useState([]);
const [allAdmins, setAllAdmins] = useState([]);
const [selectedOwnerType, setSelectedOwnerType] = useState("staff");
const [selectedOwnerId, setSelectedOwnerId] = useState("");
const [myTasks, setMyTasks] = useState([]);
const [allTasks, setAllTasks] = useState([]);
const [savingTaskId, setSavingTaskId] = useState(null);
const [showCreate, setShowCreate] = useState(false);
const [loading, setLoading] = useState(true);


const isManager = role === "admin" || role === "manager";

/* ================= LOAD DATA ================= */
const loadData = async (showLoader = false) => {
  try {
    if (showLoader) setLoading(true);

    const myRes = await authAxios.get("/tasks/my");
    setMyTasks(myRes.data || []);

    const allRes = await authAxios.get("/tasks/all");
    setAllTasks(allRes.data || []);

    // Always load assignable users (screen is protected anyway)
    const staffRes = await authAxios.get("/staff/all");
    const adminRes = await authAxios.get("/admin/all");

    setAllStaff(staffRes.data || []);
    setAllAdmins(adminRes.data || []);

  } catch (err) {
    console.error("Failed loading tasks", err);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  loadData(true);
}, []);

/* ================= COMPLETE ================= */

const toggleAssignment = async (id, override = false) => {
  try {
    const url = override
      ? `/tasks/assignment/${id}/toggle/override`
      : `/tasks/assignment/${id}/toggle`;

    const res = await authAxios.patch(url);
    const updated = res.data;

    // Update myTasks locally
    setMyTasks(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, completed: updated.completed }
          : a
      )
    );

    // Update allTasks locally
    setAllTasks(prev =>
      prev.map(task => ({
        ...task,
        assignments: task.assignments.map(a =>
          a.id === id
            ? { ...a, completed: updated.completed }
            : a
        )
      }))
    );

  } catch (err) {
    console.error("Failed toggling", err);
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

const removeAssignment = async (assignmentId) => {
  try {
    await authAxios.delete(`/tasks/assignment/${assignmentId}`);
    loadData();
  } catch (err) {
    console.error("Failed removing assignment", err);
  }
};

const openAssignModal = (task) => {
  setAssigningTask(task);
  setSelectedOwnerType("staff");
  setSelectedOwnerId("");
};

const confirmAddAssignment = async () => {
  if (!selectedOwnerId) return;

  try {
    await authAxios.post(`/tasks/${assigningTask.id}/assign`, {
      owner_type: selectedOwnerType,
      owner_id: parseInt(selectedOwnerId),
    });

    setAssigningTask(null);
    loadData();
  } catch (err) {
    console.error("Failed adding assignment", err);
  }
};

const deleteTask = async (taskId) => {
  if (!window.confirm("Delete this task permanently?")) return;

  try {
    await authAxios.delete(`/tasks/${taskId}`);
    loadData();
  } catch (err) {
    console.error("Failed deleting task", err);
  }
};

/* ================= HELPERS ================= */


const autoSaveTask = async (taskId, updatedFields) => {
  try {
    setSavingTaskId(taskId);

    await authAxios.patch(`/tasks/${taskId}`, updatedFields);

    // Update allTasks
    setAllTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, ...updatedFields }
          : task
      )
    );

    // Update myTasks (nested task object)
    setMyTasks(prev =>
      prev.map(a =>
        a.task?.id === taskId
          ? {
              ...a,
              task: { ...a.task, ...updatedFields }
            }
          : a
      )
    );

  } catch (err) {
    console.error("Auto-save failed", err);
  } finally {
    setSavingTaskId(null);
  }
};
const formatDate = (d) => {
if (!d) return "—";
const date = new Date(d);
return date.toLocaleDateString();
};


const sortByDueDate = (items, getDateFn) => {
  return [...items].sort((a, b) => {
    const dateA = getDateFn(a);
    const dateB = getDateFn(b);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;   // no due date goes last
    if (!dateB) return -1;

    return new Date(dateA) - new Date(dateB);
  });
};


const sortedMyTasks = sortByDueDate(
  myTasks,
  (a) => a.task?.due_date
);

const sortedAllTasks = sortByDueDate(
  allTasks,
  (task) => task.due_date
);
/* ================= UI ================= */

{loading && (
  <div className="text-sm text-gray-400 mb-4">
    Loading...
  </div>
)}
return ( <div className="max-w-full px-1 bg-gradient-to-br from-yellow-200 via-yellow-400/60 to-yellow-100 mx-auto p-6 ">

  <div className="mb-8">

    {/* Toggle Button */}
      <div className="flex justify-between items-center mb-6">
    <h2 className="text-lg font-bold text-slate-700">
      Task Management
    </h2>

    <button
      onClick={() => setShowCreate(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition"
    >
      ➕ Create Task
    </button>
  </div>

    {/* Collapsible Create Form */}
   {/* ================= CREATE TASK MODAL ================= */}
{showCreate && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">

    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl  relative animate-fadeIn">

      {/* Close Button */}
      <button
        onClick={() => setShowCreate(false)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
      >
        ✕
      </button>

      <CreateTask
        onCreated={() => {
          setShowCreate(false);
          loadData(true);
        }}
      />

    </div>
  </div>
)}

  </div>


{/* ================= MY TASKS ================= */}
<div className="space-y- max-w-md">

  {/* Header */}
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold text-slate-700 tracking-tight">
      📝 My Tasks
    </h2>

    <span className="text-xs text-slate-400">
      {myTasks.length} items
    </span>
  </div>

  {/* Notepad Container */}
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

  {sortedMyTasks.map((a, index) =>  {
      const dueDate = a.task?.due_date
        ? new Date(a.task.due_date)
        : null;

      const isOverdue =
        dueDate && !a.completed && dueDate < new Date();

      return (
        <div
          key={a.id}
          className={`
            flex items-start gap-3 px-4 py-3
            text-sm
            transition
            ${index !== myTasks.length - 1 ? "border-b border-slate-100" : ""}
            ${a.completed ? "bg-emerald-50/50" : ""}
          `}
        >
          {/* Checkbox */}
          <button
onClick={() => toggleAssignment(a.id)}
            className={`
              mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center
              transition
              ${
                a.completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-slate-300 hover:border-blue-400"
              }
            `}
          >
            {a.completed && (
              <span className="text-[10px]">✓</span>
            )}
          </button>

          {/* Task Content */}
          <div className="flex-1">
<input
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
    font-medium w-full bg-transparent border-b border-transparent
    focus:border-slate-300 outline-none
    ${
      a.completed
        ? "line-through text-slate-400"
        : "text-slate-700"
    }
  `}
/>

       <textarea
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
  rows={2}
  className="text-xs text-slate-400 mt-0.5 bg-transparent border border-transparent focus:border-slate-200 rounded outline-none w-full resize-none"
/>

            {a.task?.due_date && (
              <div
                className={`
                  text-[11px] mt-1
                  ${
                    isOverdue
                      ? "text-rose-500 font-medium"
                      : "text-slate-400"
                  }
                `}
              >
                Due {formatDate(a.task.due_date)}
              </div>
            )}
          </div>

        </div>
      );
    })}

    {myTasks.length === 0 && (
      <div className="px-4 py-6 text-center text-slate-400 text-sm">
        ✨ Nothing to do. You're glowing.
      </div>
    )}

  </div>
</div>
{/* ================= ALL TASKS ================= */}
<div className="space-y-4 max-w-full">

  {/* Header */}
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold text-slate-700 tracking-tight">
      📋 All Tasks
    </h2>

    <span className="text-xs text-slate-400">
      {allTasks.length} total
    </span>
  </div>

  {/* Responsive Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

    {sortedAllTasks.map((task) =>{
      const dueDate = task.due_date
        ? new Date(task.due_date)
        : null;

      const isOverdue =
        dueDate &&
        dueDate < new Date() &&
        !task.assignments.every(a => a.completed);

      return (
        <div
          key={task.id}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >

          {/* Task Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-start">
            <div>
     <input
  value={task.title}
  onChange={(e) =>
    setAllTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, title: e.target.value }
          : t
      )
    )
  }
  onBlur={() =>
    autoSaveTask(task.id, { title: task.title })
  }
  className="font-medium text-slate-700 bg-transparent border-b border-transparent focus:border-slate-300 outline-none w-full"
/>

             <textarea
  value={task.description || ""}
  onChange={(e) =>
    setAllTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, description: e.target.value }
          : t
      )
    )
  }
  onBlur={() =>
    autoSaveTask(task.id, { description: task.description })
  }
  rows={2}
  className="text-xs text-slate-400 mt-0.5 bg-transparent border border-transparent focus:border-slate-200 rounded outline-none w-full resize-none"
/>
{savingTaskId === task.id && (
  <div className="text-[10px] text-slate-400 mt-1">
    Saving...
  </div>
)}
              {task.due_date && (
                <div
                  className={`text-[11px] mt-1 ${
                    isOverdue
                      ? "text-rose-500 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  Due {formatDate(task.due_date)}
                </div>
              )}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setEditingTask(task)}
                className="text-blue-500 hover:underline"
              >
                Edit
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="text-rose-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Assignments */}
          <div className="border-t border-b border-yellow-400">
            {task.assignments.map((a, index) => (
              <div
                key={a.id}
                className={`
                  flex items-center gap-3 px-4 py-2 text-sm
                  ${index !== task.assignments.length - 1
                    ? "border-b border-yellow-400"
                    : ""}
                  ${a.completed ? "bg-emerald-50/40" : ""}
                `}
              >
                <button
         onClick={() => toggleAssignment(a.id, true)}
                  className={`
                    h-4 w-4 rounded-full border flex items-center justify-center
                    ${
                      a.completed
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-slate-300 hover:border-purple-400"
                    }
                  `}
                >
                  {a.completed && (
                    <span className="text-[10px]">✓</span>
                  )}
                </button>

                <div
                  className={`
                    flex-1
                    ${
                      a.completed
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }
                  `}
                >
                  {a.owner?.profile?.first_name ||
                    a.owner?.username ||
                    "Unknown User"}
                </div>

                <button
                  onClick={() => removeAssignment(a.id)}
                  className="text-[11px] text-rose-400 hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}

            {task.assignments.length === 0 && (
              <div className="px-4 py-3 text-xs text-slate-400">
                No one assigned yet.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100">
            <button
              onClick={() => openAssignModal(task)}
              className="text-[12px] text-emerald-600 hover:underline"
            >
              ➕ Add Person
            </button>
          </div>

        </div>
      );
    })}

  </div>

  {allTasks.length === 0 && (
    <div className="text-center text-sm text-slate-400 py-6">
      No tasks created yet.
    </div>
  )}
</div>
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

  {/* ================= ASSIGN MODAL ================= */}
{assigningTask && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-96 space-y-4 shadow-xl">

      <h3 className="text-xl font-bold">
        Assign User to "{assigningTask.title}"
      </h3>

      <select
        value={selectedOwnerType}
        onChange={(e) => {
          setSelectedOwnerType(e.target.value);
          setSelectedOwnerId("");
        }}
        className="w-full border p-2 rounded"
      >
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>

      <select
        value={selectedOwnerId}
        onChange={(e) => setSelectedOwnerId(e.target.value)}
        className="w-full border p-2 rounded"
      >
        <option value="">Select user</option>

        {(selectedOwnerType === "staff"
          ? allStaff
          : allAdmins
        ).map((user) => (
          <option key={user.id} value={user.id}>
            {user.profile?.first_name || user.username}
          </option>
        ))}
      </select>

      <div className="flex justify-end gap-3">
        <button onClick={() => setAssigningTask(null)}>
          Cancel
        </button>

        <button
          onClick={confirmAddAssignment}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Assign
        </button>
      </div>

    </div>
  </div>
)}
</div>


);
}
