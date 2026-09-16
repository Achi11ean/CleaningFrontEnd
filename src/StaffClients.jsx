import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStaff } from "./StaffContext";
import ManagerClients from "./ManagerClients";
import ClientTaskListManager from "./ClientTaskListManager";

const ORDER = ["waitlist", "new", "contacted", "active", "inactive", "unresponsive", "paused", "archived", "other"];
const META = {
  waitlist: ["Waitlist", "#92400e", "#fffbeb"], new: ["New", "#1d4ed8", "#eff6ff"],
  contacted: ["Contacted", "#4338ca", "#eef2ff"], active: ["Active", "#166534", "#f0fdf4"],
  inactive: ["Inactive", "#475569", "#f1f5f9"], unresponsive: ["Unresponsive", "#92400e", "#fffbeb"],
  paused: ["Paused", "#7e22ce", "#faf5ff"], archived: ["Archived", "#475569", "#f1f5f9"],
  other: ["Other", "#475569", "#f1f5f9"],
};
const normalized = status => String(status || "").trim().toLowerCase();
const groupOf = client => META[normalized(client.status)] ? normalized(client.status) : "other";
const nameOf = client => [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || `Client #${client.id}`;
const initialsOf = client => [client.first_name, client.last_name].filter(Boolean).map(name => String(name).trim().charAt(0)).join("").toUpperCase() || "C";
const dateOf = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Not recorded";
};

