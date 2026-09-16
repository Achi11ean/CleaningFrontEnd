import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CreateTask from "./CreateTask";
import MyTasksPanel from "./MyTasksPanel";
import ArchivedTasks from "./ArchivedTasks";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";
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
const [error, setError] = useState("");
const [showArchived, setShowArchived] = useState(false);

const isManager = role === "admin" || role === "manager";

/* ================= LOAD DATA ================= */
const loadData = async (showLoader = false) => {
  try {
    if (showLoader) setLoading(true);
    setError("");

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
    setError(err.response?.data?.error || "Failed loading tasks. Please try again.");
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
    setError(err.response?.data?.error || "Failed toggling. Please try again.");
  }
};
/* ================= EDIT TASK ================= */

const [editingTask, setEditingTask] = useState(null);
const saveEdit = async () => {
  try {
    const payload = {
      title: editingTask.title,
      description: editingTask.description,
      due_date: editingTask.due_date || null,
      repeat_type: editingTask.repeat_type,
      repeat_interval: editingTask.repeat_interval,
    };

    await authAxios.patch(`/tasks/${editingTask.id}`, payload);

    setEditingTask(null);
    loadData();
  } catch (err) {
    setError(err.response?.data?.error || "Failed updating task. Please try again.");
  }
};
const removeAssignment = async (assignmentId) => {
  try {
    await authAxios.delete(`/tasks/assignment/${assignmentId}`);
    loadData();
  } catch (err) {
    setError(err.response?.data?.error || "Failed removing assignment. Please try again.");
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
    setError(err.response?.data?.error || "Failed adding assignment. Please try again.");
  }
};

const deleteTask = async (taskId) => {
  if (!window.confirm("Delete this task permanently?")) return;

  try {
    await authAxios.delete(`/tasks/${taskId}`);
    loadData();
  } catch (err) {
    setError(err.response?.data?.error || "Failed deleting task. Please try again.");
  }
};

/* ================= HELPERS ================= */


const autoSaveTask = async (taskId, updatedFields) => {
    const task = allTasks.find(t => t.id === taskId);
  if (task?.is_archived) return;

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
    setError(err.response?.data?.error || "Auto-save failed. Please try again.");
  } finally {
    setSavingTaskId(null);
  }
};
const formatDate = (d) => {
if (!d) return "—";
const date = new Date(d);
return date.toLocaleDateString();
};
const formatRepeat = (type, interval) => {
  if (type === "none") return null;

  return `Repeats every ${interval} ${
    type === "daily"
      ? "day(s)"
      : type === "weekly"
      ? "week(s)"
      : "month(s)"
  }`;
};
const sortByDueDate = (items, getDateFn) => {
  return [...items].sort((a, b) => {
    const dateA = getDateFn(a);
    const dateB = getDateFn(b);

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;   
    if (!dateB) return -1;

    return new Date(dateA) - new Date(dateB);
  });
};


const sortedMyTasks = [...myTasks].sort((a, b) => {
  // 1️⃣ Incomplete first
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  // 2️⃣ Then sort by due date
  const dateA = a.task?.due_date;
  const dateB = b.task?.due_date;

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return new Date(dateA) - new Date(dateB);
});
const sortedAllTasks = sortByDueDate(
  allTasks,
  (task) => task.due_date
);
/* ================= UI ================= */

