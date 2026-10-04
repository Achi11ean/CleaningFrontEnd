import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "./AdminContext";
import SchedulesMiniCalendar from "./SchedulesMiniCalendar";
import AdminAssignClients from "./AdminAssignClients";
import Exceptions from "./Exceptions";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TYPES = { one_time: "One time", weekly: "Weekly", bi_weekly: "Every 2 weeks", monthly: "Monthly" };
const nameOf = (client) => [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "Unnamed client";
const cleanerName = (cleaner) => [cleaner.profile?.first_name, cleaner.profile?.last_name].filter(Boolean).join(" ") || cleaner.username || "Cleaner";
const weekday = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return (new Date(year, month - 1, day).getDay() + 6) % 7;
};
const dateLabel = (value) => {
  if (!value) return "No start date";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const timeLabel = (value) => {
  if (!value) return "—";
  const [hour, minute] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};

function Modal({ title, subtitle, onClose, busy = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => { node.close(); document.body.style.overflow = overflow; previousFocus?.focus?.(); };
  }, []);
  return <dialog ref={ref} className="cs-modal" aria-labelledby="cs-modal-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="cs-modal-heading"><div><h2 id="cs-modal-title">{title}</h2><p>{subtitle}</p></div><button type="button" className="cs-icon" aria-label="Close dialog" disabled={busy} onClick={onClose}>×</button></header>
    {children}
  </dialog>;
}

