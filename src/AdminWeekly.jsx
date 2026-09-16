import { useEffect, useState, useMemo, useId } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import WeeklyTimeCards from "./WeeklyTimeCards";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

export default function AdminWeekly() {
  const { role, axios } = useAuthorizedAxios();
  const allowed = ["admin", "manager"].includes(role);
  const [weeks, setWeeks] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const [report, setReport] = useState(null);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [weeksError, setWeeksError] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const id = useId();

  useEffect(() => {
    let cancelled = false;
    if (!allowed || !axios) {
      setWeeks([]); setWeekStart(""); setReport(null); setWeeksLoading(false);
      return;
    }
    const loadWeeks = async () => {
      setWeeksLoading(true); setWeeksError("");
      try {
        const { data } = await axios.get("/admin/reports/weeks");
        if (!Array.isArray(data)) throw new Error("Invalid weeks response");
        if (cancelled) return;
        setWeeks(data);
        setWeekStart(current => data.some(week => week.week_start === current) ? current : data[0]?.week_start || "");
      } catch {
        if (!cancelled) setWeeksError("Failed to load weeks. Tap Refresh to try again.");
      } finally { if (!cancelled) setWeeksLoading(false); }
    };
    loadWeeks();
    return () => { cancelled = true; };
  }, [axios, allowed, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    if (!allowed || !weekStart || !axios) { setReport(null); setLoading(false); return; }
    const loadReport = async () => {
      setLoading(true); setError(""); setReport(null);
      try {
        const { data } = await axios.get("/admin/reports/weekly", { params: { start: weekStart } });
        if (!cancelled) setReport({ start: weekStart, data });
      } catch {
        if (!cancelled) setError("Failed to load weekly report. Tap Refresh to try again.");
      } finally { if (!cancelled) setLoading(false); }
    };
    loadReport();
    return () => { cancelled = true; };
  }, [weekStart, axios, allowed, refreshKey]);

  const staffTotals = report?.start === weekStart && Array.isArray(report?.data?.staff_totals) ? report.data.staff_totals : [];
  const filteredStaff = useMemo(() => staffTotals.filter(row =>
    (row.full_name || row.username || "").toLowerCase().includes(searchTerm.trim().toLowerCase())
  ), [staffTotals, searchTerm]);
  const selectedWeek = weeks.find(week => week.week_start === weekStart);
  const busy = weeksLoading || loading;
  const problem = weeksError || error;

  if (!allowed) return null;

  return <CleaningTheme className="aw-theme"><style>{styles}</style>
    <section className="aw-panel" aria-label="Weekly staff hours" aria-busy={busy}>
      <header className="aw-header"><span className="aw-mark" aria-hidden="true"><CleaningSparkle /></span><div className="aw-heading"><p>Every hour, accounted for</p><h2>Weekly staff hours</h2></div><button type="button" className="aw-refresh" disabled={busy || !axios} onClick={() => setRefreshKey(key => key + 1)}>{busy ? "Refreshing…" : "↻ Refresh"}</button></header>
      <p className="aw-intro">Review your team’s logged work time, one week at a time.</p>
      <div className="aw-filters"><div><label htmlFor={`${id}-week`}>Select week</label><select id={`${id}-week`} value={weekStart} disabled={weeksLoading || !weeks.length} onChange={event => { setReport(null); setWeekStart(event.target.value); }}><option value="" disabled>{weeksLoading ? "Loading weeks…" : "No weeks available"}</option>{weeks.map(week => <option key={week.week_start} value={week.week_start}>{week.label}</option>)}</select></div><div><label htmlFor={`${id}-search`}>Find an employee</label><input id={`${id}-search`} type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search by employee name…" /></div></div>
      {!axios && <p className="aw-empty">Sign in to load weekly reports.</p>}
      {busy && <p className="aw-empty" role="status">{weeksLoading ? "Loading available weeks…" : "Loading weekly report…"}</p>}
      {problem && <p className="aw-error" role="alert">{problem}</p>}
      {!busy && !problem && axios && <>
        {!selectedWeek ? <div className="aw-empty"><strong>No weekly reports yet</strong><p>Available reporting weeks will appear here.</p></div> : report?.start === weekStart && <>
          <div className="aw-summary"><span>{selectedWeek.label}</span><span>{filteredStaff.length} of {staffTotals.length} employees</span></div>
          {filteredStaff.length ? <WeeklyTimeCards staffList={filteredStaff} weekStart={weekStart} /> : <div className="aw-empty"><strong>{staffTotals.length ? "No matching employees" : "No staff hours to display"}</strong><p>{staffTotals.length ? "Try another name or clear your search." : "Choose another week to review its report."}</p>{searchTerm && <button type="button" className="aw-clear" onClick={() => setSearchTerm("")}>Clear search</button>}</div>}
        </>}
      </>}
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.aw-theme{min-height:0;background:radial-gradient(ellipse at top right,#22647944,transparent 60%),#071321;border-radius:20px;color:#deeff8;overflow:visible}.cleaning-theme .aw-theme .ct-page-atmosphere{display:none}.aw-panel{position:relative;padding:22px;max-width:1400px;margin:auto;min-width:0}.aw-header{display:flex;align-items:center;gap:11px}.aw-mark{width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;background:#1a4350;border:1px solid #91e3d944;border-radius:12px;color:#acefdc}.aw-mark svg{width:23px;height:23px}.aw-heading{min-width:0}.aw-heading p{font-size:9px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#95d6d9;margin:0 0 4px!important}.aw-heading h2{font-size:23px;font-weight:700;letter-spacing:-.03em;line-height:1.3;margin:0}.aw-refresh{margin-left:auto;flex-shrink:0;padding:9px 12px;min-height:44px;border:1px solid #83d5e43b;border-radius:10px;background:#17384c;color:#c5edf1;font-size:11px;font-weight:650;cursor:pointer}.aw-refresh:disabled{opacity:.5;cursor:wait}.aw-intro{font-size:12px;color:#9bbfd0;line-height:1.8;margin:13px 0 17px!important}.aw-filters{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:15px;border:1px solid #7dd3fc30;border-radius:14px;background:linear-gradient(120deg,#153147,#0c2034);margin-bottom:17px}.aw-filters>div{min-width:0}.aw-filters label{display:block;font-size:10px;font-weight:650;color:#a1c9d8;margin-bottom:7px}.aw-filters input,.aw-filters select{width:100%;min-width:0;min-height:46px;border:1px solid #7dd3fc40;border-radius:9px;background:#091c2e;color:#dceff8;padding:10px 12px;font-size:13px;color-scheme:dark}.aw-filters input::placeholder{color:#86a8bc}.aw-filters select:disabled{opacity:.6}.aw-filters input:focus-visible,.aw-filters select:focus-visible,.aw-refresh:focus-visible,.aw-clear:focus-visible{outline:3px solid #a0ebd4;outline-offset:3px}.aw-summary{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin:15px 0;font-size:11px;color:#b7e8d8}.aw-summary>span:last-child{font-size:10px;color:#9abfd0}.aw-empty{padding:25px 16px;text-align:center;border:1px dashed #7dd3fc38;border-radius:13px;background:#0c2337;color:#a6c4d5;font-size:12px;line-height:1.7;margin:12px 0}.aw-empty strong{font-size:15px;font-weight:650;color:#d6edf7}.aw-empty p{margin:7px 0 0!important}.aw-clear{margin-top:12px;min-height:44px;padding:9px 13px;border:1px solid #9bdfd444;border-radius:9px;background:#214854;color:#c3f0e5;font-size:11px;font-weight:650;cursor:pointer}.aw-error{padding:12px 14px;border:1px solid #eda3bc44;border-radius:11px;background:#43273b;color:#ffd4e2;font-size:12px;line-height:1.7;margin:13px 0}
@media(max-width:640px){.aw-panel{padding:13px}.aw-header{gap:8px;flex-wrap:wrap}.aw-mark{width:34px;height:34px}.aw-heading h2{font-size:19px}.aw-heading p{font-size:8px;letter-spacing:.05em}.aw-refresh{font-size:10px;padding:8px}.aw-intro{font-size:11px}.aw-filters{grid-template-columns:1fr;gap:12px;padding:12px}.aw-filters input,.aw-filters select{font-size:16px}}
`;
