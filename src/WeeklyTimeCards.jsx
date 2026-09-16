import { useEffect, useRef, useState } from "react";
import EditTimeCard from "./EditTimeCards";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { useStaff } from "./StaffContext";
import CleaningTheme from "./CleaningTheme";

export default function WeeklyTimeCards({ staffList = [], weekStart }) {
  const { axios, role } = useAuthorizedAxios();
  const { staff } = useStaff();
  // Reset cached entries when the week or signed-in identity changes.
  return <TimeCards key={`${weekStart}-${role}-${staff?.id}`} staffList={staffList} weekStart={weekStart} axios={axios} role={role} staff={staff} />;
}

function TimeCards({ staffList, weekStart, axios, role, staff }) {
  const [expanded, setExpanded] = useState(null);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const pending = useRef(new Set());
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const isSelf = id => role === "manager" && staff?.id != null && String(staff.id) === String(id);

  const loadEntries = async id => {
    if (!axios || !weekStart || isSelf(id) || pending.current.has(id)) return;
    pending.current.add(id);
    setLoading(previous => ({ ...previous, [id]: true }));
    setErrors(previous => ({ ...previous, [id]: "" }));
    try {
      const { data } = await axios.get(`/admin/reports/weekly/${id}/entries`, { params: { start: weekStart } });
      if (!Array.isArray(data)) throw new Error("Invalid timecard response");
      if (mounted.current) setEntries(previous => ({ ...previous, [id]: data }));
    } catch (err) {
      if (mounted.current) setErrors(previous => ({ ...previous, [id]: err.response?.data?.error || "Could not load entries. Please try again." }));
    } finally {
      pending.current.delete(id);
      if (mounted.current) setLoading(previous => ({ ...previous, [id]: false }));
    }
  };

  const toggleStaff = id => {
    if (!axios || !weekStart || isSelf(id)) return;
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!entries[id]) loadEntries(id);
  };

  return <CleaningTheme className="wt-theme"><style>{styles}</style><div className="wt-grid">
    {staffList.map(row => {
      const id = row.staff_id;
      const self = isSelf(id);
      const open = expanded === id;
      const name = row.full_name || row.username || "Staff member";
      return <article className={`wt-card ${open ? "is-open" : ""}`} key={id}>
        <button type="button" className="wt-summary" disabled={self || !axios || !weekStart} aria-expanded={open} onClick={() => toggleStaff(id)}>
          <div className="wt-top"><span className="wt-avatar" aria-hidden="true">{name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div className="wt-name"><h3>{name}</h3><span>{self ? "Your weekly total" : "Weekly work time"}</span></div>{!self && <span className="wt-chevron" aria-hidden="true">{open ? "−" : "+"}</span>}</div>
          <div className="wt-total"><strong>{row.total_hours ?? "—"}</strong><span>total hours</span></div>
          <div className="wt-meta"><span>{row.total_seconds ?? "—"} seconds</span><span>{self ? "You" : open ? "Hide timecards" : "View timecards"}</span></div>
        </button>
        {self && <p className="wt-self">Managers can view their total hours here, but cannot open their own timecards.</p>}
        {open && !self && <div className="wt-expanded">
          <div className="wt-entry-heading"><h4>Time entries</h4><button type="button" disabled={loading[id]} onClick={() => loadEntries(id)}>{loading[id] ? "Refreshing…" : "↻ Refresh"}</button></div>
          {errors[id] && <p className="wt-error" role="alert">{errors[id]}</p>}
          {loading[id] ? <p className="wt-empty" role="status">Loading entries…</p> : entries[id]?.length ? <div className="wt-entries">{entries[id].map(entry => <EditTimeCard key={entry.id} entry={entry}
            onUpdate={updated => setEntries(previous => ({ ...previous, [id]: (previous[id] || []).map(item => item.id === updated.id ? updated : item) }))}
            onDelete={deletedId => setEntries(previous => ({ ...previous, [id]: (previous[id] || []).filter(item => item.id !== deletedId) }))}
          />)}</div> : !errors[id] && <p className="wt-empty">No entries found for this week.</p>}
        </div>}
      </article>;
    })}
    {staffList.length === 0 && <p className="wt-empty">No staff timecards to display.</p>}
  </div></CleaningTheme>;
}

