import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CreateSchedules from "./CreateSchedules";
import { CleaningSparkle } from "./CleaningTheme";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addWeeks, addMonths, isAfter, isBefore, parseISO, format, isSameMonth, isSameDay, isValid } from "date-fns";

const ALL = { id: "all", type: "all", label: "All employees" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const keyOf = (date) => format(date, "yyyy-MM-dd");
const userKey = (user) => `${user.type}:${user.id}`;
const clientName = (schedule) => [schedule.client?.first_name, schedule.client?.last_name].filter(Boolean).join(" ") || "Client cleaning";
const personName = (person) => [person.profile?.first_name, person.profile?.last_name].filter(Boolean).join(" ") || person.username || "Employee";
const sameOwner = (owner, selected) => selected.id === "all" || (String(owner?.id) === String(selected.id) && owner?.type === selected.type);
const clock = (value) => {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date(2000, 0, 1, hour, minute);
  return isValid(date) ? format(date, "h:mm a") : "";
};
const timeRange = (item) => item.allDay ? "All day" : [clock(item.start), clock(item.end)].filter(Boolean).join(" – ");

// Pure occurrence builder, also used by the month and agenda views.
export function buildCalendarEvents(schedules, appointments, timeOff, selectedUser, rangeStart, rangeEnd) {
  const map = {};
  const first = keyOf(rangeStart), last = keyOf(rangeEnd);
  const put = (date, event) => { if (date >= first && date <= last) (map[date] ||= []).push(event); };
  schedules.forEach((schedule) => {
    if (selectedUser.id !== "all" && !(schedule.client?.cleaners || []).some((cleaner) => sameOwner(cleaner, selectedUser))) return;
    if (!schedule.start_date) return;
    const start = parseISO(schedule.start_date);
    if (!isValid(start)) return;
    const exceptions = Array.isArray(schedule.exceptions) ? schedule.exceptions : [];
    const canceled = new Set(exceptions.map((exception) => exception.original_date));
    const addCleaning = (date, exception = null) => put(date, {
      id: exception ? `exception-${exception.id}` : `cleaning-${schedule.id}-${date}`,
      kind: exception ? "moved" : "cleaning", title: clientName(schedule), schedule,
      start: exception?.start_time ?? schedule.start_time,
      end: exception?.end_time ?? schedule.end_time,
      occurrenceDate: date, isException: !!exception,
      exceptionId: exception?.id ?? null, originalDate: exception?.original_date ?? date,
    });
    if (schedule.schedule_type === "one_time") {
      if (!canceled.has(keyOf(start))) addCleaning(keyOf(start));
    } else {
      // Preserve the existing weekly, biweekly and sequential monthly recurrence rules.
      let cursor = start;
      while (!isAfter(cursor, rangeEnd)) {
        const date = keyOf(cursor);
        if (!isBefore(cursor, rangeStart) && !canceled.has(date)) addCleaning(date);
        if (schedule.schedule_type === "weekly") cursor = addWeeks(cursor, 1);
        else if (schedule.schedule_type === "bi_weekly") cursor = addWeeks(cursor, 2);
        else if (schedule.schedule_type === "monthly") cursor = addMonths(cursor, 1);
        else break;
      }
    }
    exceptions.forEach((exception) => { if (exception.replacement_date) addCleaning(exception.replacement_date, exception); });
  });
  timeOff.forEach((request) => {
    if (!sameOwner(request.owner, selectedUser)) return;
    (Array.isArray(request.entries) ? request.entries : []).forEach((entry, index) => {
      if (!entry.request_date) return;
      put(entry.request_date, { id: `off-${request.id}-${index}`, kind: "off", title: request.owner?.display_name || "Employee", start: entry.start_time, end: entry.end_time, allDay: entry.is_all_day || !entry.start_time, request, entry });
    });
  });
  appointments.forEach((appointment) => {
    if (!sameOwner({ id: appointment.assigned_user_id, type: appointment.assigned_user_type }, selectedUser) || !appointment.scheduled_for) return;
    const date = parseISO(appointment.scheduled_for);
    if (!isValid(date)) return;
    put(keyOf(date), { id: `appointment-${appointment.id}`, kind: "consultation", title: appointment.client_name || "Consultation", start: format(date, "HH:mm"), appointment });
  });
  Object.values(map).forEach((events) => events.sort((a, b) => (a.allDay ? "" : a.start || "99:99").localeCompare(b.allDay ? "" : b.start || "99:99") || a.title.localeCompare(b.title)));
  return map;
}

function CalendarDialog({ title, subtitle, onClose, busy, wide, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current, focus = document.activeElement, overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; focus?.focus?.(); };
  }, []);
  return <dialog ref={ref} className={`smc-dialog${wide ? " smc-wide" : ""}`} aria-labelledby="smc-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <header><div><h3 id="smc-dialog-title">{title}</h3>{subtitle && <p>{subtitle}</p>}</div><button type="button" aria-label="Close dialog" className="smc-icon" disabled={busy} onClick={onClose}>×</button></header>{children}
  </dialog>;
}

