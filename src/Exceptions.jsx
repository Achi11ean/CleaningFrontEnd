import { useEffect, useRef, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import toast from "react-hot-toast";

const timeValue = (value) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value || "");
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
};
const dateLabel = (value) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
};
const timeLabel = (value) => {
  const normalized = timeValue(value);
  if (!normalized) return "—";
  const [hour, minute] = normalized.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit",
  });
};

// Reset the form only when switching to a different occurrence.
export default function Exceptions(props) {
  return <ExceptionDialog key={JSON.stringify([
    props.schedule?.id, props.occurrenceDate, props.exceptionId,
  ])} {...props} />;
}

function ExceptionDialog({ schedule, occurrenceDate, exceptionId, isException, onClose, onSuccess }) {
  const { axios } = useAuthorizedAxios();
  const dialogRef = useRef(null);
  const pendingRef = useRef(false);
  const hasId = exceptionId !== null && exceptionId !== undefined;
  const embedded = (schedule?.exceptions || []).find((item) =>
    hasId ? String(item.id) === String(exceptionId) : item.original_date === occurrenceDate
  );
  const [existing, setExisting] = useState(embedded || null);
  const [mode, setMode] = useState(embedded?.replacement_date ? "reschedule" : "cancel");
  const [replacementDate, setReplacementDate] = useState(embedded?.replacement_date || "");
  const [startTime, setStartTime] = useState(timeValue(embedded?.start_time ?? schedule?.start_time));
  const [endTime, setEndTime] = useState(timeValue(embedded?.end_time ?? schedule?.end_time));
  const [reason, setReason] = useState(embedded?.reason || "");
  const [loadingExisting, setLoadingExisting] = useState(!embedded && (hasId || !!isException));
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [action, setAction] = useState(null);
  const [error, setError] = useState("");
  const busy = action !== null;
  const locked = busy || loadingExisting || !!loadError || !axios;
  const editing = !!existing || hasId || !!isException;
  const originalDate = existing?.original_date || occurrenceDate;
  const targetId = existing?.id ?? exceptionId;
  const clientName = [schedule?.client?.first_name, schedule?.client?.last_name].filter(Boolean).join(" ") || "Client cleaning";
  const inputClass = "block w-full min-w-0 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (embedded || (!hasId && !isException) || !axios) return;
    let active = true;
    setLoadingExisting(true);
    setLoadError("");
    axios.get(`/schedules/${schedule.id}/exceptions`).then(({ data }) => {
      if (!active) return;
      const found = data.find((item) => hasId
        ? String(item.id) === String(exceptionId)
        : item.original_date === occurrenceDate || item.replacement_date === occurrenceDate);
      if (!found) throw new Error("This exception could not be found. Close and refresh the schedule.");
      setExisting(found);
      setMode(found.replacement_date ? "reschedule" : "cancel");
      setReplacementDate(found.replacement_date || "");
      setStartTime(timeValue(found.start_time ?? schedule.start_time));
      setEndTime(timeValue(found.end_time ?? schedule.end_time));
      setReason(found.reason || "");
    }).catch((err) => {
      if (active) setLoadError(err?.response?.data?.error || err.message || "Unable to load exception.");
    }).finally(() => { if (active) setLoadingExisting(false); });
    return () => { active = false; };
  }, [axios, embedded, hasId, isException, exceptionId, occurrenceDate, schedule, retry]);

  const finish = async (message) => {
    toast.success(message);
    try {
      await onSuccess?.();
    } catch {
      toast.error("Your change was saved, but the schedule could not refresh. Please refresh the page.");
    }
    onClose?.();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (pendingRef.current || locked) return;
    setError("");
    if (!schedule?.id || !originalDate) return setError("The original schedule date is missing. Reopen this occurrence.");
    if (editing && targetId == null) return setError("The exception ID is missing. Reopen this occurrence.");
    if (mode === "reschedule") {
      if (!replacementDate || !startTime || !endTime) return setError("Choose a new date, start time, and end time.");
      if (replacementDate === originalDate) return setError("Choose a different date. The current backend does not allow time-only changes on the original date.");
      if (endTime <= startTime) return setError("End time must be after start time.");
    }
    pendingRef.current = true;
    setAction("save");
    const payload = {
      replacement_date: mode === "reschedule" ? replacementDate : null,
      start_time: mode === "reschedule" ? startTime : null,
      end_time: mode === "reschedule" ? endTime : null,
      reason: reason.trim(),
    };
    try {
      if (editing) await axios.patch(`/schedule-exceptions/${targetId}`, payload);
      else await axios.post(`/schedules/${schedule.id}/exceptions`, { ...payload, original_date: originalDate });
    } catch (err) {
      setError(err?.response?.data?.error || "Could not save this exception. Please try again.");
      return;
    } finally {
      pendingRef.current = false;
      setAction(null);
    }
    await finish(mode === "reschedule" ? "Cleaning date and times saved" : "This occurrence has been canceled");
  };

  const deleteException = async () => {
    if (pendingRef.current || locked || targetId == null) return;
    if (!window.confirm("Remove this exception and restore the original cleaning date and times?")) return;
    pendingRef.current = true;
    setAction("delete");
    setError("");
    try {
      await axios.delete(`/schedule-exceptions/${targetId}`);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not restore the original occurrence. Please try again.");
      return;
    } finally {
      pendingRef.current = false;
      setAction(null);
    }
    await finish("Original cleaning restored");
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="exception-title" aria-describedby="exception-description"
      onCancel={(event) => { event.preventDefault(); if (!pendingRef.current) onClose?.(); }}
      className="m-auto w-[calc(100%_-_1rem)] max-w-md max-h-[90dvh] overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm">
      <form onSubmit={submit} aria-busy={busy || loadingExisting}>
        <header className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id="exception-title" className="text-lg font-bold">Adjust this cleaning</h2>
            <p id="exception-description" className="mt-0.5 text-xs text-slate-500">Changes apply to this occurrence only.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50">×</button>
        </header>

        <div className="space-y-3 px-4 py-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="truncate text-sm font-bold" title={clientName}>{clientName}</p>
            <p className="mt-1 text-xs text-slate-600">Original · {dateLabel(originalDate)}</p>
            <p className="mt-0.5 text-xs text-slate-600">{timeLabel(schedule?.start_time)} – {timeLabel(schedule?.end_time)}</p>
          </div>

          {loadingExisting && <p role="status" className="text-sm text-blue-700">Loading current exception…</p>}
          {loadError && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {loadError}<button type="button" onClick={() => setRetry((value) => value + 1)} className="ml-2 min-h-[44px] font-semibold underline">Retry</button>
          </div>}
          {!axios && <p role="status" className="text-sm text-slate-600">Waiting for your authorized connection…</p>}

          <fieldset disabled={locked} className="min-w-0 space-y-3 disabled:opacity-60">
            <legend className="sr-only">Change this occurrence</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["cancel", "Cancel date", "Skip this cleaning"],
                ["reschedule", "Reschedule", "Change date & time"],
              ].map(([value, label, hint]) => (
                <label key={value} className={`cursor-pointer rounded-xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-blue-400 ${mode === value
                  ? value === "cancel" ? "border-rose-300 bg-rose-50 text-rose-800" : "border-blue-400 bg-blue-50 text-blue-800"
                  : "border-slate-200 bg-white text-slate-600"}`}>
                  <input type="radio" name="exception-mode" value={value} checked={mode === value}
                    onChange={() => { setMode(value); setError(""); }} className="sr-only" />
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="mt-0.5 block text-xs">{hint}</span>
                </label>
              ))}
            </div>

            {mode === "reschedule" ? (
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-600">New date
                  <input type="date" required value={replacementDate} onChange={(event) => { setReplacementDate(event.target.value); setError(""); }} className={`${inputClass} mt-1`} />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="min-w-0 text-xs font-semibold text-slate-600">Start time
                    <input type="time" required step="60" value={startTime} onChange={(event) => { setStartTime(event.target.value); setError(""); }} className={`${inputClass} mt-1`} />
                  </label>
                  <label className="min-w-0 text-xs font-semibold text-slate-600">End time
                    <input type="time" required step="60" value={endTime} onChange={(event) => { setEndTime(event.target.value); setError(""); }} className={`${inputClass} mt-1`} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Times apply to the new date. Keep them as shown or adjust both.</p>
              </div>
            ) : <p className="text-xs text-slate-600">This cleaning will be skipped. Your recurring schedule continues as usual.</p>}

            <label className="block text-xs font-semibold text-slate-600">Reason <span className="font-normal text-slate-400">(optional)</span>
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2}
                placeholder="Client unavailable, weather delay…" className={`${inputClass} mt-1 resize-y`} />
            </label>
          </fieldset>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        <footer className="sticky bottom-0 space-y-2 border-t border-slate-100 bg-white px-4 py-3">
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="min-h-[44px] rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Close</button>
            <button type="submit" disabled={locked} className={`min-h-[44px] flex-1 rounded-xl px-3 text-sm font-semibold text-white disabled:opacity-50 ${mode === "cancel" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {action === "save" ? "Saving…" : mode === "reschedule" ? "Save date & time" : "Confirm cancellation"}
            </button>
          </div>
          {editing && <button type="button" onClick={deleteException} disabled={locked || targetId == null}
            className="min-h-[44px] w-full rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            {action === "delete" ? "Restoring…" : "Remove exception & restore original"}
          </button>}
        </footer>
      </form>
    </dialog>
  );
}
