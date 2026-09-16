import { useEffect, useMemo, useState } from "react";
import { addDays, addWeeks, addMonths, isAfter, format } from "date-fns";
import StartShift from "./StartShift";
import { useStaff } from "./StaffContext";
import ActiveShiftPanel from "./ActiveShiftPanel";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

function parseLocalDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function expandSchedules(schedules, rangeStart, rangeEnd) {
  const events = [];
  schedules.forEach(s => {
    if (s.status !== "active") return;
    const cancelled = new Set();
    const replacements = {};
    if (Array.isArray(s.exceptions) && s.schedule_type !== "one_time") {
      s.exceptions.forEach(ex => {
        if (ex.original_date) cancelled.add(ex.original_date);
        if (ex.replacement_date) replacements[ex.replacement_date] = ex;
      });
    }
    const startDate = parseLocalDate(s.start_date);
    if (!startDate) return;
    const makeEvent = (date, ex = null) => {
      const start = new Date(date);
      const end = new Date(date);
      const [sh, sm] = (ex?.start_time ?? s.start_time ?? "").split(":").map(Number);
      const [eh, em] = (ex?.end_time ?? s.end_time ?? "").split(":").map(Number);
      if (![sh, sm, eh, em].every(Number.isFinite)) return;
      start.setHours(sh, sm, 0, 0);
      end.setHours(eh, em, 0, 0);
      events.push({ id: `${s.id}-${format(start, "yyyy-MM-dd")}`, start, end, resource: s });
    };
    if (s.schedule_type === "one_time") {
      makeEvent(startDate);
      return;
    }
    let cursor = new Date(startDate);
    // The backend uses Monday=0; JavaScript uses Sunday=0.
    if (s.day_of_week != null) {
      const weekday = Number(s.day_of_week);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return;
      while (cursor.getDay() !== (weekday + 1) % 7) cursor = addDays(cursor, 1);
    }
    while (!isAfter(cursor, rangeEnd)) {
      const key = format(cursor, "yyyy-MM-dd");
      if (!isAfter(rangeStart, cursor) && !cancelled.has(key)) makeEvent(cursor);
      if (s.schedule_type === "weekly") cursor = addWeeks(cursor, 1);
      else if (s.schedule_type === "bi_weekly") cursor = addWeeks(cursor, 2);
      else if (s.schedule_type === "monthly") cursor = addMonths(cursor, 1);
      else break;
    }
    Object.entries(replacements).forEach(([key, ex]) => {
      const date = parseLocalDate(key);
      if (date && date >= rangeStart && date <= rangeEnd) makeEvent(date, ex);
    });
  });
  return events;
}