return (<CleaningTheme className="mt-theme"><div className="mt-board">
  <style>{TASK_STYLES}</style>
  {loading && <p className="mt-notice" role="status">Loading your task workspace…</p>}
  {error && <p className="mt-notice mt-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></p>}

  <div className="mb-5">

    {/* Toggle Button */}
      <div className="mt-header">
    <div className="mt-title"><span className="mt-mark" aria-hidden="true"><CleaningSparkle /></span><div><p className="mt-kicker">A little order. A fresh start.</p><h2>Task management</h2><p className="mt-subtitle">Organize work, assign your team, and track progress.</p></div></div>

    <button
      onClick={() => setShowCreate(true)}
      className="px-4 py-2 bg-[#267e83] text-white rounded-xl text-sm font-semibold hover:brightness-110 transition"
    >
      + Create task
    </button>
  </div>

    {/* Collapsible Create Form */}
   {/* ================= CREATE TASK MODAL ================= */}
{showCreate && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="
      mt-dialog bg-[#10283d] w-full max-w-2xl
      rounded-2xl shadow-2xl relative animate-fadeIn
      max-h-[90vh] overflow-y-auto
    ">

      {/* Close Button */}
      <button
        aria-label="Close create task"
        onClick={() => setShowCreate(false)}
        className="absolute top-4 right-4 text-[#9bbfd1] hover:text-[#bedbe8] text-lg z-10"
      >
        ✕
      </button>

      <div className="p-6">
        <CreateTask
          onCreated={() => {
            setShowCreate(false);
            loadData(true);
          }}
        />
      </div>

    </div>
  </div>
)}
  </div>


{/* ================= MY TASKS ================= */}
<MyTasksPanel
  tasks={sortedMyTasks}
  setMyTasks={setMyTasks}
  toggleAssignment={toggleAssignment}
  autoSaveTask={autoSaveTask}
  formatDate={formatDate}
  formatRepeat={formatRepeat}
  onEditTask={(task) => setEditingTask(task)}
  onDeleteTask={deleteTask}
/>
{/* ================= ALL TASKS ================= */}
<div className="space-y-4 max-w-full">

  {/* Header */}
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-bold text-[#d3e9f3] tracking-tight">
      📋 All Tasks
    </h2>

    <span className="text-xs text-[#9bbfd1]">
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
          className="mt-task bg-[#10283d] rounded-2xl shadow-sm border border-[#7dd3fc33] overflow-hidden"
        >

          {/* Task Header */}
          <div className="mt-task-heading px-4 py-3 border-b border-[#7dd3fc26] flex justify-between items-start">
            <div>
     <input
       aria-label="Task title"
       disabled={task.is_archived}
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
  className="font-medium text-[#d3e9f3] bg-transparent border-b border-transparent focus:border-[#91bdd0] outline-none w-full"
/>

             <textarea
               aria-label="Task description"
               disabled={task.is_archived}
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
  className="text-xs text-[#9bbfd1] mt-0.5 bg-transparent border border-transparent focus:border-[#7dd3fc33] rounded outline-none w-full resize-none"
/>
{savingTaskId === task.id && (
  <div className="text-[10px] text-[#9bbfd1] mt-1">
    Saving...
  </div>
)}
              {task.due_date && (
                <div
                  className={`text-[11px] mt-1 ${
                    isOverdue
                      ? "text-[#f3b4c9] font-medium"
                      : "text-[#9bbfd1]"
                  }`}
                >
                  Due {formatDate(task.due_date)}
                </div>
              )}
              {task.repeat_type !== "none" && (
  <div className="text-[11px] text-[#c5b6ed] mt-1">
    🔁 Repeats every {task.repeat_interval}{" "}
    {task.repeat_type === "daily"
      ? "day(s)"
      : task.repeat_type === "weekly"
      ? "week(s)"
      : "month(s)"}
  </div>
)}
            </div>

            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setEditingTask(task)}
                disabled={task.is_archived}
                className="text-[#9adaf4] hover:underline"
              >
                Edit
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="text-[#f3b4c9] hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
{task.is_archived && (
  <div className="text-xs text-[#9bbfd1] mt-1">
    🔒 Archived
  </div>
)}
          {/* Assignments */}
          <div className="border-t border-b border-[#7dd3fc29]">
            {task.assignments.map((a, index) => (
              <div
                key={a.id}
                className={`
                  flex items-center gap-3 px-4 py-2 text-sm
                  ${index !== task.assignments.length - 1
                    ? "border-b border-[#7dd3fc29]"
                    : ""}
                  ${a.completed ? "bg-[#214d3e]/40" : ""}
                `}
              >
                <button
         aria-label={a.completed ? "Mark assignment incomplete" : "Complete assignment"}
         aria-pressed={Boolean(a.completed)}
         onClick={() => toggleAssignment(a.id, true)}
                  className={`
                    h-4 w-4 rounded-full border flex items-center justify-center
                    ${
                      a.completed
                        ? "bg-[#214d3e]0 border-[#a1e9c8] text-white"
                        : "border-[#91bdd0] hover:border-purple-400"
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
                        ? "line-through text-[#9bbfd1]"
                        : "text-[#d3e9f3]"
                    }
                  `}
                >
                  {a.owner?.profile?.first_name ||
                    a.owner?.username ||
                    "Unknown User"}
                </div>

                <button
                  onClick={() => removeAssignment(a.id)}
                  className="text-[11px] text-[#eaa4bd] hover:text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}

            {task.assignments.length === 0 && (
              <div className="px-4 py-3 text-xs text-[#9bbfd1]">
                No one assigned yet.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#7dd3fc26]">
            <button
              onClick={() => openAssignModal(task)}
              className="text-[12px] text-[#a2e8cd] hover:underline"
            >
              ➕ Add Person
            </button>
          </div>

        </div>
      );
    })}

  </div>
<button
  onClick={() => setShowArchived(prev => !prev)}
  className="px-4 py-2 bg-[#25495e] text-white rounded-xl text-sm font-semibold hover:brightness-110 transition"
>
  🗄 {showArchived ? "Hide Archived" : "View Archived"}
</button>
  {allTasks.length === 0 && (
    <div className="text-center text-sm text-[#9bbfd1] py-6">
      No tasks created yet.
    </div>
  )}
</div>

{showArchived && (
  <ArchivedTasks onClose={() => setShowArchived(false)} />
)}
  {/* ================= EDIT MODAL ================= */}
  {editingTask && (
    <div className="mt-overlay fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">

      <div role="dialog" aria-modal="true" aria-label="Edit task" className="mt-dialog bg-[#10283d] p-6 rounded-xl w-96 space-y-4">
        <h3 className="text-xl font-bold">Edit Task</h3>

        <input
          aria-label="Task title"
          value={editingTask.title}
          onChange={(e) =>
            setEditingTask({ ...editingTask, title: e.target.value })
          }
          className="w-full border p-2 rounded"
        />

        <textarea
          aria-label="Task description"
          value={editingTask.description || ""}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              description: e.target.value,
            })
          }
          className="w-full border p-2 rounded"
        />

        <input
          aria-label="Due date"
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
<select
  aria-label="Repeat schedule"
  value={editingTask.repeat_type}
  onChange={(e) =>
    setEditingTask({
      ...editingTask,
      repeat_type: e.target.value,
    })
  }
  className="w-full border p-2 rounded"
>
  <option value="none">No Repeat</option>
  <option value="daily">Daily</option>
  <option value="weekly">Weekly</option>
  <option value="monthly">Monthly</option>
</select>

{editingTask.repeat_type !== "none" && (
  <input
    aria-label="Repeat interval"
    type="number"
    min="1"
    value={editingTask.repeat_interval}
    onChange={(e) =>
      setEditingTask({
        ...editingTask,
        repeat_interval: parseInt(e.target.value) || 1,
      })
    }
    className="w-full border p-2 rounded"
  />
)}
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditingTask(null)}>Cancel</button>
          <button
            onClick={saveEdit}
            className="px-4 py-2 bg-[#267e83] text-white rounded"
          >
            Save
          </button>
        </div>
      </div>

    </div>
  )}

  {/* ================= ASSIGN MODAL ================= */}
{assigningTask && (
  <div className="mt-overlay fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
    <div role="dialog" aria-modal="true" aria-label="Assign task" className="mt-dialog bg-[#10283d] p-6 rounded-xl w-96 space-y-4 shadow-xl">

      <h3 className="text-xl font-bold">
        Assign User to "{assigningTask.title}"
      </h3>

      <select
        aria-label="Assign staff or admin"
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
        aria-label="Choose person"
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
          className="px-4 py-2 bg-[#28795f] text-white rounded"
        >
          Assign
        </button>
      </div>

    </div>
  </div>
)}
</div></CleaningTheme>


);
}

