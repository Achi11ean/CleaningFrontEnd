import { useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import toast from "react-hot-toast";

export default function Exceptions({
  schedule,
  occurrenceDate,
  exceptionId,
  isException,
  onClose,
  onSuccess,
}) {
  const { axios } = useAuthorizedAxios();

  const [mode, setMode] = useState("cancel"); // cancel | reschedule
  const [replacementDate, setReplacementDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!axios) return;

    setLoading(true);
    try {
      await axios.post(`/schedules/${schedule.id}/exceptions`, {
        original_date: occurrenceDate,
        replacement_date: mode === "reschedule" ? replacementDate : null,
        reason,
      });

      toast.success("Schedule exception saved");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create exception");
    } finally {
      setLoading(false);
    }
  };

  const deleteException = async () => {
    const ok = window.confirm(
      "Delete this rescheduled date and restore the original?"
    );
    if (!ok) return;

    try {
      await axios.delete(`/schedule-exceptions/${exceptionId}`);
      toast.success("Reschedule removed");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to delete reschedule");
    }
  };

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm  flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl  w-full max-w-md max-h-[600px] overflow-auto">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b  bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h3 className="text-lg font-bold tracking-wide">
          📅 Modify Recurring Cleaning
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          Adjust a single occurrence without changing the full schedule
        </p>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-5">
        
        {/* ORIGINAL DATE */}
        <div className="rounded-xl bg-slate-50 border px-4 py-3">
            {/* CLIENT */}
<div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
    Client
  </p>
  <p className="text-lg font-bold text-gray-800 mt-0.5">
    {schedule?.client?.first_name} {schedule?.client?.last_name}
  </p>
</div>

          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Original Scheduled Date
          </p>
          <p className="text-base font-bold text-gray-800 mt-1">
            {occurrenceDate}
          </p>
        </div>

        {/* MODE SELECTION */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            What would you like to do?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("cancel")}
              className={`
                rounded-xl border px-4 py-3 text-sm font-semibold transition
                ${
                  mode === "cancel"
                    ? "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200"
                    : "bg-white hover:bg-gray-50"
                }
              `}
            >
              ❌ Cancel This Date
              <div className="text-xs font-normal mt-1 text-gray-500">
                Skip this occurrence only
              </div>
            </button>

            <button
              onClick={() => setMode("reschedule")}
              className={`
                rounded-xl border px-4 py-3 text-sm font-semibold transition
                ${
                  mode === "reschedule"
                    ? "bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200"
                    : "bg-white hover:bg-gray-50"
                }
              `}
            >
              🔁 Reschedule
              <div className="text-xs font-normal mt-1 text-gray-500">
                Move to a new date
              </div>
            </button>
          </div>
        </div>

        {/* REPLACEMENT DATE */}
        {mode === "reschedule" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              New Date
            </label>
            <input
              type="date"
              value={replacementDate}
              onChange={(e) => setReplacementDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* REASON */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Client unavailable, weather delay…"
            className="w-full rounded-xl border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="px-6 py-4 border-t bg-gray-50 flex flex-col gap-3">
        
        {isException && (
          <button
            onClick={deleteException}
            className="w-full rounded-xl px-4 py-2 text-sm font-semibold
              bg-red-600 text-white hover:bg-red-700 transition"
          >
            🗑 Delete This Reschedule
          </button>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
          >
            Close
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Confirm Changes"}
          </button>
        </div>
      </div>
    </div>
  </div>
);

}