export default function NextShiftBanner() {
  const { authAxios, staff } = useStaff();
  const [schedules, setSchedules] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const refresh = () => { setNow(new Date()); setRefreshKey(k => k + 1); };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError("");
      try {
        const [schedRes, shiftRes] = await Promise.all([
          authAxios.get("/schedules"), authAxios.get("/staff/shifts/active"),
        ]);
        if (cancelled) return;
        if (!Array.isArray(schedRes.data)) throw new Error("Unable to read the schedule response.");
        setSchedules(schedRes.data);
        setActiveShift(shiftRes.data?.active ? {
          ...shiftRes.data.shift,
          client: shiftRes.data.client ?? shiftRes.data.shift?.client,
        } : null);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || "Unable to load your shifts. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authAxios, refreshKey]);

  const events = useMemo(() => expandSchedules(schedules, addDays(now, -30), addDays(now, 120)), [schedules, now]);
  const nextShift = useMemo(() => events.filter(event =>
    staff?.id != null && event.resource.client?.cleaners?.some(cleaner =>
      cleaner.type === "staff" && String(cleaner.id) === String(staff.id)
    ) && event.start > now
  ).sort((a, b) => a.start - b.start)[0], [events, staff?.id, now]);
  const client = activeShift?.client ?? nextShift?.resource.client;
  const name = [client?.first_name, client?.last_name].filter(Boolean).join(" ") || "Client cleaning";

  return <CleaningTheme className="nsb-theme">
    <style>{styles}</style>
    <section className="nsb-card" aria-label="Your cleaning schedule" aria-busy={loading}>
      <header className="nsb-header">
        <span className="nsb-icon" aria-hidden="true"><CleaningSparkle /></span>
        <div><p className="nsb-eyebrow">Your cleaning day</p><h3>{activeShift ? "Cleaning in progress" : "Up next"}</h3></div>
        <button className="nsb-refresh" type="button" onClick={refresh} disabled={loading} aria-label="Refresh shifts">{loading ? "Refreshing…" : "↻ Refresh"}</button>
      </header>
      {error && <p className="nsb-error" role="alert">{error}</p>}
      {loading && !activeShift && <p className="nsb-empty" role="status">Finding your next cleaning…</p>}
      {activeShift && <>
        <div className="nsb-active"><span className="nsb-badge"><i /> Checked in</span><p>Your shared tasks, photos, and shift notes are below.</p></div>
        <ActiveShiftPanel refreshKey={refreshKey} onShiftUpdated={refresh} />
      </>}
      {!loading && !error && !activeShift && nextShift && <>
        <div className="nsb-booking">
          <div className="nsb-date" aria-hidden="true"><span>{format(nextShift.start, "MMM")}</span><strong>{format(nextShift.start, "d")}</strong><small>{format(nextShift.start, "EEE")}</small></div>
          <div className="nsb-details"><span className="nsb-label">Your next scheduled shift</span><h4>{name}</h4><p>{format(nextShift.start, "EEEE, MMM d, yyyy")}</p><div className="nsb-time">{format(nextShift.start, "h:mm a")} <span>–</span> {format(nextShift.end, "h:mm a")}</div></div>
        </div>
        <StartShift schedule={nextShift.resource} compact onStarted={refresh} />
      </>}
      {!loading && !error && !activeShift && !nextShift && <div className="nsb-empty"><strong>No upcoming shifts</strong><p>Your next assigned cleaning will appear here when it’s scheduled.</p></div>}
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.nsb-theme{min-height:0;border-radius:20px;background:radial-gradient(ellipse at top right,#1d64784a,transparent 65%),#071321;overflow:visible}
.cleaning-theme .nsb-theme .ct-page-atmosphere,.nsb-theme .ass-theme .ct-page-atmosphere,.nsb-theme .asp-theme .ct-page-atmosphere{display:none}
.nsb-card{position:relative;padding:20px;border:1px solid #7dd3fc30;border-radius:20px;color:#e0f1fa;min-width:0}
.nsb-header{display:flex;align-items:center;gap:11px;margin-bottom:18px}.nsb-icon{display:grid;place-items:center;flex-shrink:0;width:40px;height:40px;border:1px solid #7ee8d943;border-radius:13px;background:#163b49;color:#99f2d7}.nsb-icon svg{width:23px;height:23px}.nsb-eyebrow{margin:0!important;color:#91cedd;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.nsb-header h3{margin:4px 0 0;font-size:20px;font-weight:700;letter-spacing:-.025em;line-height:1.3}.nsb-refresh{margin-left:auto;flex-shrink:0;min-height:44px;padding:9px 12px;border:1px solid #80cce53b;border-radius:10px;background:#132d41;color:#bcecf0;font-size:11px;font-weight:650;cursor:pointer}.nsb-refresh:hover{background:#1b4055}.nsb-refresh:disabled{opacity:.6;cursor:wait}.nsb-refresh:focus-visible{outline:3px solid #9af4dc;outline-offset:3px}
.nsb-booking{display:flex;align-items:center;gap:17px;padding:17px;border:1px solid #7dd3fc29;border-radius:15px;background:linear-gradient(120deg,#153248,#0e2034)}.nsb-date{display:flex;flex-direction:column;align-items:center;justify-content:center;flex:0 0 72px;min-height:91px;border:1px solid #8ce8d747;border-radius:13px;background:#173f4a;color:#b4f4e4}.nsb-date>span{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}.nsb-date strong{font-size:33px;font-weight:750;line-height:1.15;letter-spacing:-.04em;margin:3px 0}.nsb-date small{font-size:10px;color:#95c9cf}.nsb-details{min-width:0}.nsb-label{font-size:9px;color:#91bfd1}.nsb-details h4{font-size:19px;font-weight:700;line-height:1.4;letter-spacing:-.02em;margin:3px 0 6px;overflow-wrap:anywhere}.nsb-details p{font-size:11px;color:#a6c3d4;margin:0 0 8px!important}.nsb-time{display:inline-flex;flex-wrap:wrap;gap:7px;padding:6px 9px;border:1px solid #8be9da29;border-radius:8px;background:#10363a;color:#bcf2df;font-size:11px;font-weight:650}.nsb-time span{color:#7faeb1}.nsb-active{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px}.nsb-badge{display:inline-flex;align-items:center;gap:7px;background:#133d34;color:#b2f1d3;border:1px solid #7be6b63b;border-radius:99px;padding:7px 10px;font-size:10px;font-weight:650}.nsb-badge i{width:6px;height:6px;border-radius:50%;background:#8aefbd;box-shadow:0 0 10px #7ce6b675}.nsb-active p{font-size:10px;line-height:1.6;color:#91b6c9;margin:0!important}.nsb-empty{padding:23px 16px;text-align:center;border:1px dashed #7dd3fc35;background:#0d2234;border-radius:13px;color:#a8c4d6;font-size:12px;line-height:1.7}.nsb-empty strong{display:block;color:#d4edf7;font-size:14px;font-weight:650}.nsb-empty p{margin:7px 0 0!important}.nsb-error{padding:12px;border:1px solid #f3aac340;border-radius:10px;background:#442439;color:#ffd4e3;font-size:12px;line-height:1.7;margin:0 0 13px!important}
@media(max-width:640px){.nsb-card{padding:12px;border-radius:16px}.nsb-header{gap:8px;margin-bottom:13px}.nsb-icon{width:33px;height:33px;border-radius:10px}.nsb-icon svg{width:20px;height:20px}.nsb-eyebrow{font-size:8px;letter-spacing:.08em}.nsb-header h3{font-size:16px}.nsb-refresh{padding:8px;font-size:10px}.nsb-booking{gap:12px;padding:12px}.nsb-date{flex-basis:59px;min-height:83px}.nsb-date strong{font-size:29px}.nsb-details h4{font-size:16px}.nsb-details p{font-size:10px}.nsb-time{font-size:10px}.nsb-label{font-size:8px}}
`;
