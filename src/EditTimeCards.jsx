import { useRef, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import toast from "react-hot-toast";
import CleaningTheme from "./CleaningTheme";

// StaffTimeEntry timestamps use UTC. Legacy serializers omit the offset.
// Explicit offsets are honored; only timezone-less API timestamps get Z.
function parseServerTime(value) {
  if (!value) return new Date(NaN);
  const normalized = String(value).trim().replace(" ", "T");
  return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`);
}
// Keep the backend's existing %Y-%m-%dT%H:%M request shape, in UTC.
function localInputToUTC(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || toDateTimeLocalValue(date.toISOString()) !== value) {
    throw new Error("This local time is invalid or falls in a daylight-saving clock change. Choose a valid time.");
  }
  return date.toISOString().slice(0, 16);
}

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = parseServerTime(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = number => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function formatLocal(value) {
  if (!value) return "—";
  const date = parseServerTime(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { weekday:"short", year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
}

export default function EditTimeCard({ entry, onUpdate, onDelete }) {
  const { role, axios } = useAuthorizedAxios();
  const [editing, setEditing] = useState(false);
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const lock = useRef(false);
  if (!["admin", "manager"].includes(role)) return null;

  const beginEdit = () => {
    // Read current props each time, including changes returned by Refresh.
    setClockIn(toDateTimeLocalValue(entry.clock_in_at));
    setClockOut(toDateTimeLocalValue(entry.clock_out_at));
    setError(""); setEditing(true);
  };
  const handleSave = async event => {
    event.preventDefault();
    if (!axios || lock.current) return;
    if (!clockIn || Number.isNaN(new Date(clockIn).getTime())) {
      setError("Enter a valid clock-in time."); return;
    }
    if (clockOut && (Number.isNaN(new Date(clockOut).getTime()) || new Date(clockOut) < new Date(clockIn))) {
      setError("Clock out must be at or after clock in."); return;
    }
    let savedClockIn, savedClockOut;
    try {
      savedClockIn = localInputToUTC(clockIn);
      savedClockOut = localInputToUTC(clockOut);
    } catch (err) { setError(err.message); return; }
    lock.current = true; setBusy("save"); setError("");
    let updated;
    try {
      const res = await axios.patch(`/admin/staff-time-entry/${entry.id}`, {
        clock_in_at: savedClockIn,
        clock_out_at: savedClockOut,
      });
      updated = res.data;
    } catch (err) {
      const message = err.response?.data?.error || "Failed to update this entry.";
      setError(message); toast.error(message); return;
    } finally { lock.current = false; setBusy(""); }
    setEditing(false); toast.success("Updated!");
    try { await onUpdate?.(updated); }
    catch { setError("Entry saved. Refresh the timecards to see the update."); }
  };
  const handleDelete = async () => {
    if (!axios || lock.current) return;
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    lock.current = true; setBusy("delete"); setError("");
    try {
      await axios.delete(`/admin/staff-time-entry/${entry.id}`);
    } catch (err) {
      const message = err.response?.data?.error || "Failed to delete this entry.";
      setError(message); toast.error(message); return;
    } finally { lock.current = false; setBusy(""); }
    toast.success("Deleted!");
    try { await onDelete?.(entry.id); }
    catch { setError("Entry deleted. Refresh the timecards to update the list."); }
  };
  const hours = ((Number(entry.duration_seconds) || 0) / 3600).toFixed(2);

  return <CleaningTheme className="et-theme"><style>{styles}</style>
    <article className="et-card" aria-label={`Time entry ${entry.id}`} aria-busy={Boolean(busy)}>
      <header className="et-header"><div><p className="et-kicker">Time entry #{entry.id}</p><h4>{hours}<span> hours</span></h4></div><span className={`et-badge ${entry.clock_out_at ? "" : "is-open"}`}>{entry.clock_out_at ? "Clocked out" : "Open entry"}</span></header>
      {error && <p className="et-error" role="alert">{error}</p>}
      {editing ? <form onSubmit={handleSave} className="et-form">
        <label>Clock in<input type="datetime-local" required value={clockIn} onChange={event => setClockIn(event.target.value)} disabled={Boolean(busy)} /></label>
        <label>Clock out<input type="datetime-local" value={clockOut} onChange={event => setClockOut(event.target.value)} disabled={Boolean(busy)} /></label>
        <p className="et-help">Times are shown in your device’s local timezone and saved as UTC.</p>
        <div className="et-actions"><button type="button" className="et-secondary" onClick={() => { setEditing(false); setError(""); }} disabled={Boolean(busy)}>Cancel</button><button type="submit" className="et-save" disabled={Boolean(busy) || !axios}>{busy === "save" ? "Saving…" : "Save changes"}</button></div>
      </form> : <>
        <dl className="et-times"><div><dt>In</dt><dd>{formatLocal(entry.clock_in_at)}</dd></div><div><dt>Out</dt><dd>{entry.clock_out_at ? formatLocal(entry.clock_out_at) : "Not clocked out"}</dd></div></dl>
        <div className="et-actions"><button type="button" className="et-secondary" onClick={beginEdit} disabled={Boolean(busy) || !axios}>Edit entry</button><button type="button" className="et-delete" onClick={handleDelete} disabled={Boolean(busy) || !axios}>{busy === "delete" ? "Deleting…" : "Delete"}</button></div>
      </>}
    </article>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.et-theme{min-height:0;background:transparent;overflow:visible}.cleaning-theme .et-theme .ct-page-atmosphere{display:none}.et-card{position:relative;min-width:0;padding:13px;border:1px solid #7dd3fc30;border-radius:12px;background:linear-gradient(130deg,#153146,#0f2438);color:#dbeef7}.et-header{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:12px}.et-kicker{font-size:8px;letter-spacing:.07em;text-transform:uppercase;color:#93bdcd;font-weight:650;margin:0 0 4px!important}.et-header h4{font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-.025em;color:#b7f0d8;margin:0}.et-header h4 span{font-size:10px;letter-spacing:0;color:#a4c5d5;font-weight:500}.et-badge{padding:5px 7px;border:1px solid #86cddd33;border-radius:99px;background:#204152;color:#bfdde8;font-size:8px;line-height:1.5;white-space:nowrap}.et-badge.is-open{background:#214935;color:#c3f1d0;border-color:#9de4b640}.et-times{display:flex;flex-direction:column;gap:9px;padding:11px;border:1px solid #7dd3fc20;border-radius:9px;background:#0a2032;margin:0}.et-times>div{display:grid;grid-template-columns:24px 1fr;gap:8px}.et-times dt{font-size:9px;font-weight:650;color:#8eb6c9;line-height:1.7}.et-times dd{font-size:11px;line-height:1.7;color:#c8e2ef;margin:0;overflow-wrap:anywhere}.et-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.et-actions button{min-height:44px;flex:1;min-width:0;border-radius:9px;padding:9px 10px;font-size:11px;font-weight:650;line-height:1.5;cursor:pointer}.et-secondary{background:#20485b;border:1px solid #8fd6e33b;color:#c7edf1}.et-delete{background:#45273b;border:1px solid #eca6bf40;color:#f9c5d8}.et-save{background:linear-gradient(110deg,#a5def0,#98e6cb);border:1px solid #ace8d8;color:#143e49}.et-actions button:disabled{opacity:.5;cursor:not-allowed}.et-actions button:focus-visible,.et-form input:focus-visible{outline:3px solid #a2ecd5;outline-offset:2px}.et-form{display:flex;flex-direction:column;gap:12px}.et-form label{display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:650;color:#a9cddc}.et-form input{width:100%;min-width:0;box-sizing:border-box;min-height:46px;border:1px solid #7dd3fc40;border-radius:9px;background:#0a2033;color:#d7edf7;padding:9px;font-size:13px;color-scheme:dark}.et-help{font-size:10px;color:#95b9cb;line-height:1.7;margin:0!important}.et-error{font-size:11px;line-height:1.7;padding:10px;border:1px solid #f1acc144;border-radius:9px;background:#472b40;color:#ffd5e2;margin:0 0 12px!important}
@media(max-width:640px){.et-card{padding:11px}.et-form input{font-size:16px}.et-times dd{font-size:10px}.et-header h4{font-size:23px}}
`;
