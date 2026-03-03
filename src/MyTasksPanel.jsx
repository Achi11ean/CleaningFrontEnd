import React from "react";

export default function MyTasksPanel({
  tasks,
  setMyTasks,
  toggleAssignment,
  autoSaveTask,
  formatDate,
  formatRepeat,
  onEditTask,
  onDeleteTask
}) {

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-700 tracking-tight">
          📝 My Tasks
        </h2>

        <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm border">
          {tasks.length} items
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {tasks.map((a) => {

          const dueDate = a.task?.due_date
            ? new Date(a.task.due_date)
            : null;

          const isOverdue =
            dueDate && !a.completed && dueDate < new Date();

          return (
            <div
              key={a.id}
              className={`
                relative p-4 rounded-2xl shadow-md border transition-all duration-200
                hover:-rotate-1 hover:shadow-lg
                ${a.completed 
                  ? "bg-emerald-50 border-emerald-200" 
                  : "bg-yellow-50 border-yellow-200"}
              `}
            >

              {/* Decorative Top Line (Notebook Feel) */}
              <div className="absolute top-0 left-0 right-0 h-2 rounded-t-2xl bg-gradient-to-r from-pink-300 via-yellow-300 to-purple-300 opacity-70"></div>

              {/* Checkbox */}
             <div className="flex justify-between items-start mb-3 mt-2">

  <button
    onClick={() => toggleAssignment(a.id)}
    className={`
      h-5 w-5 rounded-full border flex items-center justify-center transition
      ${
        a.completed
          ? "bg-emerald-500 border-emerald-500 text-white"
          : "border-slate-400 hover:border-blue-500"
      }
    `}
  >
    {a.completed && <span className="text-[11px]">✓</span>}
  </button>

  <div className="flex gap-2 text-[11px]">

    <button
      onClick={() => onEditTask(a.task)}
      className="text-blue-500 hover:text-blue-700 transition"
    >
      ✏️
    </button>

    <button
      onClick={() => onDeleteTask(a.task.id)}
      className="text-rose-400 hover:text-rose-600 transition"
    >
      🗑
    </button>



  </div>
</div>
              {/* Title */}
          <textarea
  rows={2}
  disabled={a.task?.is_archived}
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
    w-full resize-none
whitespace-pre-wrap break-words    overflow-hidden
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
                disabled={a.task?.is_archived}
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
                rows={3}
                className="text-[15px] text-slate-500 bg-transparent outline-none w-full resize-none"
              />

              {/* Footer Meta */}
              <div className="mt-3 flex justify-between items-center text-[10px]">

                {a.task?.due_date ? (
                  <span
                    className={
                      isOverdue
                        ? "text-rose-500 font-medium"
                        : "text-slate-400"
                    }
                  >
                    📅 {formatDate(a.task.due_date)}
                  </span>
                ) : (
                  <span className="text-slate-300">No due date</span>
                )}

                {a.task?.repeat_type !== "none" && (
                  <span className="text-purple-500">
                        {a.task?.repeat_type !== "none" && (
      <span className="text-[10px]  text-purple-600 px-2  rounded-full">
        🔁
      </span>
    )}
                    {formatRepeat(
                      a.task.repeat_type,
                      a.task.repeat_interval
                    )}
                    
                  </span>
                )}

              </div>

            </div>
          );
        })}

        {tasks.length === 0 && (
          <div className="col-span-full text-center text-slate-400 py-10">
            ✨ Nothing to do. You're glowing.
          </div>
        )}

      </div>
    </div>
  );
}