export default function ClientSchedulesAdmin() {
  const { authAxios } = useAdmin();
  const [schedules, setSchedules] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("calendar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionCtx, setActionCtx] = useState(null);
  const [exceptionCtx, setExceptionCtx] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editError, setEditError] = useState("");
  const mutationRef = useRef(false);
  const requestRef = useRef(0);

  const loadSchedules = useCallback(async () => {
    if (!authAxios) return false;
    const request = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/schedules");
      if (request === requestRef.current) setSchedules(Array.isArray(data) ? data : []);
      return true;
    } catch (err) {
      if (request === requestRef.current) setError(err.response?.data?.error || "Unable to load schedules. Please try again.");
      return false;
    } finally { if (request === requestRef.current) setLoading(false); }
  }, [authAxios]);

  useEffect(() => { loadSchedules(); return () => { requestRef.current += 1; }; }, [loadSchedules]);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();
    return schedules.filter((schedule) => {
      const text = [nameOf(schedule.client), DAYS[schedule.day_of_week] || "", TYPES[schedule.schedule_type] || "", ...(schedule.client?.cleaners || []).map(cleanerName)].join(" ").toLowerCase();
      return (status === "all" || schedule.status === status) && (!query || text.includes(query));
    });
  }, [schedules, search, status]);

  const startEdit = (schedule) => {
    setEditError("");
    setEditing(schedule);
    setEditForm({ schedule_type: schedule.schedule_type, start_date: schedule.start_date || "", start_time: schedule.start_time?.slice(0, 5) || "", end_time: schedule.end_time?.slice(0, 5) || "", description: schedule.description || "", status: schedule.status || "active", day_of_week: schedule.schedule_type === "one_time" ? null : weekday(schedule.start_date) });
  };
  const closeEdit = () => { if (!mutationRef.current) { setEditing(null); setEditError(""); } };
  const change = (key, value) => { setEditForm((previous) => ({ ...previous, [key]: value })); setEditError(""); };
  const saveEdit = async (event) => {
    event.preventDefault();
    if (!authAxios || mutationRef.current) return;
    if (!editForm.start_date || !editForm.start_time || !editForm.end_time) return setEditError("Choose a start date and both times.");
    if (editForm.end_time <= editForm.start_time) return setEditError("End time must be after start time.");
    mutationRef.current = true;
    setSaving(true);
    setEditError("");
    try {
      await authAxios.patch(`/schedules/${editing.id}`, { ...editForm, day_of_week: editForm.schedule_type === "one_time" ? null : weekday(editForm.start_date) });
      setEditing(null);
      await loadSchedules();
    } catch (err) { setEditError(err.response?.data?.error || "Unable to save changes. Please try again."); }
    finally { mutationRef.current = false; setSaving(false); }
  };
  const deleteSchedule = async (id) => {
    if (!authAxios || mutationRef.current) return;
    if (!window.confirm("Delete this entire schedule, including its recurring occurrences and exceptions?")) return;
    mutationRef.current = true;
    setDeleting(id);
    setError("");
    try {
      await authAxios.delete(`/schedules/${id}`);
      // Invalidate any older in-flight list request before refreshing.
      requestRef.current += 1;
      setSchedules((previous) => previous.filter((schedule) => schedule.id !== id));
      await loadSchedules();
    } catch (err) { setError(err.response?.data?.error || "Unable to delete this schedule."); }
    finally { mutationRef.current = false; setDeleting(null); }
  };
  const updateCleaners = (cleaners) => {
    const clientId = editing.client.id;
    setEditing((previous) => previous ? { ...previous, client: { ...previous.client, cleaners } } : previous);
    setSchedules((previous) => previous.map((schedule) => schedule.client?.id === clientId ? { ...schedule, client: { ...schedule.client, cleaners } } : schedule));
  };

  return <CleaningTheme className="cs-theme">
    <style>{styles}</style>
    <section className="cs-app" aria-label="Client schedules">
      <header className="cs-heading">
        <div className="cs-title-group"><span className="cs-brand"><CleaningSparkle /></span><div><p className="cs-eyebrow">A Breath of Fresh Air</p><h1>Client schedules</h1><p className="cs-subtitle">A clear view of every cleaning.</p></div></div>
        <button type="button" className="cs-button cs-refresh" disabled={loading || !authAxios} onClick={loadSchedules}>{loading ? "Refreshing…" : "Refresh"}</button>
      </header>

      <div className="cs-workspace">
        <div className="cs-toolbar">
          <div className="cs-view-switch" role="group" aria-label="Schedule view">
            <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>Calendar</button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>Schedules</button>
          </div>
          <div className="cs-filters"><label className="cs-search"><span className="cs-sr">Search schedules</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client, cleaner or day" /></label>
            <label><span className="cs-sr">Filter by status</span><select className="cs-status-select" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></label>
          </div>
        </div>
        <div className="cs-meta"><span>{filteredSchedules.length} of {schedules.length} schedules</span><span>{view === "calendar" ? "Select a cleaning to make changes" : "Manage recurrence, times and your team"}</span></div>
        {error && <div className="cs-alert" role="alert">{error} <button type="button" onClick={loadSchedules} disabled={loading}>Retry</button></div>}
        {loading && <div role="status" className="cs-loading">Updating schedules…</div>}
        {!loading && !schedules.length && !error && <div className="cs-empty"><h2>No schedules yet</h2><p>Client cleaning schedules will appear here.</p></div>}
        {!!schedules.length && <>
          {!filteredSchedules.length && <div className="cs-empty"><h2>No matching schedules</h2><p>Try a different name, day or status.</p><button type="button" className="cs-button" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</button></div>}
          {/* Keep mounted across view changes so the calendar retains its selected month. */}
          <div hidden={view !== "calendar" || !filteredSchedules.length} className="cs-calendar">
            <SchedulesMiniCalendar schedules={filteredSchedules} onEdit={(context) => { if (context.schedule.schedule_type === "one_time") startEdit(context.schedule); else setActionCtx(context); }} onDelete={deleteSchedule} />
          </div>
          <div hidden={view !== "list"} className="cs-list">
            {filteredSchedules.map((schedule) => <article className="cs-row" key={schedule.id}>
              <div className="cs-client-cell"><span className={`cs-status-dot cs-${schedule.status || "ended"}`} aria-hidden="true"/><div><h2>{nameOf(schedule.client)}</h2><p>{TYPES[schedule.schedule_type] || schedule.schedule_type} · <span className="cs-capitalize">{schedule.status}</span></p></div></div>
              <div className="cs-timing"><strong>{timeLabel(schedule.start_time)} – {timeLabel(schedule.end_time)}</strong><p>{schedule.schedule_type !== "one_time" && DAYS[schedule.day_of_week] ? `${DAYS[schedule.day_of_week]} · From ` : ""}{dateLabel(schedule.start_date)}</p></div>
              <div className="cs-team"><span className="cs-label">Assigned cleaners</span><div className="cs-chips">{schedule.client?.cleaners?.length ? schedule.client.cleaners.map((cleaner, index) => <span className="cs-chip" key={cleaner.assignment_id ?? cleaner.id ?? index}>{cleaner.profile?.photo_url ? <img src={cleaner.profile.photo_url} alt="" loading="lazy" /> : <span className="cs-avatar" aria-hidden="true">{cleanerName(cleaner)[0]}</span>}{cleanerName(cleaner)}</span>) : <span className="cs-unassigned">Not assigned</span>}</div></div>
              {schedule.description && <p className="cs-description">{schedule.description}</p>}
              <div className="cs-row-actions"><button type="button" className="cs-button" onClick={() => startEdit(schedule)} disabled={saving || deleting !== null} aria-label={`Edit schedule for ${nameOf(schedule.client)}`}>Edit schedule</button><button type="button" className="cs-delete" onClick={() => deleteSchedule(schedule.id)} disabled={deleting !== null || saving} aria-label={`Delete schedule for ${nameOf(schedule.client)}`}>{deleting === schedule.id ? "Deleting…" : "Delete"}</button></div>
            </article>)}
          </div>
        </>}
      </div>

      {actionCtx && <Modal title="Edit cleaning" subtitle={`${nameOf(actionCtx.schedule.client)} · ${dateLabel(actionCtx.occurrenceDate)}`} onClose={() => setActionCtx(null)}>
        <div className="cs-modal-body cs-choices"><button type="button" className="cs-choice" onClick={() => { setExceptionCtx(actionCtx); setActionCtx(null); }}><span className="cs-choice-icon">1</span><span><strong>This occurrence</strong><small>Change its date and times, or cancel it.</small></span><span aria-hidden="true">›</span></button><button type="button" className="cs-choice" onClick={() => { startEdit(actionCtx.schedule); setActionCtx(null); }}><span className="cs-choice-icon">↻</span><span><strong>Entire schedule</strong><small>Update recurrence, regular times and cleaners.</small></span><span aria-hidden="true">›</span></button></div>
      </Modal>}
      {exceptionCtx && <Exceptions schedule={exceptionCtx.schedule} occurrenceDate={exceptionCtx.occurrenceDate} exceptionId={exceptionCtx.exceptionId} isException={exceptionCtx.isException} onClose={() => setExceptionCtx(null)} onSuccess={async () => { if (!await loadSchedules()) throw new Error("Schedule refresh failed"); }} />}
      {editing && <Modal title="Edit schedule" subtitle={nameOf(editing.client)} onClose={closeEdit} busy={saving}>
        <form onSubmit={saveEdit}>
          <div className="cs-modal-body">
            <p className="cs-notice">Changes apply to the entire schedule.</p>
            <fieldset disabled={saving} className="cs-form-grid"><legend className="cs-sr">Schedule details</legend>
              <label>Repeat<select value={editForm.schedule_type} onChange={(event) => change("schedule_type", event.target.value)}>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Status<select value={editForm.status} onChange={(event) => change("status", event.target.value)}><option value="active">Active</option><option value="paused">Paused</option><option value="ended">Ended</option></select></label>
              <label className="cs-full">Start date<input type="date" required value={editForm.start_date} onChange={(event) => change("start_date", event.target.value)} />{editForm.schedule_type !== "one_time" && editForm.start_date && <small>{DAYS[weekday(editForm.start_date)]}</small>}</label>
              <label>Start time<input type="time" required value={editForm.start_time} onChange={(event) => change("start_time", event.target.value)} /></label>
              <label>End time<input type="time" required value={editForm.end_time} onChange={(event) => change("end_time", event.target.value)} /></label>
              <label className="cs-full">Notes <span className="cs-optional">(optional)</span><textarea rows={2} value={editForm.description} onChange={(event) => change("description", event.target.value)} placeholder="Instructions for this schedule" /></label>
            </fieldset>
            {editing.client && <details className="cs-assignment"><summary>Assigned cleaners <span>{editing.client.cleaners?.length || 0}</span></summary><p className="cs-assignment-note">Assignments are saved separately and apply to this client’s schedules.</p><div className="cs-assignment-content"><AdminAssignClients client={editing.client} onUpdated={updateCleaners} /></div></details>}
            {editError && <p className="cs-alert" role="alert">{editError}</p>}
          </div>
          <footer className="cs-modal-footer"><button type="button" className="cs-button" onClick={closeEdit} disabled={saving}>Cancel</button><button type="submit" className="cs-button cs-primary" disabled={saving || !authAxios}>{saving ? "Saving…" : "Save changes"}</button></footer>
        </form>
      </Modal>}
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.cs-theme{min-height:0;border-radius:20px;--cs-surface:#0d1b2d;--cs-border:#294052;--cs-muted:#adbdce}
.cs-theme .ct-page-atmosphere{position:absolute;opacity:.25;z-index:0}
.cs-theme .ct-content{z-index:1}
.cs-theme .cs-app{width:97%;margin:0 auto;padding:20px 0;color:var(--ct-ink)}
.cs-theme .cs-app h1,.cs-theme .cs-app h2{font-family:inherit;letter-spacing:-.025em;font-weight:650}
.cs-heading,.cs-title-group,.cs-toolbar,.cs-filters,.cs-meta,.cs-client-cell,.cs-row-actions,.cs-modal-heading,.cs-modal-footer{display:flex;align-items:center}
.cs-heading{justify-content:space-between;gap:12px;margin-bottom:18px}.cs-title-group{gap:12px;min-width:0}
.cs-brand{display:grid;place-items:center;width:44px;height:44px;flex-shrink:0;border-radius:14px;background:#67e8f913;border:1px solid #67e8f933;color:var(--ct-teal)}.cs-brand svg{width:23px;height:23px}
.cs-theme .cs-eyebrow{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ct-mint);margin-bottom:4px}.cs-theme .cs-heading h1{font-size:clamp(20px,2.5vw,27px);line-height:1.2}.cs-theme .cs-subtitle{font-size:12px;color:var(--cs-muted);margin-top:5px}
.cs-workspace{border:1px solid var(--cs-border);border-radius:16px;overflow:hidden;background:var(--cs-surface)}
.cs-toolbar{justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px;border-bottom:1px solid var(--cs-border)}
.cs-view-switch{display:flex;gap:3px;padding:3px;border-radius:11px;background:#061222;border:1px solid var(--cs-border)}
.cs-theme .cs-view-switch button{min-height:38px;padding:7px 16px;border:0;border-radius:8px;background:transparent;color:#b4c6d8;font-size:13px;font-weight:600}.cs-theme .cs-view-switch button[aria-pressed=true]{background:#164353;color:#b8fff0}
.cs-filters{gap:8px;flex:1;justify-content:flex-end;min-width:0}.cs-search{display:flex;align-items:center;gap:8px;min-width:0;width:min(350px,100%);background:#071524;border:1px solid var(--cs-border);border-radius:10px;padding:0 10px}.cs-search svg{width:18px;height:18px;flex-shrink:0;color:var(--cs-muted)}
.cs-search input{border:0;outline:0;background:transparent;color:#edfaff;width:100%;min-width:0;min-height:42px;font:inherit;font-size:14px}.cs-search:focus-within{outline:2px solid var(--ct-teal);outline-offset:2px}.cs-search input::placeholder{color:#92a9bf}
.cs-status-select{min-height:44px;border:1px solid var(--cs-border);border-radius:10px;padding:7px 9px;background:#071524;color:#e6f5ff;font:inherit;font-size:13px;color-scheme:dark}
.cs-theme .cs-button,.cs-theme .cs-delete,.cs-theme .cs-icon{min-height:42px;border-radius:10px;border:1px solid var(--cs-border);background:#13293c;color:#e7f8ff;padding:8px 13px;font-size:13px;font-weight:600;line-height:1.3}.cs-theme .cs-button:hover{background:#1b394d}.cs-theme button:disabled{cursor:wait;opacity:.5}.cs-theme .cs-primary{background:#91ebd4;border-color:#91ebd4;color:#073c39}.cs-theme .cs-primary:hover{background:#b4f7e5}
.cs-theme .cs-delete{color:#ffb8c1;background:transparent;border-color:transparent}.cs-theme .cs-delete:hover{background:#ff567612}.cs-meta{justify-content:space-between;gap:8px;padding:10px 14px;color:var(--cs-muted);font-size:11px}
/* The supplied calendar owns its month navigation and recurrence logic. A light canvas keeps its existing event colors legible. */
.cs-calendar{background:#f8fafc;color:#172b3b;padding:12px;overflow-x:auto;color-scheme:light}.cs-calendar h1,.cs-calendar h2,.cs-calendar h3{color:#172b3b}.cs-calendar button{font-family:inherit}.cs-theme .cs-calendar :is(button,a):focus-visible{outline:2px solid #0f766e;outline-offset:2px}
.cs-row{display:grid;grid-template-columns:minmax(170px,1.1fr) minmax(170px,1fr) minmax(160px,1fr) auto;align-items:center;gap:12px;padding:16px;border-top:1px solid var(--cs-border)}.cs-row:first-child{border-top:0}.cs-row:hover{background:#ffffff03}.cs-client-cell{gap:10px;min-width:0}.cs-theme .cs-client-cell h2{font-size:14px;overflow-wrap:anywhere}.cs-theme .cs-client-cell p,.cs-theme .cs-timing p{font-size:12px;color:var(--cs-muted);margin-top:5px}.cs-status-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;background:#94a3b8}.cs-active{background:#6ee7b7}.cs-paused{background:#f5ca72}.cs-capitalize{text-transform:capitalize}.cs-timing strong{font-size:13px;font-weight:550}.cs-label{font-size:10px;color:var(--cs-muted)}.cs-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}.cs-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:#163446;border-radius:20px;padding:3px 8px 3px 3px;color:#def9f6}.cs-chip img,.cs-avatar{width:22px;height:22px;border-radius:50%;object-fit:cover}.cs-avatar{display:grid;place-items:center;background:#2a5b68;color:#d6fff3;font-size:10px}.cs-unassigned{font-size:12px;color:var(--cs-muted)}.cs-theme .cs-description{grid-column:1/-1;grid-row:2;font-size:12px;color:var(--cs-muted);overflow-wrap:anywhere}.cs-row-actions{gap:4px;justify-content:flex-end;grid-column:4;grid-row:1}
.cs-empty{text-align:center;padding:34px 16px}.cs-theme .cs-empty h2{font-size:17px}.cs-theme .cs-empty p{font-size:13px;color:var(--cs-muted);margin:8px 0 16px}.cs-loading{padding:8px 14px;color:#a7f3d0;font-size:12px}.cs-theme .cs-alert{padding:10px 12px;margin:10px 12px;border:1px solid #fda4af55;border-radius:10px;background:#472337;color:#ffd3db;font-size:13px}.cs-alert button{background:transparent;color:inherit;border:0;text-decoration:underline;min-height:36px;margin-left:8px}
.cs-modal{margin:auto;width:calc(100% - 20px);max-width:520px;max-height:90dvh;overflow:auto;background:#0d1b2d;color:#edfaff;border:1px solid #365366;border-radius:18px;padding:0;box-shadow:0 24px 90px #0008;color-scheme:dark}.cs-modal::backdrop{background:#020912b8;backdrop-filter:blur(5px)}.cs-modal-heading{justify-content:space-between;gap:10px;padding:15px 16px;border-bottom:1px solid var(--cs-border)}.cs-theme .cs-modal-heading h2{font-size:18px}.cs-theme .cs-modal-heading p{font-size:12px;color:var(--cs-muted);margin-top:4px}.cs-theme .cs-icon{width:42px;flex-shrink:0;padding:0;font-size:24px;background:transparent;border:0}.cs-modal-body{padding:16px}.cs-theme .cs-notice{font-size:12px;color:#b9f4e5;background:#6ee7b710;border-radius:9px;padding:9px 10px;margin-bottom:14px}.cs-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;border:0;padding:0;margin:0;min-width:0}.cs-form-grid label{font-size:12px;font-weight:600;color:#bfd1df;min-width:0}.cs-form-grid :is(input,select,textarea){display:block;width:100%;min-width:0;min-height:44px;margin-top:5px;border:1px solid #365366;border-radius:9px;background:#081525;color:#f1fbff;padding:9px 10px;font:inherit;font-size:16px;color-scheme:dark}.cs-form-grid :is(input,select,textarea):focus{outline:2px solid var(--ct-teal);outline-offset:1px}.cs-form-grid textarea{resize:vertical}.cs-form-grid small{display:block;margin-top:5px;font-weight:400;color:#9bdccb}.cs-full{grid-column:1/-1}.cs-optional{font-weight:400;color:var(--cs-muted)}.cs-modal-footer{position:sticky;bottom:0;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--cs-border);background:#0d1b2d}
.cs-assignment{border:1px solid var(--cs-border);border-radius:11px;margin-top:14px;overflow:hidden}.cs-assignment summary{cursor:pointer;padding:13px;font-size:13px;font-weight:600}.cs-assignment summary span{float:right;color:var(--ct-mint)}.cs-theme .cs-assignment-note{padding:0 12px 10px;font-size:11px;color:var(--cs-muted)}.cs-assignment-content{background:#f8fafc;color:#172b3b;padding:12px;color-scheme:light}.cs-choices{display:grid;gap:10px}.cs-theme .cs-choice{display:flex;align-items:center;gap:12px;text-align:left;width:100%;padding:14px 12px;border:1px solid var(--cs-border);border-radius:12px;color:#ecfaff;background:#122a3a}.cs-theme .cs-choice:hover{border-color:#67e8f988;background:#173847}.cs-choice>span:nth-child(2){flex:1}.cs-choice strong{display:block;font-size:14px}.cs-choice small{display:block;font-size:12px;color:var(--cs-muted);margin-top:4px;line-height:1.5}.cs-choice-icon{display:grid;place-items:center;width:33px;height:33px;border-radius:9px;background:#6ee7b717;color:var(--ct-mint)}.cs-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:1050px){.cs-row{grid-template-columns:1fr 1fr}.cs-team{grid-column:1}.cs-row-actions{grid-column:2;grid-row:2}.cs-theme .cs-description{grid-row:auto}.cs-filters{flex-basis:350px}}
@media(max-width:600px){.cs-theme .cs-app{width:100%;padding:12px 6px}.cs-theme.cs-theme{border-radius:14px}.cs-heading{margin-bottom:12px}.cs-title-group{gap:8px}.cs-brand{width:36px;height:36px;border-radius:11px}.cs-theme .cs-eyebrow{font-size:8px}.cs-theme .cs-subtitle{font-size:11px}.cs-theme .cs-refresh{padding:7px 9px;font-size:12px}.cs-toolbar{padding:8px;gap:8px}.cs-view-switch{width:100%}.cs-theme .cs-view-switch button{flex:1;min-height:40px}.cs-filters{flex-basis:100%;gap:6px}.cs-search{flex:1}.cs-search input{font-size:16px}.cs-status-select{max-width:115px;font-size:12px}.cs-meta{padding:9px;font-size:10px;align-items:flex-start}.cs-meta span:last-child{text-align:right;max-width:48%}.cs-calendar{padding:6px}.cs-row{padding:12px 10px;gap:12px 8px}.cs-theme .cs-client-cell h2{font-size:13px}.cs-timing{text-align:right}.cs-timing strong{font-size:12px}.cs-team{min-width:0}.cs-row-actions{gap:0;flex-wrap:wrap}.cs-theme .cs-row-actions button{font-size:12px;padding:8px;min-height:44px}.cs-modal-body{padding:12px}.cs-modal-heading{padding:12px}.cs-modal-footer{padding:10px 12px}.cs-workspace{border-radius:12px}}
`;