export default function SchedulesMiniCalendar({ schedules = [], onEdit, onDelete, onCreated }) {
  const { axios } = useAuthorizedAxios();
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => keyOf(new Date()));
  const [view, setView] = useState("month");
  const [expandedDays, setExpandedDays] = useState({});
  const [users, setUsers] = useState([ALL]);
  const [selectedUser, setSelectedUser] = useState(ALL);
  const [appointments, setAppointments] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [createDate, setCreateDate] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editingAppt, setEditingAppt] = useState(false);
  const [apptForm, setApptForm] = useState({});
  const [mutation, setMutation] = useState(null);
  const [mutationError, setMutationError] = useState("");
  const requestRef = useRef(0), busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!axios) return;
    const request = ++requestRef.current;
    setLoading(true);
    setLoadError("");
    const endpoints = ["/appointments", "/admin/all", "/staff/all", "/time-off/all?status=approved"];
    const results = await Promise.allSettled(endpoints.map((url) => axios.get(url)));
    if (request !== requestRef.current) return;
    const data = (index) => results[index].status === "fulfilled" && Array.isArray(results[index].value.data) ? results[index].value.data : null;
    if (data(0)) setAppointments(data(0));
    if (data(3)) setTimeOff(data(3));
    setUsers((previous) => [ALL, ...["admin", "staff"].flatMap((type, index) => data(index + 1)?.map((person) => ({ id: person.id, type, label: personName(person) })) ?? previous.filter((person) => person.type === type))]);
    const failed = ["consultations", "administrators", "staff", "time off"].filter((_, index) => results[index].status === "rejected");
    if (failed.length) setLoadError(`Could not refresh ${failed.join(", ")}. Some entries may be missing or out of date.`);
    setLoading(false);
  }, [axios]);
  useEffect(() => { refresh(); return () => { requestRef.current += 1; }; }, [refresh]);

  const calendarDays = useMemo(() => {
    const days = [], last = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    for (let day = startOfWeek(currentMonth, { weekStartsOn: 0 }); day <= last; day = addDays(day, 1)) days.push(day);
    return days;
  }, [currentMonth]);
  const byDate = useMemo(() => buildCalendarEvents(schedules, appointments, timeOff, selectedUser, calendarDays[0], calendarDays[calendarDays.length - 1]), [schedules, appointments, timeOff, selectedUser, calendarDays]);
  const selectedEvents = byDate[selectedDate] || [];
  const monthDays = calendarDays.filter((day) => isSameMonth(day, currentMonth));
  const monthCount = monthDays.reduce((count, day) => count + (byDate[keyOf(day)]?.length || 0), 0);
  const navigate = (offset) => { const month = addMonths(currentMonth, offset); setCurrentMonth(month); setSelectedDate(keyOf(month)); };
  const today = () => { const now = new Date(); setCurrentMonth(startOfMonth(now)); setSelectedDate(keyOf(now)); };
  const chooseDay = (day) => { setSelectedDate(keyOf(day)); if (!isSameMonth(day, currentMonth)) setCurrentMonth(startOfMonth(day)); };
  const closeDetail = () => { if (!busyRef.current) { setDetail(null); setEditingAppt(false); setMutationError(""); } };
  const openEvent = (event) => {
    if (event.kind === "cleaning" || event.kind === "moved") {
      onEdit?.({ schedule: event.schedule, occurrenceDate: event.occurrenceDate, isException: event.isException, exceptionId: event.exceptionId, originalDate: event.originalDate });
      return;
    }
    setDetail(event); setEditingAppt(false); setMutationError("");
    if (event.appointment) setApptForm({ scheduled_for: format(parseISO(event.appointment.scheduled_for), "yyyy-MM-dd'T'HH:mm"), notes: event.appointment.notes || "" });
  };
  const mutateAppointment = async (operation, event) => {
    event?.preventDefault();
    if (!axios || busyRef.current || !detail?.appointment) return;
    if (operation === "delete" && !window.confirm("Delete this consultation?")) return;
    if (operation === "save" && !apptForm.scheduled_for) return setMutationError("Choose a date and time.");
    busyRef.current = true; setMutation(operation); setMutationError("");
    const appointment = detail.appointment;
    const path = `/clients/${appointment.client_id}/appointments/${appointment.id}`;
    try {
      if (operation === "delete") await axios.delete(path);
      else {
        // Keep timezone-aware timestamps aware; preserve unchanged timestamps exactly.
        const previous = format(parseISO(appointment.scheduled_for), "yyyy-MM-dd'T'HH:mm");
        const aware = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(appointment.scheduled_for);
        const scheduled_for = apptForm.scheduled_for === previous ? appointment.scheduled_for : aware ? parseISO(apptForm.scheduled_for).toISOString() : apptForm.scheduled_for;
        await axios.patch(path, { scheduled_for, notes: apptForm.notes, assigned_user_id: appointment.assigned_user_id ?? "", assigned_user_type: appointment.assigned_user_type ?? "" });
      }
      setAppointments((previous) => operation === "delete" ? previous.filter((item) => item.id !== appointment.id) : previous.map((item) => item.id === appointment.id ? { ...item, notes: apptForm.notes, scheduled_for: apptForm.scheduled_for } : item));
      setDetail(null); setEditingAppt(false);
      await refresh();
    } catch (err) { setMutationError(err.response?.data?.error || `Unable to ${operation} consultation. Please try again.`); }
    finally { busyRef.current = false; setMutation(null); }
  };
  const eventButton = (item, compact = false) => <button type="button" key={item.id} className={`smc-event smc-${item.kind}${compact ? " smc-compact" : ""}`} onClick={() => openEvent(item)} title={`${item.title} · ${timeRange(item)}${item.kind === "moved" ? " · Rescheduled" : ""}`} disabled={(item.kind === "cleaning" || item.kind === "moved") && !onEdit}>
    <span className="smc-event-dot" aria-hidden="true"/><span className="smc-event-copy"><strong>{compact && item.start ? `${clock(item.start)} · ` : ""}{item.title}</strong>{!compact && <small>{timeRange(item)} · {item.kind === "off" ? "Time off" : item.kind === "consultation" ? "Consultation" : item.kind === "moved" ? "Rescheduled cleaning" : "Cleaning"}{item.schedule?.status && item.schedule.status !== "active" ? ` · ${item.schedule.status}` : ""}</small>}</span>
  </button>;

  return <section className="smc" aria-label="Cleaning calendar">
    <style>{styles}</style>
    <div className="smc-toolbar"><div className="smc-navigation"><button type="button" className="smc-button" onClick={today}>Today</button><div className="smc-arrows"><button type="button" className="smc-icon" aria-label="Previous month" onClick={() => navigate(-1)}>‹</button><button type="button" className="smc-icon" aria-label="Next month" onClick={() => navigate(1)}>›</button></div><h3 aria-live="polite">{format(currentMonth, "MMMM yyyy")}</h3></div><div className="smc-actions"><div className="smc-switch" role="group" aria-label="Calendar layout"><button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button><button type="button" aria-pressed={view === "agenda"} onClick={() => setView("agenda")}>Agenda</button></div><button type="button" className="smc-button smc-primary" onClick={() => setCreateDate(selectedDate)}>+ Create</button></div></div>
    <div className="smc-filterbar"><label className="smc-employee"><span className="smc-sr">Filter by employee</span><select value={userKey(selectedUser)} onChange={(event) => setSelectedUser(users.find((user) => userKey(user) === event.target.value) || ALL)}>{users.map((user) => <option value={userKey(user)} key={userKey(user)}>{user.label}{user.type !== "all" ? ` · ${user.type === "admin" ? "Admin" : "Staff"}` : ""}</option>)}</select></label><div className="smc-legend"><span className="smc-cleaning">Cleaning</span><span className="smc-moved">Moved</span><span className="smc-consultation">Consultation</span><span className="smc-off">Time off</span></div><button type="button" className="smc-refresh" disabled={loading || !axios} onClick={refresh}>{loading ? "Updating…" : "Refresh extras"}</button></div>
    {loadError && <p role="alert" className="smc-error">{loadError} <button type="button" disabled={loading} onClick={refresh}>Retry</button></p>}
    {view === "month" ? <>
      <div className="smc-weekdays">{DAYS.map((day) => <div key={day}>{day}</div>)}</div>
      <div className="smc-grid">{calendarDays.map((day) => {
        const date = keyOf(day), events = byDate[date] || [], selected = date === selectedDate;
        const expanded = !!expandedDays[date];
        return <div className={`smc-day${!isSameMonth(day, currentMonth) ? " smc-outside" : ""}${selected ? " smc-selected" : ""}${expanded ? " smc-expanded" : ""}`} key={date} onClick={(event) => { if (event.target === event.currentTarget) { chooseDay(day); if (window.matchMedia("(min-width: 701px)").matches) setCreateDate(date); } }}>
          <div className="smc-day-top"><button type="button" className={`smc-date${isSameDay(day, new Date()) ? " smc-today" : ""}`} aria-label={`${format(day, "EEEE, MMMM d, yyyy")}, ${events.length} entries`} aria-pressed={selected} onClick={() => chooseDay(day)}>{format(day, "d")}</button><button type="button" className="smc-day-add" aria-label={`Create cleaning on ${format(day, "MMMM d")}`} onClick={() => setCreateDate(date)}>+</button></div>
          <div className="smc-desktop-events">
            <div id={`smc-events-${date}`} className="smc-day-event-list">
              {(expanded ? events : events.slice(0, 3)).map((item) => eventButton(item, true))}
            </div>
            {events.length > 3 && <button type="button" className="smc-more"
              aria-expanded={expanded} aria-controls={`smc-events-${date}`}
              aria-label={`${expanded ? "Collapse" : "Show all"} ${events.length} entries for ${format(day, "MMMM d")}`}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedDate(date);
                setExpandedDays((previous) => ({ ...previous, [date]: !previous[date] }));
              }}>
              {expanded ? "Show less" : `+${events.length - 3} more`}
            </button>}
          </div>
          <div className="smc-mobile-dots" aria-hidden="true">{[...new Set(events.map((item) => item.kind))].map((kind) => <i className={`smc-${kind}`} key={kind}/>)}{events.length > 0 && <span>{events.length}</span>}</div>
        </div>;
      })}</div>
      <section className="smc-day-agenda" aria-label="Selected day"><div className="smc-agenda-heading"><div><span className="smc-kicker">Selected day</span><h4>{format(parseISO(selectedDate), "EEEE, MMMM d")}</h4></div><span className="smc-count">{selectedEvents.length} entries</span></div>{selectedEvents.length ? <div className="smc-agenda-events">{selectedEvents.map((item) => eventButton(item))}</div> : <div className="smc-empty"><CleaningSparkle className="smc-sparkle"/><span>No entries for this day.</span><button type="button" className="smc-text-button" onClick={() => setCreateDate(selectedDate)}>Add cleaning</button></div>}</section>
    </> : <div className="smc-month-agenda">{monthCount ? monthDays.filter((day) => byDate[keyOf(day)]?.length).map((day) => <section key={keyOf(day)} className="smc-agenda-row"><div className="smc-agenda-date"><span>{format(day, "EEE")}</span><strong className={isSameDay(day, new Date()) ? "smc-today" : ""}>{format(day, "d")}</strong></div><div className="smc-agenda-events">{byDate[keyOf(day)].map((item) => eventButton(item))}</div></section>) : <div className="smc-empty">No entries this month for the selected employee.</div>}</div>}
    <div className="smc-bottom"><span>{monthCount} entries this month</span><span>Times shown in your local time</span></div>

    {detail && <CalendarDialog title={detail.kind === "off" ? "Approved time off" : editingAppt ? "Edit consultation" : "Consultation"} subtitle={detail.title} onClose={closeDetail} busy={!!mutation}>
      {detail.kind === "off" ? <div className="smc-dialog-body"><p>{format(parseISO(detail.entry.request_date), "EEEE, MMMM d, yyyy")}</p><p className="smc-detail-time">{timeRange(detail)}</p><button type="button" className="smc-button" onClick={closeDetail}>Close</button></div> : editingAppt ? <form onSubmit={(event) => mutateAppointment("save", event)}><div className="smc-dialog-body smc-form"><label>Date & time<input type="datetime-local" required value={apptForm.scheduled_for || ""} disabled={!!mutation} onChange={(event) => setApptForm((previous) => ({ ...previous, scheduled_for: event.target.value }))}/></label><label>Notes<textarea rows={3} value={apptForm.notes || ""} disabled={!!mutation} onChange={(event) => setApptForm((previous) => ({ ...previous, notes: event.target.value }))}/></label>{mutationError && <p role="alert" className="smc-error">{mutationError}</p>}</div><footer><button type="button" className="smc-button" disabled={!!mutation} onClick={() => { setEditingAppt(false); setMutationError(""); }}>Cancel</button><button type="submit" className="smc-button smc-primary" disabled={!!mutation || !axios}>{mutation === "save" ? "Saving…" : "Save changes"}</button></footer></form> : <><div className="smc-dialog-body"><p className="smc-detail-time">{format(parseISO(detail.appointment.scheduled_for), "EEEE, MMMM d · h:mm a")}</p><dl className="smc-detail-list"><dt>Assigned to</dt><dd>{detail.appointment.assigned_user_name || "Unassigned"}</dd><dt>Notes</dt><dd>{detail.appointment.notes || "No notes"}</dd></dl>{mutationError && <p role="alert" className="smc-error">{mutationError}</p>}</div><footer><button type="button" className="smc-button smc-danger" disabled={!!mutation || !axios} onClick={() => mutateAppointment("delete")}>{mutation === "delete" ? "Deleting…" : "Delete"}</button><button type="button" className="smc-button smc-primary" disabled={!!mutation || !axios} onClick={() => setEditingAppt(true)}>Edit consultation</button></footer></>}
    </CalendarDialog>}
    {createDate && <CalendarDialog title="Create cleaning" subtitle={format(parseISO(createDate), "EEEE, MMMM d, yyyy")} onClose={() => setCreateDate(null)} wide><div className="smc-create-body"><CreateSchedules defaultDate={createDate} onCreated={async (...args) => { setCreateDate(null); if (onCreated) { try { await onCreated(...args); } catch { setLoadError("Cleaning created, but schedules could not refresh. Use the page Refresh button."); } } else setLoadError("Cleaning created. Use the page Refresh button to load the new schedule."); }} /></div></CalendarDialog>}
  </section>;
}