const TASK_STYLES = `
.cleaning-theme.mt-theme{min-height:0;background:radial-gradient(ellipse at top right,#215f7444,transparent 60%),#071321;border-radius:20px;overflow:visible;color:#dfedf7}.cleaning-theme .mt-theme .ct-page-atmosphere{display:none}.mt-board{position:relative;max-width:1400px;margin:auto;padding:22px;min-width:0}.mt-header{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:20px}.mt-title{display:flex;align-items:center;gap:11px;min-width:0}.mt-mark{width:41px;height:41px;flex-shrink:0;display:grid;place-items:center;border:1px solid #9ae3d844;background:#1c4450;border-radius:13px;color:#b4f0dc}.mt-mark svg{width:23px;height:23px}.mt-kicker{font-size:9px;letter-spacing:.08em;font-weight:700;text-transform:uppercase;color:#96d8d6;margin:0 0 4px!important}.mt-title h2{font-size:23px;line-height:1.3;font-weight:700;letter-spacing:-.03em;margin:0;color:#e3f3fa}.mt-subtitle{font-size:11px;line-height:1.7;color:#9dbdd0;margin:6px 0 0!important}.mt-header>button{min-height:44px;background:linear-gradient(110deg,#9adcf3,#97e5ce);color:#113545;border:1px solid #b3edde;border-radius:11px;font-size:12px}.mt-task{background:linear-gradient(130deg,#153247,#0e2337)!important;border-radius:15px!important;min-width:0;box-shadow:0 8px 24px #0002}.mt-task-heading{gap:12px}.mt-task-heading>div:first-child{flex:1;min-width:0}.mt-task-heading>div:last-child{flex-shrink:0}.mt-task input,.mt-task textarea{padding:6px 3px;border-radius:6px;line-height:1.6}.mt-task input{font-weight:700;font-size:14px}.mt-task textarea{font-size:12px;resize:vertical;min-height:60px}.mt-task button{min-height:40px}.mt-task button[aria-pressed]{min-width:32px;width:32px;min-height:32px;height:32px;flex-shrink:0}.mt-task button[aria-pressed=true]{color:#dcfff1}.mt-task button:disabled{opacity:.5;cursor:not-allowed}.mt-task [class*="flex-1"]{min-width:0;overflow-wrap:anywhere}.mt-task>div:last-child{padding-block:10px}.mt-board button:focus-visible,.mt-board input:focus-visible,.mt-board textarea:focus-visible,.mt-board select:focus-visible{outline:2px solid #9eeed5;outline-offset:2px}.mt-overlay{background:#030c1acc;backdrop-filter:blur(6px)}.mt-dialog{color:#e1eff7;background:radial-gradient(ellipse at top,#23576444,transparent 70%),#0e2539!important;border:1px solid #8acedd44;max-width:calc(100vw - 24px);max-height:90dvh;overflow-y:auto;border-radius:18px!important}.mt-dialog input,.mt-dialog textarea,.mt-dialog select{color-scheme:dark;min-height:44px;background:#0a1e31;border:1px solid #7dd3fc40;color:#dceff8;border-radius:9px;padding:10px 12px;font-size:13px}.mt-dialog button{min-height:44px;padding:8px 12px}.mt-notice{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border:1px solid #7dd3fc33;border-radius:11px;background:#19374a;color:#c6e7ed;font-size:12px;line-height:1.7;margin:0 0 14px}.mt-error{background:#44273a;border-color:#efa6c144;color:#ffd0e1}.mt-error button{min-width:36px;min-height:36px;font-size:20px}
@media(max-width:640px){.mt-board{padding:13px}.mt-title h2{font-size:20px}.mt-kicker{font-size:8px}.mt-mark{width:35px;height:35px}.mt-header>button{width:100%}.mt-header{gap:12px}.mt-task-heading{flex-direction:column;gap:5px}.mt-task-heading>div:first-child{width:100%}.mt-task-heading>div:last-child{align-self:flex-end;gap:14px}.mt-task input,.mt-task textarea,.mt-dialog input,.mt-dialog textarea,.mt-dialog select{font-size:16px}.mt-dialog{padding:17px}.mt-dialog>div.p-6{padding:12px}.mt-task button[aria-pressed]{min-width:40px;width:40px;min-height:40px;height:40px}}
`;