export default function StaffClients() {
  const { authAxios, staff } = useStaff();
  const canEdit = staff?.role === "manager";
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const api = useRef(authAxios);
  api.current = authAxios;
  const alive = useRef(true);
  const generation = useRef(0);
  const editor = useRef(null);

  async function fetchClients() {
    const request = ++generation.current;
    setLoading(true); setError("");
    try {
      const { data } = await api.current.get("/staff/clients");
      if (!Array.isArray(data)) throw new Error("Unexpected client response");
      if (alive.current && request === generation.current) setClients(data);
    } catch (err) {
      if (alive.current && request === generation.current) setError(err?.response?.data?.error || "Could not load clients. Use Refresh to try again.");
    } finally { if (alive.current && request === generation.current) setLoading(false); }
  }
  // Reload when the signed-in staff identity or role changes, without depending on unstable Axios references.
  useEffect(() => {
    alive.current = true;
    setClients([]); setSelectedId(null); setFilter("all"); setSearch("");
    fetchClients();
    return () => { alive.current = false; generation.current += 1; };
  }, [staff?.id, staff?.role]);

  const visible = useMemo(() => clients.filter(client => canEdit || normalized(client.status) !== "new"), [clients, canEdit]);
  const selected = visible.find(client => client.id === selectedId);
  const counts = useMemo(() => {
    const result = Object.fromEntries(ORDER.map(key => [key, 0]));
    visible.forEach(client => { result[groupOf(client)] += 1; });
    return result;
  }, [visible]);
  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    const digits = query.replace(/\D/g, "");
    return visible.filter(client => {
      if (filter !== "all" && groupOf(client) !== filter) return false;
      const text = [nameOf(client), client.email, client.address, client.status].filter(Boolean).join(" ").toLowerCase();
      return !query || text.includes(query) || (!!digits && String(client.phone || "").replace(/\D/g, "").includes(digits));
    }).sort((a, b) => {
      if (sort === "newest") return (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || nameOf(a).localeCompare(nameOf(b));
      if (sort === "oldest") return (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0) || nameOf(a).localeCompare(nameOf(b));
      return nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: "base", numeric: true });
    });
  }, [visible, search, filter, sort]);
  const groups = ORDER.map(key => [key, filtered.filter(client => groupOf(client) === key)]).filter(([, list]) => list.length);

  function choose(client) {
    if (selected && canEdit && !window.confirm("Close the current client editor? Any unsaved client details will be discarded.")) return;
    setSelectedId(selectedId === client.id ? null : client.id);
  }
  function closeEditor() {
    if (canEdit && !window.confirm("Close this client editor? Any unsaved client details will be discarded.")) return;
    setSelectedId(null);
  }
  useEffect(() => {
    if (selectedId != null) {
      editor.current?.scrollIntoView?.({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      editor.current?.focus({ preventScroll: true });
    }
  }, [selectedId]);

  return <div className="sc-root">
    <style>{CSS}</style>
    <header className="sc-header"><div><span className="sc-eyebrow">{canEdit ? "MANAGER WORKSPACE" : "STAFF WORKSPACE"}</span><h2>Client directory</h2><p>{canEdit ? "Client details, cleaning teams, and room-by-room task lists." : "Find client contact details, addresses, and notes."}</p></div><button type="button" className="sc-button" disabled={loading} onClick={fetchClients}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
    <div className="sc-stats"><div><span>{canEdit ? "Total clients" : "Visible clients"}</span><strong>{visible.length}</strong></div><div><span>Active</span><strong>{counts.active}</strong></div><div><span>{canEdit ? "New & waitlist" : "Waitlist"}</span><strong>{counts.waitlist + (canEdit ? counts.new : 0)}</strong></div><div><span>Paused</span><strong>{counts.paused}</strong></div></div>
    {error && <div className="sc-feedback"><p className="sc-error" role="alert">{error}</p></div>}
    <div className="sc-tools"><label className="sc-search"><span>Find a client</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email, phone, address, or status…" /></label><label><span>Sort within status</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="name">Name: A–Z</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    <div className="sc-filters" aria-label="Filter clients by status"><button type="button" className={filter === "all" ? "is-active" : ""} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All <span>{visible.length}</span></button>{ORDER.filter(key => (canEdit || key !== "new") && (key !== "other" || counts.other)).map(key => <button type="button" key={key} className={filter === key ? "is-active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{META[key][0]} <span>{counts[key]}</span></button>)}</div>
    <div className="sc-results"><span role="status">Showing <strong>{filtered.length}</strong> of {visible.length} clients{loading && clients.length > 0 ? " · Refreshing…" : ""}</span>{(search || filter !== "all") && <button type="button" className="sc-text-button" onClick={() => { setSearch(""); setFilter("all"); }}>Clear filters</button>}</div>
    {/* The editor stays mounted when filters change, so searching cannot discard a draft. */}
    {selected && <section className="sc-editor-panel" ref={editor} tabIndex={-1} aria-label={`Client details for ${nameOf(selected)}`}><div className="sc-editor-heading"><div><span className="sc-eyebrow">{canEdit ? "EDIT CLIENT" : "CLIENT DETAILS"}</span><h3>{nameOf(selected)}</h3></div><button type="button" className="sc-button" onClick={closeEditor}>Close details</button></div>
      {canEdit ? <ManagerClients key={selected.id} client={selected} onClientUpdated={fetchClients} /> : <div className="sc-readonly"><div><h4>Address</h4><p>{selected.address || "No address provided."}</p></div><div><h4>General notes</h4><p>{selected.general_notes || "No notes provided."}</p></div><p className="sc-note">View only. Contact a manager to make changes.</p></div>}
    </section>}
    {loading && !clients.length ? <div className="sc-empty" role="status"><div className="sc-spinner" aria-hidden="true" /><h3>Loading your clients</h3><p>Getting your client directory ready.</p></div> : !filtered.length ? <div className="sc-empty"><span className="sc-empty-icon" aria-hidden="true">☷</span><h3>{error && !clients.length ? "Clients are unavailable" : visible.length ? "No matching clients" : "No clients to display"}</h3><p>{error && !clients.length ? "Use Refresh to try again." : visible.length ? "Try another search or clear your filters." : "Clients will appear here when available to your account."}</p></div> : <div className="sc-groups">{groups.map(([key, list]) => <section className="sc-group" key={key}><h3 className="sc-section-heading"><span className="sc-dot" style={{ background: META[key][1] }} />{META[key][0]}<span className="sc-group-count">{list.length}</span></h3><div className="sc-grid">{list.map(client => <article className={`sc-card ${selectedId === client.id ? "sc-selected" : ""}`} key={client.id}>
      <div className="sc-card-top"><div className="sc-avatar" aria-hidden="true">{initialsOf(client)}</div><div className="sc-identity"><h3>{nameOf(client)}</h3><span className="sc-status" style={{ color: META[key][1], background: META[key][2] }}>{key === "other" ? client.status || "No status" : META[key][0]}</span></div><span className="sc-client-id">#{client.id}</span></div>
      <div className="sc-contact"><div><span>Email</span>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span>Not provided</span>}</div><div><span>Phone</span>{client.phone ? <a href={`tel:${String(client.phone).replace(/[^\d+]/g, "")}`}>{client.phone}</a> : <span>Not provided</span>}</div><div className="sc-address"><span>Address</span><span>{client.address || "Not provided"}</span></div></div>
      <div className="sc-card-meta"><span>Added {dateOf(client.created_at)}</span>{Array.isArray(client.cleaners) && <span>{client.cleaners.length} assigned</span>}</div>
      <div className="sc-card-actions"><button type="button" className="sc-button sc-button-primary" aria-expanded={selectedId === client.id} onClick={() => choose(client)}>{selectedId === client.id ? "Close details" : canEdit ? "Edit client" : "View details"}</button>{canEdit && <ClientTaskListManager client={client} authAxios={authAxios} buttonClassName="sc-button sc-button-tasks" />}</div>
    </article>)}</div></section>)}</div>}
  </div>;
}