const styles = `
.smc{--smc-bg:#0c1a2b;--smc-line:#294052;--smc-muted:var(--ct-muted,#adc4d7);--smc-ink:var(--ct-ink,#edfaff);background:var(--smc-bg);color:var(--smc-ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif;border-radius:12px;overflow:hidden;isolation:isolate;color-scheme:dark;min-width:0}.cs-calendar:has(>.smc){padding:0;background:#0c1a2b}.smc *{box-sizing:border-box}.smc button,.smc select,.smc input,.smc textarea{font-family:inherit}.smc button{cursor:pointer}.smc button:disabled{opacity:.5;cursor:default}.smc :is(button,select,input,textarea):focus-visible{outline:2px solid #67e8f9;outline-offset:2px}.smc-toolbar,.smc-navigation,.smc-actions,.smc-filterbar,.smc-legend,.smc-arrows{display:flex;align-items:center;gap:10px}.smc-toolbar{justify-content:space-between;padding:14px 12px 10px;flex-wrap:wrap}.smc .smc-toolbar h3{line-height:1.3;font-family:inherit;font-size:20px;font-weight:600;letter-spacing:-.03em;color:var(--smc-ink);margin:0}.smc .smc-button,.smc .smc-icon{border:1px solid #365166;border-radius:9px;background:#152b3d;color:#e6f5ff;min-height:40px;padding:8px 12px;font-size:12px;font-weight:600}.smc .smc-icon{width:38px;padding:0;border-color:transparent;background:transparent;font-size:25px}.smc .smc-icon:hover,.smc .smc-button:hover{background:#214156}.smc .smc-primary{background:#a5f3d5;border-color:#a5f3d5;color:#073d38}.smc .smc-primary:hover{background:#c3fbe5}.smc-arrows{gap:0}.smc-switch{display:flex;background:#071221;border:1px solid var(--smc-line);padding:3px;border-radius:9px}.smc .smc-switch button{border:0;background:transparent;color:#b8ccdf;font-size:12px;padding:8px 11px;border-radius:6px;min-height:34px}.smc .smc-switch button[aria-pressed=true]{background:#254657;color:#d2fff1}.smc-filterbar{padding:0 12px 12px;flex-wrap:wrap}.smc-employee select{max-width:260px;min-height:40px;border:1px solid var(--smc-line);border-radius:9px;padding:7px 10px;background:#102335;color:#e8f8ff;font-size:12px}.smc-legend{flex:1;gap:12px;flex-wrap:wrap;font-size:10px;color:var(--smc-muted)}.smc-legend>span:before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--event-color);margin-right:5px}.smc .smc-refresh{border:0;background:transparent;color:#a9d9dc;font-size:11px;min-height:40px;padding:6px}.smc-cleaning{--event-color:#6ee7b7;--event-bg:#12382f}.smc-moved{--event-color:#f6d080;--event-bg:#3a3020}.smc-consultation{--event-color:#c4b5fd;--event-bg:#2d2647}.smc-off{--event-color:#fda4af;--event-bg:#3e2530}.smc-weekdays,.smc-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}.smc-weekdays{border-top:1px solid var(--smc-line);border-bottom:1px solid var(--smc-line);background:#0a1625}.smc-weekdays>div{padding:9px 0;text-align:center;font-size:10px;letter-spacing:.04em;color:var(--smc-muted)}.smc-day{min-width:0;min-height:133px;border-right:1px solid var(--smc-line);border-bottom:1px solid var(--smc-line);padding:5px;cursor:pointer;position:relative}.smc-day:nth-child(7n){border-right:0}.smc-day:hover{background:#13263b}.smc-day.smc-selected{background:#142c40;box-shadow:inset 0 0 0 1px #67e8f97a}.smc-outside{background:#07121f}.smc-outside .smc-date{color:#71889e}.smc-day-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}.smc .smc-date{display:grid;place-items:center;min-height:30px;min-width:30px;padding:0;border:0;border-radius:50%;font-size:11px;background:transparent;color:#d7e8f7}.smc .smc-date.smc-today,.smc .smc-agenda-date .smc-today{background:#8cebd7;color:#073c39}.smc .smc-day-add{border:0;background:transparent;color:#91afc5;min-height:28px;min-width:24px;border-radius:6px;font-size:16px}.smc .smc-day-add:hover{background:#ffffff12;color:white}.smc-desktop-events,.smc-day-event-list{display:grid;gap:4px}.smc-expanded .smc-compact .smc-event-copy strong{white-space:normal;overflow-wrap:anywhere;line-height:1.4}.smc .smc-event{display:flex;align-items:center;gap:9px;width:100%;min-width:0;text-align:left;border:1px solid transparent;border-left:3px solid var(--event-color);border-radius:7px;background:var(--event-bg);color:#f0fbff;min-height:52px;padding:8px 10px}.smc .smc-event:hover{border-color:var(--event-color)}.smc-event-copy{display:block;min-width:0}.smc-event-copy strong{display:block;font-size:12px;font-weight:600;overflow-wrap:anywhere}.smc-event-copy small{display:block;color:#d3dfeb;font-size:11px;line-height:1.5;margin-top:3px}.smc .smc-compact{padding:5px 6px;min-height:27px;border-left-width:2px;border-radius:4px;gap:0}.smc-compact .smc-event-copy strong{font-size:10px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.smc .smc-more{min-height:27px;font-size:10px;background:transparent;border:0;color:#c4d8ea;text-align:left;padding:3px 5px}.smc-event-dot{display:none}.smc-mobile-dots{display:none}.smc-day-agenda{padding:15px 12px}.smc-agenda-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.smc-kicker{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#88c9bf}.smc .smc-agenda-heading h4{margin:4px 0 0;font-size:14px;font-weight:600;color:var(--smc-ink)}.smc-count{font-size:11px;color:var(--smc-muted)}.smc-agenda-events{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:7px;flex:1;min-width:0}.smc-empty{padding:16px 8px;display:flex;align-items:center;justify-content:center;gap:10px;color:var(--smc-muted);font-size:12px;flex-wrap:wrap}.smc-sparkle{width:18px;height:18px;color:#8cebd7}.smc .smc-text-button{background:transparent;border:0;color:#b1f3e3;min-height:40px;font-size:12px;text-decoration:underline}.smc-bottom{display:flex;justify-content:space-between;gap:8px;padding:10px 12px;border-top:1px solid var(--smc-line);font-size:10px;color:var(--smc-muted)}.smc-month-agenda{max-height:650px;overflow:auto;border-top:1px solid var(--smc-line)}.smc-agenda-row{display:flex;gap:12px;padding:14px 12px;border-bottom:1px solid var(--smc-line)}.smc-agenda-date{width:40px;flex-shrink:0;text-align:center}.smc-agenda-date span{font-size:10px;color:var(--smc-muted);display:block;margin-bottom:5px}.smc-agenda-date strong{font-size:18px;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;font-weight:500}.smc .smc-error{margin:10px;padding:10px;border:1px solid #fda4af55;border-radius:8px;background:#3b2430;color:#ffd0d6;font-size:12px;line-height:1.6}.smc-error button{border:0;background:transparent;color:inherit;text-decoration:underline;min-height:36px}.smc-dialog{margin:auto;width:calc(100% - 20px);max-width:450px;max-height:90dvh;overflow:auto;border:1px solid #355267;border-radius:16px;background:#0d1b2d;color:#edfaff;padding:0;box-shadow:0 25px 80px #0008;color-scheme:dark}.smc-dialog.smc-wide{max-width:700px}.smc-dialog::backdrop{background:#020912b8;backdrop-filter:blur(5px)}.smc-dialog>header{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid var(--smc-line);padding:14px}.smc .smc-dialog h3{font-family:inherit;font-size:17px;font-weight:600;color:#edfaff;margin:0}.smc .smc-dialog header p{font-size:12px;color:var(--smc-muted);margin:4px 0 0}.smc-dialog-body{padding:14px;line-height:1.6;font-size:13px}.smc .smc-detail-time{font-size:14px;font-weight:600;margin:0 0 14px}.smc-detail-list{margin:0}.smc-detail-list dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--smc-muted);margin-top:14px}.smc-detail-list dd{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}.smc-dialog footer{position:sticky;bottom:0;display:flex;justify-content:flex-end;gap:8px;padding:12px 14px;border-top:1px solid var(--smc-line);background:#0d1b2d}.smc .smc-danger{color:#fecdd3;background:#432735;border-color:#6b3648;margin-right:auto}.smc-form{display:grid;gap:14px}.smc-form label{font-size:12px;font-weight:600}.smc-form input,.smc-form textarea{display:block;width:100%;min-width:0;min-height:44px;background:#071525;color:#edfaff;border:1px solid #365267;border-radius:9px;padding:9px 10px;font-size:16px;margin-top:5px}.smc-form textarea{resize:vertical}.smc-create-body{padding:12px;background:#f8fafc;color:#172b3b;color-scheme:light}.smc .smc-create-body h3{color:inherit}.smc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
@media(max-width:700px){.smc-toolbar{padding:10px 8px;gap:8px}.smc-navigation{gap:3px;flex:1}.smc .smc-toolbar h3{font-size:17px;margin-left:3px}.smc .smc-button{min-height:44px;padding:8px 10px}.smc .smc-icon{min-height:44px;width:30px}.smc-actions{width:100%;justify-content:space-between}.smc-switch{flex:1}.smc .smc-switch button{flex:1;min-height:36px}.smc-filterbar{padding:0 8px 10px;gap:7px}.smc-employee{flex:1;min-width:0}.smc-employee select{width:100%;max-width:none;font-size:16px;min-height:44px}.smc-legend{order:3;flex-basis:100%;gap:10px;font-size:9px}.smc-day{min-height:66px;padding:3px;cursor:default}.smc-day-top{justify-content:center;margin:0}.smc .smc-date{width:100%;min-height:38px;border-radius:8px;font-size:12px}.smc .smc-date.smc-today{width:34px;border-radius:50%}.smc-day-add,.smc-desktop-events{display:none}.smc-mobile-dots{display:flex;gap:3px;align-items:center;justify-content:center;min-height:16px;pointer-events:none}.smc-mobile-dots i{width:4px;height:4px;border-radius:50%;background:var(--event-color)}.smc-mobile-dots span{font-size:8px;color:#b8cbdb;margin-left:1px}.smc-weekdays>div{font-size:9px;padding:8px 0}.smc-day-agenda{padding:12px 8px}.smc-agenda-events{grid-template-columns:1fr}.smc-bottom{font-size:9px;padding:10px 8px}.smc-agenda-row{padding:12px 8px;gap:8px}.smc .smc-event{min-height:56px}.smc-dialog-body{padding:12px}}
`;