const styles = `
.cleaning-theme.wt-theme{min-height:0;background:transparent;overflow:visible}.cleaning-theme .wt-theme .ct-page-atmosphere{display:none}.wt-grid{position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:13px;align-items:start;color:#dceff8}.wt-card{border:1px solid #7dd3fc33;border-radius:16px;min-width:0;overflow:hidden;background:radial-gradient(ellipse at top right,#245b5c33,transparent 70%),#0f263b}.wt-card.is-open{border-color:#98dfcc55}.wt-summary{display:block;text-align:left;width:100%;padding:17px;background:transparent;border:0;color:inherit;cursor:pointer;font-family:inherit}.wt-summary:hover:not(:disabled){background:#1a3a4c66}.wt-summary:disabled{cursor:default}.wt-top{display:flex;align-items:center;gap:10px}.wt-avatar{width:39px;height:39px;display:grid;place-items:center;flex-shrink:0;border:1px solid #94e4d344;border-radius:11px;background:linear-gradient(130deg,#27596a,#285443);color:#c5f2e2;font-size:12px;font-weight:700}.wt-name{flex:1;min-width:0}.wt-name h3{font-size:15px;line-height:1.5;font-weight:700;letter-spacing:-.01em;margin:0;overflow-wrap:anywhere}.wt-name>span{font-size:10px;line-height:1.6;color:#9bbfd0}.wt-chevron{display:grid;place-items:center;flex-shrink:0;width:30px;height:30px;border:1px solid #85cfe333;border-radius:8px;background:#1b3b50;color:#b7e8e3;font-size:20px}.wt-total{display:flex;align-items:baseline;flex-wrap:wrap;gap:8px;margin:19px 0 15px}.wt-total strong{font-size:33px;letter-spacing:-.04em;line-height:1.2;font-weight:700;color:#b7f0d9;font-variant-numeric:tabular-nums}.wt-total>span{font-size:11px;color:#a0c2d2}.wt-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;padding-top:11px;border-top:1px solid #7dd3fc25;font-size:10px;color:#8fb6c8}.wt-meta>span:last-child{color:#acdfe2;font-weight:650}.wt-self{font-size:10px;line-height:1.7;color:#9bb8cb;padding:0 17px 14px;margin:0!important}.wt-expanded{border-top:1px solid #8ad7d62b;padding:14px;background:#091d30}.wt-entry-heading{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.wt-entry-heading h4{font-size:12px;font-weight:700;margin:0;color:#cae7f1}.wt-entry-heading button{min-height:42px;border:1px solid #7dd3fc38;border-radius:9px;background:#193e51;color:#bde9ed;font-size:10px;font-weight:650;padding:8px 10px;cursor:pointer}.wt-entry-heading button:disabled{opacity:.5;cursor:wait}.wt-summary:focus-visible,.wt-entry-heading button:focus-visible{outline:3px solid #a1edd5;outline-offset:-4px}.wt-entries{display:flex;flex-direction:column;gap:10px;min-width:0}.wt-empty{padding:15px;border:1px dashed #7dd3fc30;border-radius:10px;color:#a1bdce;font-size:11px;line-height:1.7;text-align:center;margin:0}.wt-error{padding:11px;border:1px solid #eda7bd44;border-radius:10px;background:#42273a;color:#ffcede;font-size:11px;line-height:1.7;margin:0 0 10px!important}
@media(max-width:640px){.wt-grid{grid-template-columns:1fr;gap:11px}.wt-summary{padding:13px}.wt-total{margin:15px 0 12px}.wt-total strong{font-size:30px}.wt-expanded{padding:11px}.wt-self{padding-inline:13px}.wt-entry-heading button{min-height:44px}}
`;
