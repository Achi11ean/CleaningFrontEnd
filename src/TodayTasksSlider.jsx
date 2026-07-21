import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

/* =========================================================
   Date helpers
   -- Parse "YYYY-MM-DD" as a LOCAL date (avoids the classic
      UTC off-by-one bug where a due date jumps a day).
========================================================= */
const toLocalDate = (value) => {
  if (!value) return null;
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfToday = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

// Friendly label: Today / Tomorrow / Yesterday / weekday / date
const friendlyDate = (value) => {
  const d = toLocalDate(value);
  if (!d) return "";
  const today = startOfToday();
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7)
    return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const statusOf = (a) => {
  if (a.completed) return "done";
  const due = toLocalDate(a.task?.due_date);
  if (!due) return "today"; // undated tasks surface with today's work
  const today = startOfToday();
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
};

/* =========================================================
   Look & feel per status  (the "sticky note" palette)
========================================================= */
const THEME = {
  overdue: {
    note: "bg-rose-50 border-rose-200",
    tape: "bg-rose-300/50",
    accent: "text-rose-600",
    check: "border-rose-300",
    badge: "bg-rose-100 text-rose-700",
    label: "Overdue",
    emoji: "⏰",
  },
  today: {
    note: "bg-amber-50 border-amber-200",
    tape: "bg-amber-300/50",
    accent: "text-amber-700",
    check: "border-amber-400",
    badge: "bg-amber-100 text-amber-800",
    label: "Today",
    emoji: "☀️",
  },
  upcoming: {
    note: "bg-sky-50 border-sky-200",
    tape: "bg-sky-300/50",
    accent: "text-sky-700",
    check: "border-sky-300",
    badge: "bg-sky-100 text-sky-700",
    label: "Upcoming",
    emoji: "🗓️",
  },
  done: {
    note: "bg-emerald-50 border-emerald-200",
    tape: "bg-emerald-300/50",
    accent: "text-emerald-600",
    check: "bg-emerald-500 border-emerald-500 text-white",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Done",
    emoji: "✅",
  },
};

const SECTION_ORDER = ["overdue", "today", "upcoming", "done"];

export default function TodayTasksSlider() {
  const { axios: authAxios } = useAuthorizedAxios();

  const [myTasks, setMyTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      const res = await authAxios.get("/tasks/my");
      setMyTasks(res.data || []);
    } catch (err) {
      console.error("Failed loading today tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= GROUP ================= */
  const { sections, total, doneCount } = useMemo(() => {
    const buckets = { overdue: [], today: [], upcoming: [], done: [] };

    myTasks.forEach((a) => {
      // keep original behaviour: only completed-today counts as "done" here
      if (a.completed) {
        const due = toLocalDate(a.task?.due_date);
        if (due && due.getTime() === startOfToday().getTime()) {
          buckets.done.push(a);
        }
        return;
      }
      buckets[statusOf(a)].push(a);
    });

    buckets.upcoming.sort(
      (a, b) =>
        (toLocalDate(a.task?.due_date) ?? 0) -
        (toLocalDate(b.task?.due_date) ?? 0)
    );

    const total =
      buckets.overdue.length +
      buckets.today.length +
      buckets.upcoming.length +
      buckets.done.length;

    return { sections: buckets, total, doneCount: buckets.done.length };
  }, [myTasks]);

  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  /* ================= TOGGLE ================= */
  const toggleAssignment = async (id) => {
    // optimistic flip so it feels instant
    setMyTasks((prev) =>
      prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
    );
    try {
      const res = await authAxios.patch(`/tasks/assignment/${id}/toggle`);
      const updated = res.data;
      setMyTasks((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, completed: updated.completed } : a
        )
      );
    } catch (err) {
      console.error("Toggle failed", err);
      // revert on failure
      setMyTasks((prev) =>
        prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a))
      );
    }
  };

  /* ================= AUTOSAVE (inline edit) ================= */
  const autoSaveTask = async (taskId, fields) => {
    try {
      setSavingTaskId(taskId);
      await authAxios.patch(`/tasks/${taskId}`, fields);
      setMyTasks((prev) =>
        prev.map((a) =>
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

  const patchLocalTask = (assignmentId, fields) =>
    setMyTasks((prev) =>
      prev.map((item) =>
        item.id === assignmentId
          ? { ...item, task: { ...item.task, ...fields } }
          : item
      )
    );

  /* ================= DELETE ================= */
  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task permanently?")) return;
    // optimistic removal
    const snapshot = myTasks;
    setMyTasks((prev) => prev.filter((a) => a.task?.id !== taskId));
    try {
      await authAxios.delete(`/tasks/${taskId}`);
    } catch (err) {
      console.error("Delete failed", err);
      setMyTasks(snapshot); // restore if it failed
    }
  };

  /* ================= SAVE EDIT (modal) ================= */
  const saveEdit = async () => {
    try {
      const payload = {
        title: editingTask.title,
        description: editingTask.description,
        due_date: editingTask.due_date || null,
      };
      await authAxios.patch(`/tasks/${editingTask.id}`, payload);
      setMyTasks((prev) =>
        prev.map((a) =>
          a.task?.id === editingTask.id
            ? { ...a, task: { ...a.task, ...payload } }
            : a
        )
      );
      setEditingTask(null);
    } catch (err) {
      console.error("Edit failed", err);
    }
  };

  /* ================= NOTE CARD ================= */
  const NoteCard = ({ a, index }) => {
    const t = THEME[statusOf(a)];
    const done = a.completed;
    const tilt = index % 2 === 0 ? "sm:-rotate-[1.2deg]" : "sm:rotate-[1.2deg]";

    return (
      <div
        className={`tn-card group relative flex flex-col rounded-2xl border p-4 pt-5
          shadow-[0_6px_16px_-8px_rgba(0,0,0,0.25)] transition-all duration-300
          hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_14px_28px_-12px_rgba(0,0,0,0.3)]
          ${t.note} ${tilt}`}
      >
        {/* sticky-note tape */}
        <span
          className={`pointer-events-none absolute -top-2 left-1/2 h-4 w-16 -translate-x-1/2
            -rotate-2 rounded-[2px] ${t.tape} backdrop-blur-sm`}
        />

        {/* top row: check + actions */}
        <div className="mb-2 flex items-start justify-between">
          <button
            onClick={() => toggleAssignment(a.id)}
            aria-label={done ? "Mark as not done" : "Mark as done"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2
              transition-transform active:scale-90 ${t.check}`}
          >
            {done && <span className="tn-pop text-[13px] leading-none">✓</span>}
          </button>

          <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => setEditingTask(a.task)}
              aria-label="Edit task"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white/70 hover:text-slate-700"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteTask(a.task.id)}
              aria-label="Delete task"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/70 hover:text-rose-600"
            >
              🗑
            </button>
          </div>
        </div>

        {/* title */}
        <textarea
          rows={1}
          value={a.task?.title || ""}
          placeholder="Untitled note"
          onChange={(e) => patchLocalTask(a.id, { title: e.target.value })}
          onBlur={() => autoSaveTask(a.task.id, { title: a.task.title })}
          className={`w-full resize-none break-words bg-transparent text-[15px] font-semibold
            leading-snug outline-none placeholder:text-slate-300
            ${done ? "text-slate-400 line-through" : "text-slate-800"}`}
        />

        {/* description */}
        <textarea
          rows={2}
          value={a.task?.description || ""}
          placeholder="Add a note…"
          onChange={(e) =>
            patchLocalTask(a.id, { description: e.target.value })
          }
          onBlur={() =>
            autoSaveTask(a.task.id, { description: a.task.description })
          }
          className={`mt-1 w-full resize-none break-words bg-transparent text-[13px]
            leading-relaxed outline-none placeholder:text-slate-300
            ${done ? "text-slate-400" : "text-slate-600"}`}
        />

        {/* footer: date + status badge */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {a.task?.due_date ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium
                ${done ? "text-slate-400 line-through" : t.accent}`}
            >
              📅 {friendlyDate(a.task.due_date)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-300">No date</span>
          )}

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.badge}`}
          >
            {t.label}
          </span>
        </div>

        {savingTaskId === a.task?.id && (
          <div className="mt-1 text-[10px] text-slate-400">Saving…</div>
        )}
      </div>
    );
  };

  /* ================= RENDER ================= */
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* local styles: gentle motion, reduced-motion safe */}
      <style>{`
        @keyframes tnFadeUp { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
        @keyframes tnPop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
        .tn-card { animation: tnFadeUp .35s ease both; }
        .tn-pop { display:inline-block; animation: tnPop .25s ease; }
        @media (prefers-reduced-motion: reduce) {
          .tn-card, .tn-pop { animation: none !important; }
          .tn-card { transition: none !important; }
        }
      `}</style>

      {/* ---------- Header ---------- */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-800">
              My Notes
            </h2>
            <p className="text-xs text-slate-400">
              {total === 0
                ? "You're all caught up"
                : `${doneCount} of ${total} done`}
            </p>
          </div>

          {/* progress ring */}
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-slate-100"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-500"
                strokeDasharray={`${(progress / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-600">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Loading ---------- */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
            />
          ))}
        </div>
      )}

      {/* ---------- Empty ---------- */}
      {!loading && total === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-center">
          <div className="text-4xl">🌿</div>
          <p className="mt-2 font-semibold text-slate-600">Nothing on the board</p>
          <p className="text-sm text-slate-400">
            Enjoy the calm — new tasks will show up here.
          </p>
        </div>
      )}

      {/* ---------- Sections ---------- */}
      {!loading &&
        SECTION_ORDER.map((key) => {
          const items = sections[key];
          if (!items.length) return null;
          const t = THEME[key];
          return (
            <section key={key} className="mb-7">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm">{t.emoji}</span>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {t.label}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.badge}`}
                >
                  {items.length}
                </span>
                <div className="ml-1 h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a, i) => (
                  <NoteCard key={a.id} a={a} index={i} />
                ))}
              </div>
            </section>
          );
        })}

      {/* ---------- Edit sheet / modal ---------- */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setEditingTask(null)}
        >
          <div
            className="w-full space-y-4 rounded-t-3xl bg-white p-6 shadow-2xl sm:w-[26rem] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-800">Edit note</h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Title</label>
              <input
                value={editingTask.title || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, title: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Description
              </label>
              <textarea
                rows={3}
                value={editingTask.description || ""}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">
                Due date
              </label>
              <input
                type="date"
                value={editingTask.due_date || ""}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    due_date: e.target.value || null,
                  })
                }
                className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-slate-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95"
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