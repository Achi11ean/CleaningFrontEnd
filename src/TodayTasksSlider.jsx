import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

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
    note: "bg-[#35273b] border-[#ed9bb343]",
    tape: "bg-rose-300/50",
    accent: "text-[#f2b8ca]",
    check: "border-[#de96b1]",
    badge: "bg-[#532c42] text-[#ffd3e2]",
    label: "Overdue",
    emoji: "⏰",
  },
  today: {
    note: "bg-[#292e32] border-[#e4c99540]",
    tape: "bg-amber-300/50",
    accent: "text-[#e7d29e]",
    check: "border-[#ddca96]",
    badge: "bg-[#443a2e] text-[#f3dfa9]",
    label: "Today",
    emoji: "☀️",
  },
  upcoming: {
    note: "bg-[#102c43] border-[#88d2ee40]",
    tape: "bg-sky-300/50",
    accent: "text-[#abe2f4]",
    check: "border-[#8dd5eb]",
    badge: "bg-[#1b4358] text-[#abe2f4]",
    label: "Upcoming",
    emoji: "🗓️",
  },
  done: {
    note: "bg-[#123830] border-[#8cdeb540]",
    tape: "bg-emerald-300/50",
    accent: "text-[#a7e9ce]",
    check: "bg-[#123830]0 border-[#8de2c3] text-white",
    badge: "bg-[#204e40] text-[#b9f0d9]",
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
  const [error, setError] = useState("");

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      const res = await authAxios.get("/tasks/my");
      setMyTasks(res.data || []);
    } catch (err) {
      setError("Unable to load your notes. Please reload to try again.");
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
      // Preserve the existing filter: completed tasks due today appear in Done.
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
      setError(err.response?.data?.error || "Unable to update this task. Please try again.");
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
      setError(err.response?.data?.error || "Your edit could not be saved. Edit the field and leave it to retry.");
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
      setError(err.response?.data?.error || "Unable to delete this note.");
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
      setError(err.response?.data?.error || "Unable to save your note.");
    }
  };

  /* ================= NOTE CARD ================= */
  const renderNoteCard = ({ a, index }) => {
    const t = THEME[statusOf(a)];
    const done = a.completed;
    const tilt = "";

    return (
      <div
        key={a.id}
        className={`tn-card tn-${statusOf(a)} group relative flex flex-col rounded-2xl border p-4 pt-5
          shadow-[0_6px_16px_-8px_rgba(0,0,0,0.25)] transition-all duration-300
          hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(0,0,0,0.3)]
          ${t.note} ${tilt}`}
      >
        {/* top row: check + actions */}
        <div className="mb-2 flex items-start justify-between">
          <button
            onClick={() => toggleAssignment(a.id)}
            aria-pressed={Boolean(done)}
            aria-label={done ? "Mark as not done" : "Mark as done"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2
              transition-transform active:scale-90 ${t.check}`}
          >
            {done && <span className="tn-pop text-[13px] leading-none">✓</span>}
          </button>

          <div className="flex gap-1 opacity-100 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => setEditingTask(a.task)}
              aria-label="Edit task"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ebfd1] hover:bg-[#0f263b]/70 hover:text-[#c5dfea]"
            >
              ✏️
            </button>
            <button
              onClick={() => deleteTask(a.task.id)}
              aria-label="Delete task"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8dafc1] hover:bg-[#0f263b]/70 hover:text-[#f2b8ca]"
            >
              🗑
            </button>
          </div>
        </div>

        {/* title */}
        <textarea
          rows={1}
          value={a.task?.title || ""}
          aria-label="Task title"
          placeholder="Untitled note"
          onChange={(e) => patchLocalTask(a.id, { title: e.target.value })}
          onBlur={() => autoSaveTask(a.task.id, { title: a.task.title })}
          className={`w-full resize-none break-words bg-transparent text-[15px] font-semibold
            leading-snug outline-none placeholder:text-[#7497ad]
            ${done ? "text-[#8dafc1] line-through" : "text-[#e0f0f7]"}`}
        />

        {/* description */}
        <textarea
          rows={2}
          value={a.task?.description || ""}
          aria-label="Task description"
          placeholder="Add a note…"
          onChange={(e) =>
            patchLocalTask(a.id, { description: e.target.value })
          }
          onBlur={() =>
            autoSaveTask(a.task.id, { description: a.task.description })
          }
          className={`mt-1 w-full resize-none break-words bg-transparent text-[13px]
            leading-relaxed outline-none placeholder:text-[#7497ad]
            ${done ? "text-[#8dafc1]" : "text-[#afcddd]"}`}
        />

        {/* footer: date + status badge */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {a.task?.due_date ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium
                ${done ? "text-[#8dafc1] line-through" : t.accent}`}
            >
              📅 {friendlyDate(a.task.due_date)}
            </span>
          ) : (
            <span className="text-[11px] text-[#7497ad]">No date</span>
          )}

          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.badge}`}
          >
            {t.label}
          </span>
        </div>

        {savingTaskId === a.task?.id && (
          <div className="mt-1 text-[10px] text-[#8dafc1]">Saving…</div>
        )}
      </div>
    );
  };

  /* ================= RENDER ================= */
  return (
    <CleaningTheme className="tn-theme"><div className="tn-board mx-auto w-full max-w-5xl">
      <style>{CLEANING_STYLES}</style>
      {error && <p className="tn-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></p>}
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
      <div className="mb-5 rounded-2xl border border-[#7dd3fc33] bg-[#0f263b]/70 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="tn-kicker"><CleaningSparkle /> A little order, a fresh start</p>
            <h2 className="text-xl font-extrabold tracking-tight text-[#e0f0f7]">
              My Notes
            </h2>
            <p className="text-xs text-[#8dafc1]">
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
                className="text-[#284b60]"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-[#8de2c3] transition-all duration-500"
                strokeDasharray={`${(progress / 100) * 97.4} 97.4`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#afcddd]">
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
              className="h-40 animate-pulse rounded-2xl border border-[#7dd3fc26] bg-[#193a50]"
            />
          ))}
        </div>
      )}

      {/* ---------- Empty ---------- */}
      {!loading && total === 0 && (
        <div className="rounded-3xl border border-dashed border-[#7dd3fc33] bg-[#0f263b]/50 py-16 text-center">
          <div className="text-4xl">🌿</div>
          <p className="mt-2 font-semibold text-[#afcddd]">Nothing on the board</p>
          <p className="text-sm text-[#8dafc1]">
            A clear board for a fresh start. New tasks will appear here.
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
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#9ebfd1]">
                  {t.label}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${t.badge}`}
                >
                  {items.length}
                </span>
                <div className="ml-1 h-px flex-1 bg-[#193a50]" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a, i) => (
                  renderNoteCard({ a, index: i })
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
            className="w-full space-y-4 rounded-t-3xl bg-[#0f263b] p-6 shadow-2xl sm:w-[26rem] sm:rounded-3xl"
            role="dialog" aria-modal="true" aria-label="Edit note"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-10 rounded-full bg-[#315165] sm:hidden" />
            <h3 className="text-lg font-bold text-[#e0f0f7]">Edit note</h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#8dafc1]">Title</label>
              <input
                value={editingTask.title || ""}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, title: e.target.value })
                }
                className="w-full rounded-xl border border-[#7dd3fc33] p-3 text-sm outline-none focus:border-[#8cdece]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#8dafc1]">
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
                className="w-full resize-none rounded-xl border border-[#7dd3fc33] p-3 text-sm outline-none focus:border-[#8cdece]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#8dafc1]">
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
                className="w-full rounded-xl border border-[#7dd3fc33] p-3 text-sm outline-none focus:border-[#8cdece]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEditingTask(null)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#9ebfd1] hover:bg-[#193a50]"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-xl bg-[#2b796f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#318577] active:scale-95"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div></CleaningTheme>
  );
}
const CLEANING_STYLES = `
.cleaning-theme.tn-theme{min-height:0;background:radial-gradient(ellipse at top right,#225b7044,transparent 65%),#071321;border-radius:20px;color:#deeff8;overflow:visible}.cleaning-theme .tn-theme .ct-page-atmosphere{display:none}.tn-board{position:relative;padding:20px;min-width:0}.tn-kicker{display:flex;align-items:center;gap:7px;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;color:#92dacd;margin:0 0 8px!important}.tn-kicker svg{width:18px;height:18px}.tn-board h2{font-size:23px;letter-spacing:-.03em}.tn-card{min-width:0;border-radius:15px!important;padding:15px!important;box-shadow:0 8px 24px #0002!important;position:relative;overflow:hidden}.tn-card:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:#91d7eb}.tn-overdue:before{background:#efafc5}.tn-today:before{background:#e9d6a7}.tn-done:before{background:#99e8c5}.tn-board button{min-height:40px}.tn-card button[aria-pressed]{min-width:40px;color:#082f36}.tn-card textarea{padding:5px 2px;border-radius:6px;resize:vertical;min-height:39px}.tn-card textarea:focus-visible{outline:2px solid #8ce5ce;outline-offset:3px}.tn-card button:focus-visible,.tn-board button:focus-visible{outline:2px solid #9fefda;outline-offset:2px}.tn-card textarea[aria-label="Task description"]{min-height:68px}.tn-board [role=dialog]{background:radial-gradient(ellipse at top,#285b6055,transparent 70%),#0c2034;border:1px solid #8acbdc44;max-height:90dvh;overflow-y:auto;color:#dfedf6}.tn-board [role=dialog] input,.tn-board [role=dialog] textarea{background:#102c42;color:#def2fa;color-scheme:dark}.tn-error{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 13px;border:1px solid #ef9db744;background:#45273b;color:#ffd4e2;border-radius:11px;font-size:12px;line-height:1.7;margin:0 0 14px}.tn-error button{min-width:36px;font-size:20px}.tn-board [role=dialog] button{min-height:44px}
@media(max-width:640px){.tn-board{padding:12px}.tn-board h2{font-size:20px}.tn-kicker{font-size:8px;letter-spacing:.04em}.tn-card{padding:13px!important}.tn-card textarea,.tn-board [role=dialog] input,.tn-board [role=dialog] textarea{font-size:16px!important}.tn-board [role=dialog]{padding:18px 14px}.tn-board section{margin-bottom:22px}}
`;
