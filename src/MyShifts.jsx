import { useEffect, useRef, useState } from "react";
import { useStaff } from "./StaffContext";
import { format } from "date-fns";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dateTime = iso => {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : format(date, "MMM d, yyyy • h:mm a");
};
const time12 = value => {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  const date = new Date(); date.setHours(h, m, 0, 0);
  return format(date, "h:mm a");
};
const duration = value => {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const seconds = Math.max(0, Number(value));
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
};
const personName = person => [person?.profile?.first_name, person?.profile?.last_name].filter(Boolean).join(" ") || person?.username || "Cleaner";

export default function MyShifts({ mode = "staff" }) {
  // Preserve the existing authentication source and mode-specific routes.
  const { authAxios } = useStaff();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewImages, setViewImages] = useState([]);
  const dialog = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(""); setViewImages([]);
      try {
        const res = await authAxios.get(mode === "admin" ? "/admin/shifts" : "/staff/shifts");
        if (!Array.isArray(res.data)) throw new Error("Unexpected shift history response.");
        if (!cancelled) setShifts(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || "Unable to load shift history. Please refresh to try again.");
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [authAxios, mode, refreshKey]);

  useEffect(() => {
    if (!viewImages.length) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    const onKey = event => {
      if (event.key === "Escape") setViewImages([]);
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll("button, a[href]");
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); if (previous?.isConnected) previous.focus(); };
  }, [viewImages]);

  return <CleaningTheme className="sh-theme"><style>{styles}</style>
    <section className="sh-panel" aria-label="Work shift history" aria-busy={loading}>
      <header className="sh-header"><span className="sh-mark" aria-hidden="true"><CleaningSparkle /></span><div><p className="sh-kicker">A record of your cleanings</p><h2>{mode === "admin" ? "All work shifts" : "My work shifts"}</h2></div><button type="button" className="sh-refresh" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
      <p className="sh-intro">Review your cleaning visits, team details, and shift photos.</p>
      {loading ? <p className="sh-empty" role="status">Loading shift history…</p> : error ? <p className="sh-error" role="alert">{error}</p> : shifts.length === 0 ? <div className="sh-empty"><strong>No shifts yet</strong><p>Your work shift history will appear here.</p></div> : <>
        <p className="sh-count">{shifts.length} {shifts.length === 1 ? "shift" : "shifts"}</p>
        <div className="sh-grid">{shifts.map(shift => {
          const clientName = [shift.client?.first_name, shift.client?.last_name].filter(Boolean).join(" ") || "Client cleaning";
          const active = !shift.check_out_at;
          const photos = Array.isArray(shift.image_urls) ? shift.image_urls : [];
          return <article className="sh-card" key={shift.id}>
            <header className="sh-card-header"><div><p className="sh-kicker">Shift #{shift.id}</p><h3>{clientName}</h3></div><span className={`sh-status ${active ? "is-active" : ""}`}>{active ? "In progress" : "Checked out"}</span></header>
            {mode === "admin" && <p className="sh-owner"><span>Staff</span> {shift.staff ? personName(shift.staff) : shift.staff_id ?? "—"}</p>}
            <dl className="sh-times"><div><dt>Check in</dt><dd>{dateTime(shift.check_in_at)}</dd></div><div><dt>Check out</dt><dd>{active ? "Still checked in" : dateTime(shift.check_out_at)}</dd></div><div className="sh-duration"><dt>Duration</dt><dd>{duration(shift.duration_seconds)}</dd></div></dl>
            <div className="sh-schedule"><h4>Schedule</h4>{shift.schedule ? <><p className="sh-schedule-type">{(shift.schedule.schedule_type || "Scheduled").replace(/_/g, " ")}{shift.schedule.day_of_week != null && <span> · {WEEKDAYS[shift.schedule.day_of_week] || `Day ${shift.schedule.day_of_week}`}</span>}</p><p className="sh-schedule-time">{time12(shift.schedule.start_time)} – {time12(shift.schedule.end_time)}</p>{shift.schedule.description && <p className="sh-description">{shift.schedule.description}</p>}</> : <p className="sh-description">Manual / Unscheduled</p>}</div>
            <div className="sh-team"><h4>Assigned team</h4>{shift.client?.cleaners?.length ? <div className="sh-team-list">{shift.client.cleaners.map((cleaner, index) => <span key={cleaner.assignment_id ?? `${cleaner.type}-${cleaner.id}-${index}`}>{personName(cleaner)}<small>{cleaner.type}</small></span>)}</div> : <p className="sh-description">None assigned</p>}</div>
            <details className="sh-notes"><summary>Shift notes <span>{shift.message ? "View note" : "No notes"}</span></summary><p>{shift.message || "No notes were added to this shift."}</p></details>
            <footer className="sh-card-footer"><span>{photos.length ? `${photos.length} shift ${photos.length === 1 ? "photo" : "photos"}` : "No photos attached"}</span>{photos.length > 0 && <button type="button" onClick={() => setViewImages(photos)}>View photos ({photos.length})</button>}</footer>
          </article>;
        })}</div>
      </>}
    </section>
    {viewImages.length > 0 && <div className="sh-overlay" onClick={() => setViewImages([])}><div className="sh-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="sh-photo-title" onClick={event => event.stopPropagation()}><header><div><p className="sh-kicker">The finishing touches</p><h3 id="sh-photo-title">Shift photos ({viewImages.length})</h3></div><button ref={closeButton} type="button" onClick={() => setViewImages([])} aria-label="Close shift photos">✕</button></header><p className="sh-photo-help">Select a photo to open the full image in a new tab.</p><div className="sh-photos">{viewImages.map((url, index) => <a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Shift photo ${index + 1}`} loading="lazy" /></a>)}</div></div></div>}
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.sh-theme{min-height:0;background:radial-gradient(ellipse at top right,#205c7544,transparent 65%),#071321;border-radius:20px;overflow:visible}.cleaning-theme .sh-theme .ct-page-atmosphere{display:none}.sh-panel{position:relative;padding:22px;max-width:1400px;margin:auto;color:#dceef8;min-width:0}.sh-header{display:flex;align-items:center;gap:11px}.sh-mark{width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;background:#1a414e;border:1px solid #91e4d744;border-radius:12px;color:#a6eed8}.sh-mark svg{width:23px;height:23px}.sh-kicker{font-size:9px!important;letter-spacing:.09em;text-transform:uppercase;color:#97d8d7!important;font-weight:700;margin:0 0 5px!important}.sh-header h2{font-size:23px;line-height:1.3;letter-spacing:-.03em;font-weight:700;margin:0}.sh-refresh{margin-left:auto;min-height:44px;padding:9px 12px;flex-shrink:0;border:1px solid #7dd3fc40;background:#17374d;color:#c3edf1;border-radius:10px;font-size:11px;font-weight:650;cursor:pointer}.sh-refresh:disabled{opacity:.5;cursor:wait}.sh-intro{font-size:12px;color:#9fbfd1;line-height:1.8;margin:13px 0!important}.sh-count{font-size:10px;color:#9ec3d3;margin:16px 0 10px!important}.sh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:14px}.sh-card{display:flex;flex-direction:column;min-width:0;background:linear-gradient(130deg,#132d43,#0c1f32);border:1px solid #7dd3fc33;border-radius:16px;padding:17px}.sh-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.sh-card-header>div{min-width:0}.sh-card h3{font-size:18px;line-height:1.4;font-weight:700;letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}.sh-status{flex-shrink:0;padding:5px 8px;border:1px solid #91cce233;border-radius:99px;background:#1c394c;color:#bddce9;font-size:9px;line-height:1.5;font-weight:650}.sh-status.is-active{background:#174436;border-color:#a0e9c63b;color:#baf4d8}.sh-owner{font-size:11px;color:#d1e8f1;margin:10px 0 0!important;overflow-wrap:anywhere}.sh-owner span{color:#93b8ca;margin-right:5px}.sh-times{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:13px;background:#091d30;border:1px solid #7dd3fc20;border-radius:11px;margin:15px 0}.sh-times dt{font-size:9px;color:#92b5c8;margin-bottom:5px}.sh-times dd{font-size:11px;color:#d7ebf4;font-weight:550;line-height:1.7;margin:0}.sh-duration{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #7dd3fc22;padding-top:9px}.sh-duration dt{margin:0}.sh-duration dd{color:#b5eed7;font-size:18px;font-weight:700}.sh-card h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#91bdcf;margin:0 0 8px}.sh-schedule{margin-bottom:16px}.sh-schedule-type{font-size:11px;line-height:1.6;text-transform:capitalize;color:#bfdae7;margin:0 0 5px!important}.sh-schedule-time{font-size:12px;font-weight:650;color:#b1ead5;margin:0!important}.sh-description{font-size:11px;color:#9bbacc;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0 0!important}.sh-team{margin-bottom:15px}.sh-team-list{display:flex;flex-wrap:wrap;gap:6px}.sh-team-list>span{display:flex;flex-wrap:wrap;align-items:center;gap:6px;max-width:100%;overflow-wrap:anywhere;padding:6px 8px;border:1px solid #7dd3fc29;border-radius:8px;background:#173448;font-size:10px;color:#cce4ef}.sh-team-list small{font-size:9px;text-transform:capitalize;color:#93b7c8}.sh-notes{border:1px solid #7dd3fc24;border-radius:10px;background:#0c2235;margin-top:auto}.sh-notes summary{min-height:44px;padding:12px;font-size:11px;font-weight:650;cursor:pointer;color:#bedde9}.sh-notes summary span{float:right;font-size:9px;color:#8fb6c9;font-weight:500}.sh-notes>p{padding:0 12px 12px;font-size:11px;line-height:1.8;color:#b7d1df;white-space:pre-wrap;overflow-wrap:anywhere;margin:0!important}.sh-card-footer{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px;margin-top:12px;min-height:44px}.sh-card-footer>span{font-size:10px;color:#91b5c7}.sh-card-footer button{min-height:44px;padding:10px 12px;background:linear-gradient(110deg,#a1dcf1,#95e6ce);border:1px solid #a0e4d5;border-radius:10px;color:#103443;font-size:11px;font-weight:700;cursor:pointer}.sh-theme button:focus-visible,.sh-theme summary:focus-visible,.sh-theme a:focus-visible{outline:3px solid #a1efda;outline-offset:3px}.sh-empty{padding:25px 16px;text-align:center;font-size:12px;line-height:1.7;color:#a8c4d5;border:1px dashed #7dd3fc33;background:#0c2134;border-radius:13px}.sh-empty strong{font-size:15px;color:#d9eef8}.sh-empty p{margin:7px 0 0!important}.sh-error{padding:12px;border:1px solid #efabc344;background:#44273b;color:#ffd5e3;border-radius:11px;font-size:12px;line-height:1.7}.sh-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:#020916d9;backdrop-filter:blur(7px)}.sh-dialog{width:100%;max-width:900px;max-height:90dvh;overflow-y:auto;padding:20px;background:#0d2236;border:1px solid #8bd9de44;border-radius:18px;color:#d9edf7;box-shadow:0 20px 70px #0008}.sh-dialog>header{display:flex;align-items:center;justify-content:space-between;gap:12px}.sh-dialog h3{font-size:20px;font-weight:700;margin:0}.sh-dialog header button{min-width:44px;min-height:44px;border:1px solid #7dd3fc38;background:#1b3d50;color:#d7f1f7;border-radius:10px;cursor:pointer}.sh-photo-help{font-size:11px;color:#a2c2d3;line-height:1.7;margin:12px 0 16px!important}.sh-photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.sh-photos img{width:100%;height:190px;object-fit:cover;border:1px solid #7dd3fc33;border-radius:11px;background:#153347}.sh-photos a:hover{opacity:.85}
@media(max-width:640px){.sh-panel{padding:13px}.sh-header{gap:8px;flex-wrap:wrap}.sh-header h2{font-size:19px}.sh-kicker{font-size:8px!important}.sh-mark{width:34px;height:34px}.sh-refresh{padding:8px;font-size:10px}.sh-intro{font-size:11px}.sh-card{padding:13px}.sh-card h3{font-size:16px}.sh-times{padding:11px;gap:10px}.sh-times dd{font-size:10px}.sh-duration dd{font-size:18px}.sh-dialog{padding:14px}.sh-dialog h3{font-size:18px}.sh-photos{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sh-photos img{height:150px}.sh-grid{grid-template-columns:1fr}}
`;
