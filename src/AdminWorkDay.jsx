import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const duration = value => {
  const seconds = Math.max(0, Number(value) || 0);
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
};
const time = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" }) : "—";
};

export default function WorkDayLive() {
  const { role, axios } = useAuthorizedAxios();
  const canManage = role === "admin" || role === "manager";
  const [allStaff, setAllStaff] = useState([]);
  const [liveData, setLiveData] = useState({});
  const [staffProfiles, setStaffProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const generation = useRef(0);
  const request = useRef(0);
  const pending = useRef(new Set());
  const fetching = useRef(false);

  const loadAll = useCallback(async (force = false) => {
    if (!axios || !canManage || (fetching.current && !force)) return;
    const id = ++request.current;
    const currentGeneration = generation.current;
    const current = () => id === request.current && currentGeneration === generation.current;
    fetching.current = true; setLoading(true);
    try {
      const [staffRes, liveRes] = await Promise.all([
        axios.get("/staff/all"), axios.get("/admin/reports/live"),
      ]);
      if (!Array.isArray(staffRes.data) || !Array.isArray(liveRes.data?.active)) throw new Error("Invalid workday response");
      const liveMap = {};
      liveRes.data.active.forEach(entry => { liveMap[entry.staff_id] = entry; });
      // One missing profile should not prevent the team clock from loading.
      const profiles = await Promise.allSettled(staffRes.data.map(person =>
        axios.get(`/admin/staff/${person.id}/profile`)
      ));
      if (!current()) return;
      const profileMap = {};
      profiles.forEach((result, index) => {
        const person = staffRes.data[index];
        profileMap[person.id] = result.status === "fulfilled" ? result.value.data?.profile : person.profile;
      });
      setAllStaff(staffRes.data); setLiveData(liveMap); setStaffProfiles(profileMap);
      setError(""); setLastUpdated(new Date());
    } catch {
      if (current()) setError("Could not refresh live clock data. Refresh before making a clock change.");
    } finally {
      if (current()) { fetching.current = false; setLoading(false); }
    }
  }, [axios, canManage]);

  useEffect(() => {
    generation.current++; fetching.current = false;
    setAllStaff([]); setLiveData({}); setStaffProfiles({}); setLastUpdated(null); setError(""); setActionError("");
    if (canManage && axios) loadAll();
    else setLoading(false);
    const interval = canManage && axios ? setInterval(() => { if (!pending.current.size) loadAll(); }, 30000) : null;
    return () => { generation.current++; request.current++; fetching.current = false; if (interval) clearInterval(interval); };
  }, [loadAll, canManage, axios]);

  const handleClock = async (staffId, action) => {
    if (!axios || !canManage || loading || error || pending.current.has(staffId)) return;
    const currentGeneration = generation.current;
    pending.current.add(staffId);
    setActionLoading(previous => ({ ...previous, [staffId]: true })); setActionError("");
    try {
      await axios.post("/admin/staff-clock", { staff_id: staffId, action });
      if (generation.current === currentGeneration) await loadAll(true);
    } catch (err) {
      if (generation.current === currentGeneration) {
        setActionError(err.response?.data?.error || "Clock change could not be confirmed. Refresh to check the latest status.");
        // Do not repeat a possibly committed clock action without a fresh read.
        setError("Refresh clock status before trying again.");
      }
    } finally {
      pending.current.delete(staffId);
      if (generation.current === currentGeneration) setActionLoading(previous => ({ ...previous, [staffId]: false }));
    }
  };

  if (!canManage) return null;
  const activeCount = allStaff.filter(person => liveData[person.id]).length;
  const actionBusy = Object.values(actionLoading).some(Boolean);

  return <CleaningTheme className="wl-theme"><style>{styles}</style>
    <section className="wl-panel" aria-label="Live workday" aria-busy={loading}>
      <header className="wl-header"><span className="wl-mark" aria-hidden="true"><CleaningSparkle /></span><div><p className="wl-kicker">Your team, in motion</p><h2>Live work day</h2></div><button type="button" className="wl-refresh" onClick={() => loadAll()} disabled={loading || actionBusy || !axios}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
      <p className="wl-intro">A clear view of who’s working. Updates automatically every 30 seconds.</p>
      <div className="wl-summary"><span><strong>{activeCount}</strong> clocked in</span><span><strong>{allStaff.length - activeCount}</strong> not clocked in</span><small>{lastUpdated ? `Updated ${time(lastUpdated)}` : "Waiting for live data"}</small></div>
      {error && <p className="wl-error" role="alert">{error}</p>}
      {actionError && <p className="wl-error" role="alert">{actionError}</p>}
      {!axios && <p className="wl-empty">Sign in to load workday data.</p>}
      {loading && !allStaff.length && <p className="wl-empty" role="status">Loading live clock data…</p>}
      {!loading && !error && axios && !allStaff.length && <p className="wl-empty">No staff members found.</p>}
      <div className="wl-grid">{allStaff.map(person => {
        const profile = staffProfiles[person.id];
        const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || person.username || "Staff member";
        const live = liveData[person.id];
        const clockedIn = Boolean(live);
        return <article className={`wl-card ${clockedIn ? "is-active" : ""}`} key={person.id}>
          <div className="wl-person"><span className="wl-avatar" aria-hidden="true">{name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div><h3>{name}</h3><span className="wl-status"><i aria-hidden="true" />{clockedIn ? "Clocked in" : "Not clocked in"}</span></div></div>
          <div className="wl-session"><span>{clockedIn ? "Current session" : "Clock status"}</span><strong>{clockedIn ? duration(live.current_seconds) : "Off the clock"}</strong><small>{clockedIn ? `Clocked in at ${time(live.clock_in_at)}` : "No active time entry"}</small></div>
          <button type="button" className={clockedIn ? "wl-out" : "wl-in"} disabled={loading || Boolean(error) || actionLoading[person.id] || !axios} onClick={() => handleClock(person.id, clockedIn ? "out" : "in")} aria-label={`${clockedIn ? "Clock out" : "Clock in"} ${name}`}>{actionLoading[person.id] ? "Updating…" : clockedIn ? "Clock Out" : "Clock In"}</button>
        </article>;
      })}</div>
    </section>
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.wl-theme{min-height:0;background:radial-gradient(ellipse at top right,#23647844,transparent 65%),#071321;border-radius:20px;overflow:visible;color:#deeff8}.cleaning-theme .wl-theme .ct-page-atmosphere{display:none}.wl-panel{position:relative;max-width:1400px;margin:auto;padding:22px;min-width:0}.wl-header{display:flex;align-items:center;gap:11px}.wl-mark{width:40px;height:40px;display:grid;place-items:center;flex-shrink:0;background:#1c4450;border:1px solid #9ae3d844;border-radius:12px;color:#acf0db}.wl-mark svg{width:23px;height:23px}.wl-kicker{font-size:9px;letter-spacing:.09em;text-transform:uppercase;font-weight:700;color:#99d8d8;margin:0 0 4px!important}.wl-header h2{font-size:23px;line-height:1.3;font-weight:700;letter-spacing:-.03em;margin:0}.wl-refresh{margin-left:auto;flex-shrink:0;min-height:44px;padding:9px 12px;border:1px solid #8bd5e33b;background:#18394d;color:#c2edf0;border-radius:10px;font-size:11px;font-weight:650;cursor:pointer}.wl-intro{font-size:12px;color:#a0bfd1;line-height:1.8;margin:13px 0!important}.wl-summary{display:flex;align-items:center;flex-wrap:wrap;gap:12px 19px;padding:13px 15px;border:1px solid #7dd3fc29;border-radius:12px;background:#102b3f;margin:15px 0;font-size:11px;color:#aac9d9}.wl-summary strong{font-size:18px;color:#c1f1df;margin-right:4px;font-weight:700}.wl-summary small{font-size:9px;color:#8fb4c7;margin-left:auto}.wl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,235px),1fr));gap:12px}.wl-card{padding:16px;background:linear-gradient(125deg,#142d42,#0e2236);border:1px solid #7dd3fc2b;border-radius:15px;min-width:0}.wl-card.is-active{border-color:#8ce3ba44;background:radial-gradient(ellipse at top right,#2a675039,transparent 70%),#0f2939}.wl-person{display:flex;align-items:center;gap:10px}.wl-person>div{min-width:0}.wl-avatar{width:38px;height:38px;flex-shrink:0;display:grid;place-items:center;border:1px solid #8ddfd03b;border-radius:11px;background:#214958;color:#c5f1e4;font-size:12px;font-weight:700}.wl-person h3{font-size:14px;line-height:1.5;font-weight:700;overflow-wrap:anywhere;margin:0 0 5px}.wl-status{display:flex;align-items:center;gap:6px;font-size:9px;color:#9bbdce}.wl-status i{width:5px;height:5px;border-radius:50%;background:#96b9cc}.is-active .wl-status{color:#b6edce}.is-active .wl-status i{background:#a3edc5;box-shadow:0 0 9px #a3edc533}.wl-session{display:flex;flex-direction:column;gap:5px;margin:18px 0 15px;padding:12px 0;border-top:1px solid #7dd3fc22;border-bottom:1px solid #7dd3fc22}.wl-session>span{font-size:9px;color:#91b6c8}.wl-session strong{font-size:22px;font-weight:700;letter-spacing:-.02em;color:#c5e9e7;line-height:1.35}.wl-session small{font-size:10px;color:#9bbccd;line-height:1.6}.wl-card>button{width:100%;min-height:44px;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:700;cursor:pointer}.wl-in{background:linear-gradient(110deg,#9edbef,#96e4ca);border:1px solid #b2eadb;color:#123b47}.wl-out{background:#4a2b3d;border:1px solid #efaac344;color:#ffd1e1}.wl-theme button:disabled{opacity:.5;cursor:not-allowed}.wl-theme button:focus-visible{outline:3px solid #a6efd8;outline-offset:3px}.wl-error{padding:12px;border:1px solid #efa4be44;border-radius:11px;background:#45283d;color:#ffd4e2;font-size:12px;line-height:1.7;margin:12px 0!important}.wl-empty{padding:25px 15px;border:1px dashed #7dd3fc33;border-radius:12px;background:#0c2235;color:#a5c2d4;text-align:center;font-size:12px;line-height:1.7}
@media(max-width:640px){.wl-panel{padding:13px}.wl-header{gap:8px;flex-wrap:wrap}.wl-mark{width:34px;height:34px}.wl-kicker{font-size:8px}.wl-header h2{font-size:20px}.wl-refresh{font-size:10px;padding:8px}.wl-intro{font-size:11px}.wl-summary{padding:11px;gap:9px 15px}.wl-summary small{flex-basis:100%;margin:0}.wl-card{padding:13px}.wl-grid{grid-template-columns:1fr}.wl-session{margin-top:14px}}
`;