const CSS = `
.sc-root{background:#f5f8fc;color:#172b41;border:1px solid #e1e8f0;border-radius:22px;padding:clamp(16px,3vw,32px);font-family:inherit;line-height:1.5;text-align:left;color-scheme:light;min-width:0}.sc-root *{box-sizing:border-box}.sc-root h2,.sc-root h3,.sc-root h4,.sc-root p{margin:0}.sc-root h2,.sc-root h3,.sc-root h4{color:#172b41}.sc-root button,.sc-root input,.sc-root select,.sc-root textarea{font-family:inherit}.sc-root button{cursor:pointer}.sc-root button:disabled{cursor:not-allowed;opacity:.55}.sc-root :focus-visible{outline:3px solid #0891b2;outline-offset:3px}.sc-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}.sc-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#0e7490}.sc-header h2{font-size:clamp(26px,3vw,34px);font-weight:750;letter-spacing:-.03em;margin:4px 0}.sc-header p{font-size:14px;color:#52677d;max-width:520px}.sc-root .sc-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:1px solid #ccd8e5;background:#fff;color:#25435e;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;line-height:1.4;text-align:center;text-decoration:none;transition:background .15s,border-color .15s}.sc-root .sc-button:hover:not(:disabled){background:#edf4fa;border-color:#93b0c9}.sc-root .sc-button-primary{background:#0e7490;border-color:#0e7490;color:#fff}.sc-root .sc-button-primary:hover:not(:disabled){background:#155e75}.sc-root .sc-button-tasks{background:#ecfeff;border-color:#a5dce6;color:#155e75}.sc-root .sc-button-danger{color:#b42336;border-color:#f2bdc5;background:#fff}.sc-root .sc-button-danger:hover:not(:disabled){background:#fff1f2}.sc-root .sc-button-small{font-size:12px;padding:8px 10px}.sc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}.sc-stats>div{background:#fff;border:1px solid #e0e8f0;border-radius:14px;padding:16px 20px}.sc-stats span{display:block;color:#52677d;font-size:12px;font-weight:600}.sc-stats strong{display:block;font-size:28px;font-weight:750;color:#183a55;line-height:1.3;margin-top:5px}.sc-feedback:empty{display:none}.sc-feedback>p{padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:12px;background:#edf4fa;color:#264862}.sc-feedback .sc-success{background:#ecfdf3;color:#166534;border:1px solid #bdebd0}.sc-feedback .sc-error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}.sc-root .sc-warning{background:#fff9eb;color:#855214;padding:12px 16px;border-radius:10px;font-size:13px}.sc-tools{display:flex;align-items:flex-end;gap:14px;background:#fff;border:1px solid #e0e8f0;padding:18px;border-radius:16px}.sc-tools label{display:block;min-width:0}.sc-tools label>span{display:block;font-size:12px;font-weight:700;color:#36516b;margin-bottom:7px}.sc-search{flex:1}.sc-tools input,.sc-tools select{display:block;width:100%;border:1px solid #cbd8e5;border-radius:10px;padding:11px 13px;min-height:46px;background:#fff;color:#172b41;font-size:16px}.sc-tools input::placeholder{color:#667a8e;opacity:1}.sc-tools select{min-width:170px}.sc-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.sc-filters button{display:flex;align-items:center;gap:8px;padding:8px 12px;min-height:40px;background:#fff;color:#465d73;border:1px solid #dbe4ed;border-radius:9px;font-size:12px;font-weight:650}.sc-filters button>span{font-size:10px;min-width:18px;padding:1px 5px;border-radius:4px;background:#f0f4f8;color:#496176}.sc-filters button.is-active{background:#155e75;color:#fff;border-color:#155e75}.sc-filters button.is-active>span{background:#e0f2fe;color:#164e63}.sc-results{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0;color:#52677d;font-size:12px}.sc-root .sc-text-button{border:0;background:transparent;color:#0e7490;min-height:40px;font-size:12px;font-weight:700;text-decoration:underline}.sc-group{margin-top:22px}.sc-group-heading{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;background:transparent;padding:0 2px 12px;min-height:44px;color:#25435e;font-size:14px;font-weight:750}.sc-group-heading>span:first-child{display:flex;align-items:center;gap:10px}.sc-dot{width:8px;height:8px;border-radius:50%}.sc-group-count{background:#e7edf4;color:#425a70;padding:2px 7px;border-radius:5px;font-size:11px}.sc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:16px}.sc-card{background:#fff;border:1px solid #dce5ee;border-radius:16px;box-shadow:0 3px 10px #20395205;min-width:0;overflow:hidden}.sc-card-open{grid-column:1/-1;border-color:#70b9cc;box-shadow:0 0 0 2px #daf2f7}.sc-card-top{display:flex;align-items:center;gap:12px;padding:20px 20px 14px}.sc-avatar{display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex-shrink:0;border-radius:13px;background:#eaf4fb;color:#235a7e;font-size:15px;font-weight:800}.sc-identity{min-width:0;flex:1}.sc-identity h3{font-size:17px;font-weight:750;overflow-wrap:anywhere;letter-spacing:-.015em}.sc-status{display:inline-block;font-size:10px;font-weight:750;line-height:1.5;padding:3px 8px;border-radius:6px;margin-top:4px;text-transform:capitalize}.sc-client-id{font-size:11px;color:#667a8e;align-self:flex-start}.sc-contact{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;padding:0 20px 14px}.sc-contact>div{min-width:0}.sc-contact>div>span:first-child{display:block;font-size:10px;letter-spacing:.04em;text-transform:uppercase;font-weight:700;color:#667a8e;margin-bottom:3px}.sc-contact a{font-size:13px;color:#155e75;text-decoration:none;overflow-wrap:anywhere}.sc-contact a:hover{text-decoration:underline}.sc-contact>div>span:last-child{font-size:13px;color:#415971;overflow-wrap:anywhere}.sc-contact .sc-address{grid-column:1/-1}.sc-card-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:0 20px 14px;color:#61758a;font-size:11px}.sc-card-actions{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #edf1f6;background:#fcfdff}.sc-card-actions>.sc-button{flex:1}.sc-expanded{padding:20px;background:#f3f7fb;border-top:1px solid #dce7ef}.sc-sheet{background:#fff;padding:20px;border-radius:13px;border:1px solid #dce5ee;margin-bottom:16px;min-width:0}.sc-sheet-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #e8eef4}.sc-sheet-heading h4{font-size:15px;font-weight:750}.sc-sheet-heading p{font-size:12px;color:#5b7186;margin-top:3px}.sc-unsaved{background:#fff7dd;color:#855214;padding:5px 8px;font-size:10px;font-weight:700;border-radius:6px;white-space:nowrap}.sc-form-guard{padding:0;margin:0;border:0;min-width:0;color:#243c54}.sc-form-guard:disabled{opacity:.65;pointer-events:none}.sc-form-guard label{color:#334e68!important}.sc-form-guard input:not([type=checkbox]):not([type=radio]),.sc-form-guard select,.sc-form-guard textarea{background-color:#fff!important;color:#172b41!important;border:1px solid #cbd8e5!important;max-width:100%;font-size:16px}.sc-form-guard input::placeholder,.sc-form-guard textarea::placeholder{color:#667a8e!important;opacity:1}.sc-form-guard input:-webkit-autofill{-webkit-text-fill-color:#172b41;-webkit-box-shadow:0 0 0 1000px #fff inset}.sc-delete-area{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px;border:1px solid #f2dce1;border-radius:12px;background:#fffafb}.sc-delete-area strong{font-size:13px;color:#8f2338}.sc-delete-area p{font-size:12px;color:#76535e;margin-top:3px;max-width:440px}.sc-delete-area button{flex-shrink:0}.sc-empty{background:#fff;border:1px dashed #cbd8e5;border-radius:16px;padding:44px 20px;text-align:center;margin-top:18px}.sc-empty h3{font-size:18px;font-weight:700}.sc-empty p{font-size:13px;color:#5b7186;margin-top:7px}.sc-empty-icon{font-size:36px;color:#0e7490}.sc-spinner{width:28px;height:28px;border:3px solid #dcecf1;border-top-color:#0e7490;border-radius:50%;margin:0 auto 16px;animation:sc-spin .8s linear infinite}@keyframes sc-spin{to{transform:rotate(360deg)}}
@media(max-width:820px){.sc-grid{grid-template-columns:1fr}.sc-stats>div{padding:14px}.sc-stats strong{font-size:24px}.sc-sheet-heading{flex-wrap:wrap}}
@media(max-width:520px){.sc-root{padding:14px;border-radius:14px}.sc-header{align-items:flex-start;gap:12px}.sc-header p{font-size:12px}.sc-header>.sc-button{font-size:12px;padding:9px 10px}.sc-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sc-tools{flex-direction:column;align-items:stretch;padding:12px}.sc-filters{flex-wrap:nowrap;overflow-x:auto;padding:2px 2px 8px}.sc-filters button{white-space:nowrap;flex-shrink:0;min-height:44px}.sc-contact{grid-template-columns:1fr;padding:0 16px 14px}.sc-card-top{padding:16px 16px 12px}.sc-card-meta{padding-left:16px;padding-right:16px}.sc-card-actions{padding:12px;flex-direction:column;gap:8px}.sc-expanded{padding:10px}.sc-sheet{padding:14px}.sc-delete-area{align-items:stretch;flex-direction:column;padding:14px}.sc-identity h3{font-size:16px}.sc-sheet-heading{gap:10px}}
@media(prefers-reduced-motion:reduce){.sc-spinner{animation:none}.sc-root .sc-button{transition:none}}

.sc-section-heading{display:flex;align-items:center;gap:10px;color:#25435e;font-size:14px;font-weight:750;margin-bottom:12px!important}.sc-selected{border-color:#70b9cc;box-shadow:0 0 0 2px #daf2f7}.sc-editor-panel{scroll-margin-top:24px;background:#fff;border:1px solid #a7d6e2;border-radius:16px;padding:18px;margin-bottom:24px}.sc-editor-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.sc-editor-heading h3{font-size:18px;font-weight:750;overflow-wrap:anywhere}.sc-readonly{display:grid;gap:16px}.sc-readonly h4{font-size:12px;font-weight:750;color:#36516b;margin:0 0 6px}.sc-readonly p{color:#405b72;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}.sc-readonly .sc-note{padding:12px;border-radius:9px;background:#f1f5f9;font-size:12px;color:#52677d}@media(max-width:520px){.sc-editor-panel{padding:10px}.sc-editor-heading{padding:4px}.sc-editor-heading h3{font-size:16px}}
`;
