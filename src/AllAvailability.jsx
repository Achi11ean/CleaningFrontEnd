import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const ACCENTS = ["#efb4d0", "#c5b7f0", "#9bd8f5", "#89e2d9", "#a1e4ba", "#eed7a2", "#efb6b8"];
function to12Hour(value) {
  if (!value) return "—";
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function AllAvailability() {
  const { axios } = useAuthorizedAxios();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const normalizedSearch = search.trim().toLowerCase();
  const filteredRows = rows.filter(row => !normalizedSearch ||
    row.owner?.display_name?.toLowerCase().includes(normalizedSearch) ||
    DAYS.some(day => day.includes(normalizedSearch) && row.weekly?.[day])
  );

  useEffect(() => {
    let cancelled = false;
    if (!axios) { setRows([]); setLoading(false); return; }
    const fetchAll = async () => {
      setLoading(true); setError("");
      try {
        const res = await axios.get("/availability/all");
        if (!cancelled) setRows(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setError("Failed to load availability. Please refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [axios, refreshKey]);

  return <CleaningTheme className="av-theme"><style>{styles}</style>
    <section className="av-panel" aria-label="Team availability" aria-busy={loading}>
      <header className="av-header"><span className="av-mark" aria-hidden="true"><CleaningSparkle /></span><div className="av-heading"><p>Plan a fresh week</p><h2>Team availability</h2></div><button type="button" className="av-refresh" disabled={!axios || loading} onClick={() => setRefreshKey(k => k + 1)}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
      <p className="av-intro">Find your team’s available hours at a glance.</p>
      {axios && <div className="av-search"><label htmlFor="team-availability-search">Find a team member or day</label><div><input id="team-availability-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or day — Mon, Tue, Friday…" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">Clear</button>}</div></div>}
      {!axios ? <p className="av-error" role="alert">You must be logged in to view availability.</p> : <>
        {error && <p className="av-error" role="alert">{error}</p>}
        {loading && <p className="av-empty" role="status">Loading team availability…</p>}
        {!loading && !error && <>
          <div className="av-results"><span>{filteredRows.length} of {rows.length} availability records</span><span><i /> Available hours</span></div>
          {filteredRows.length === 0 ? <div className="av-empty"><strong>{rows.length ? "No matching availability" : "No availability yet"}</strong><p>{rows.length ? "Try a team member’s name or a day like Monday." : "Your team’s weekly availability will appear here when added."}</p></div> : <div className="av-people">{filteredRows.map(row => {
            const name = row.owner?.display_name || "Team member";
            const availableDays = DAYS.filter(day => row.weekly?.[day]).length;
            return <article className={`av-person ${row.is_locked ? "is-locked" : ""}`} key={row.id}>
              <header className="av-person-header"><span className="av-avatar" aria-hidden="true">{name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div className="av-person-info"><h3>{name}</h3><p>{row.owner?.type || "Team member"}{row.owner?.role ? ` · ${row.owner.role}` : ""}</p></div><div className="av-person-meta"><span>{availableDays} {availableDays === 1 ? "day" : "days"} available</span>{row.is_locked && <small>Locked</small>}</div></header>
              {row.owner?.phone_number && <a className="av-phone" href={`tel:${row.owner.phone_number.replace(/[^\d+]/g, "")}`}>Call · {row.owner.phone_number}</a>}
              <div className="av-week">{DAYS.map((day, index) => {
                const slot = row.weekly?.[day];
                return <div className={`av-day ${slot ? "is-available" : "is-unavailable"}`} key={day} style={{"--day-accent": ACCENTS[index]}}><div className="av-day-heading"><h4>{day}</h4><span aria-hidden="true">{slot ? "✓" : "—"}</span></div>{slot ? <p><span>{to12Hour(slot.start)}</span><span className="av-until">to</span><span>{to12Hour(slot.end)}</span></p> : <p>Unavailable</p>}</div>;
              })}</div>
            </article>;
          })}</div>}
        </>}
      </>}
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.av-theme{min-height:0;background:radial-gradient(ellipse at top right,#25607644,transparent 65%),#071321;border-radius:20px;overflow:visible}.cleaning-theme .av-theme .ct-page-atmosphere{display:none}.av-panel{position:relative;padding:22px;color:#dceef8;max-width:1400px;margin:auto;min-width:0}.av-header{display:flex;align-items:center;gap:11px}.av-mark{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;background:#183f4c;border:1px solid #8ae3d744;border-radius:12px;color:#a8eedc}.av-mark svg{width:23px;height:23px}.av-heading{min-width:0}.av-heading>p{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:#9bdbdd;margin:0 0 4px!important}.av-heading h2{font-size:23px;letter-spacing:-.03em;line-height:1.3;font-weight:700;margin:0}.av-refresh{margin-left:auto;flex-shrink:0;min-height:44px;padding:9px 12px;background:#16364c;border:1px solid #89d8e53b;color:#c4eff1;border-radius:10px;font-size:11px;font-weight:650;cursor:pointer}.av-refresh:disabled{opacity:.5;cursor:wait}.av-intro{font-size:12px;color:#a0c1d2;line-height:1.8;margin:12px 0 17px!important}.av-search{padding:14px;border:1px solid #7dd3fc30;border-radius:13px;background:#0e263a}.av-search label{display:block;font-size:10px;font-weight:650;color:#9dc8d8;margin-bottom:7px}.av-search>div{display:flex;gap:8px}.av-search input{width:100%;min-width:0;min-height:45px;border:1px solid #7dd3fc38;background:#081b2d;color:#e2f3fb;border-radius:9px;padding:10px 12px;font-size:13px}.av-search input::placeholder{color:#8aaabd}.av-search button{background:#214556;border:1px solid #87d6df44;border-radius:9px;color:#cfefef;padding:9px 12px;font-size:11px;font-weight:650}.av-panel button:focus-visible,.av-panel input:focus-visible,.av-phone:focus-visible{outline:3px solid #a2edd7;outline-offset:3px}.av-results{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:9px;margin:16px 0 12px;font-size:10px;color:#9abed0}.av-results>span:last-child{display:flex;align-items:center;gap:6px}.av-results i{width:6px;height:6px;background:#9ae9cd;border-radius:50%}.av-people{display:flex;flex-direction:column;gap:15px}.av-person{padding:17px;border:1px solid #7dd3fc30;border-radius:16px;background:linear-gradient(125deg,#112b40,#0b1e31);min-width:0}.av-person.is-locked{border-color:#b2a3d43b}.av-person-header{display:flex;align-items:center;gap:11px}.av-avatar{display:grid;place-items:center;width:42px;height:42px;flex-shrink:0;background:linear-gradient(135deg,#286274,#285748);border:1px solid #8ae3d544;border-radius:12px;color:#cbf8e9;font-size:14px;font-weight:700}.av-person-info{min-width:0;flex:1}.av-person h3{font-size:16px;line-height:1.4;font-weight:700;margin:0 0 4px;overflow-wrap:anywhere}.av-person-info p{font-size:10px;line-height:1.6;text-transform:capitalize;color:#98bacd;margin:0!important}.av-person-meta{display:flex;flex-direction:column;align-items:flex-end;gap:5px;color:#ade8d3;font-size:10px;flex-shrink:0}.av-person-meta small{font-size:9px;background:#352e4a;color:#d5c8ed;border:1px solid #c9b3e933;border-radius:99px;padding:3px 8px}.av-phone{display:inline-flex;align-items:center;min-height:40px;max-width:100%;overflow-wrap:anywhere;padding:7px 11px;border:1px solid #89d9e538;background:#173c4e;border-radius:9px;color:#baeaf0;font-size:11px;font-weight:600;text-decoration:none;margin-top:11px}.av-phone:hover{background:#245469}.av-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:15px}.av-day{padding:11px 10px;border:1px solid #7dd3fc24;border-radius:11px;background:#0c2235;min-width:0}.av-day.is-available{border-top:2px solid var(--day-accent);background:linear-gradient(145deg,#1b3749,#102637)}.av-day-heading{display:flex;align-items:center;justify-content:space-between;gap:5px;margin-bottom:10px}.av-day h4{text-transform:capitalize;font-size:11px;font-weight:650;margin:0;color:#cee4ed}.av-day-heading>span{font-size:10px;color:var(--day-accent)}.av-day p{display:flex;flex-direction:column;gap:2px;font-size:11px;font-weight:600;color:#d7edf6;margin:0!important;font-variant-numeric:tabular-nums}.av-day .av-until{font-size:9px;font-weight:400;color:#8fadc0}.av-day.is-unavailable h4{color:#9ab7c9}.av-day.is-unavailable p{font-size:10px;font-weight:400;color:#88a9bd}.av-empty{padding:26px 16px;border:1px dashed #7dd3fc38;border-radius:13px;background:#0c2235;text-align:center;color:#a4c1d3;font-size:12px;line-height:1.7}.av-empty strong{font-size:15px;font-weight:650;color:#d7edf7}.av-empty p{margin:7px 0 0!important}.av-error{border:1px solid #f1a8c144;background:#43263a;color:#ffd6e4;border-radius:11px;padding:12px;font-size:12px;line-height:1.7;margin:13px 0!important}
@media(max-width:1050px){.av-week{grid-template-columns:repeat(4,minmax(0,1fr))}.av-day p{flex-direction:row;flex-wrap:wrap;gap:4px;align-items:baseline}}
@media(max-width:640px){.av-panel{padding:13px}.av-header{gap:8px;flex-wrap:wrap}.av-mark{width:34px;height:34px}.av-heading h2{font-size:19px}.av-heading>p{font-size:8px}.av-refresh{font-size:10px;padding:8px}.av-intro{font-size:11px}.av-search{padding:11px}.av-search input{font-size:16px}.av-person{padding:12px}.av-person-header{flex-wrap:wrap;gap:9px}.av-person-meta{flex-direction:row;flex-basis:100%;align-items:center;gap:9px}.av-person h3{font-size:15px}.av-week{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.av-day{padding:10px 8px}.av-day h4{font-size:11px}.av-day p{font-size:10px}.av-day-heading{margin-bottom:8px}}
`;
