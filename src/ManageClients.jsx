import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "./AdminContext";
import AssignCleaners from "./AssignCleaners";
import EditClient from "./EditClient";
import ClientTaskListManager from "./ClientTaskListManager";

const STATUS_ORDER = ["waitlist", "new", "contacted", "active", "inactive", "unresponsive", "paused", "archived"];
const STATUS_META = {
  waitlist: { label: "Waitlist", color: "#155e75", soft: "#ecfeff" },
  new: { label: "New", color: "#1d4ed8", soft: "#eff6ff" },
  contacted: { label: "Contacted", color: "#4338ca", soft: "#eef2ff" },
  active: { label: "Active", color: "#166534", soft: "#f0fdf4" },
  inactive: { label: "Inactive", color: "#475569", soft: "#f1f5f9" },
  unresponsive: { label: "Unresponsive", color: "#92400e", soft: "#fffbeb" },
  paused: { label: "Paused", color: "#7e22ce", soft: "#faf5ff" },
  archived: { label: "Archived", color: "#475569", soft: "#f1f5f9" },
  other: { label: "Other", color: "#475569", soft: "#f1f5f9" },
};
const normalizeStatus = value => String(value || "").trim().toLowerCase();
const nameOf = client => [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || `Client #${client.id}`;
const groupOf = client => STATUS_ORDER.includes(normalizeStatus(client.status)) ? normalizeStatus(client.status) : "other";
const editableFields = ["first_name", "last_name", "email", "phone", "address", "message", "general_notes", "cleaning_notes", "status"];
const payloadOf = client => Object.fromEntries(editableFields.map(key => [key, client?.[key]]));
const errorMessage = (error, fallback) => error?.response?.data?.error || error?.response?.data?.message || fallback;
const formatDate = value => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
const formatPhone = value => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
  if (!digits) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export default function ManageClients() {
  const { authAxios } = useAdmin();
  const api = useRef(authAxios);
  api.current = authAxios;
  const alive = useRef(true);
  const requestId = useRef(0);
  const operationLock = useRef(false);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [directoryReady, setDirectoryReady] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name");
  const [selectedClient, setSelectedClient] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [directoryError, setDirectoryError] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const dirty = !!selectedClient && JSON.stringify(payloadOf(selectedClient)) !== baseline;

  async function fetchAll() {
    const current = ++requestId.current;
    setLoading(true); setError(""); setDirectoryError("");
    const results = await Promise.allSettled([
      api.current.get("/clients"), api.current.get("/staff/all"), api.current.get("/admin/all"),
    ]);
    if (!alive.current || current !== requestId.current) return;
    const [clientResult, staffResult, adminResult] = results;
    if (clientResult.status === "fulfilled" && Array.isArray(clientResult.value.data)) {
      setClients(clientResult.value.data);
    } else {
      setError(clientResult.status === "rejected" ? errorMessage(clientResult.reason, "Could not load clients. Please retry.") : "The client response was not a list. Please retry.");
    }
    const staffOK = staffResult.status === "fulfilled" && Array.isArray(staffResult.value.data);
    const adminsOK = adminResult.status === "fulfilled" && Array.isArray(adminResult.value.data);
    if (staffOK) setStaff(staffResult.value.data);
    if (adminsOK) setAdmins(adminResult.value.data);
    setDirectoryReady(staffOK && adminsOK);
    if (!staffOK || !adminsOK) setDirectoryError("The staff directory could not be fully loaded. Refresh to enable cleaner assignments.");
    setLoading(false);
  }
  useEffect(() => {
    alive.current = true;
    fetchAll();
    return () => { alive.current = false; requestId.current += 1; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function canLeaveEditor() {
    return !dirty || window.confirm("You have unsaved client changes. Discard them?");
  }
  function selectClient(client) {
    if (operationLock.current || !canLeaveEditor()) return;
    const next = selectedClient?.id === client.id ? null : { ...client };
    setSelectedClient(next); setBaseline(next ? JSON.stringify(payloadOf(next)) : "");
    setNotice(""); setError("");
  }
  function changeView(update) {
    if (operationLock.current || !canLeaveEditor()) return;
    setSelectedClient(null); setBaseline(""); update();
  }
  async function refresh() {
    if (operationLock.current || loading || !canLeaveEditor()) return;
    setSelectedClient(null); setBaseline(""); setNotice("");
    await fetchAll();
  }
  function updateClientField(field, value) {
    if (!operationLock.current) setSelectedClient(current => current ? { ...current, [field]: value } : current);
  }
  const handlePhoneChange = event => updateClientField("phone", formatPhone(event.target.value));
  async function runOperation(action, fallback) {
    if (operationLock.current || !selectedClient) return;
    operationLock.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); }
    catch (err) { if (alive.current) setError(errorMessage(err, fallback)); }
    finally { operationLock.current = false; if (alive.current) setBusy(false); }
  }
  async function saveClient() {
    const target = selectedClient;
    if (!target) return;
    const payload = payloadOf(target);
    await runOperation(async () => {
      await api.current.patch(`/clients/${target.id}`, payload);
      if (!alive.current) return;
      const saved = { ...target, ...payload };
      setClients(previous => previous.map(client => client.id === target.id ? { ...client, ...payload } : client));
      setSelectedClient(saved); setBaseline(JSON.stringify(payload));
      setNotice(`${nameOf(saved)} updated successfully.`);
    }, "Could not save this client. Your changes are still here; please try again.");
  }
  async function deleteClient() {
    const target = selectedClient;
    if (!target || operationLock.current) return;
    if (!window.confirm(`Permanently delete ${nameOf(target)}?\n\nThis also removes related client records according to your server's deletion rules, including assignments and schedules. This cannot be undone.`)) return;
    await runOperation(async () => {
      await api.current.delete(`/clients/${target.id}`);
      if (!alive.current) return;
      setClients(previous => previous.filter(client => client.id !== target.id));
      setSelectedClient(null); setBaseline(""); setNotice("Client deleted successfully.");
    }, "Could not delete this client.");
  }
  async function reloadAssignments(id) {
    const { data } = await api.current.get(`/clients/${id}/assignments`);
    if (!Array.isArray(data.assignments)) throw new Error("Unexpected assignments response");
    if (!alive.current) return;
    setSelectedClient(current => current?.id === id ? { ...current, cleaners: data.assignments } : current);
    setClients(previous => previous.map(client => client.id === id ? { ...client, cleaners: data.assignments } : client));
  }
  async function changeAssignment(action, success) {
    const id = selectedClient?.id;
    if (!id || !directoryReady) return;
    await runOperation(async () => {
      await action(id);
      if (!alive.current) return;
      setNotice(success);
      try { await reloadAssignments(id); }
      catch (_) { if (alive.current) setError("The assignment change was saved, but the updated list could not be loaded. Use Reload assignments before making another assignment change."); }
    }, "Could not update the cleaner assignment.");
  }
  const assignCleaner = ({ staff_id = null, admin_id = null }) => changeAssignment(
    id => api.current.post(`/clients/${id}/assign-one`, { staff_id, admin_id }), "Cleaner assigned successfully."
  );
  const removeAssignment = assignmentId => changeAssignment(
    id => api.current.delete(`/clients/${id}/assignments/${assignmentId}`), "Cleaner assignment removed."
  );

  const counts = useMemo(() => {
    const result = Object.fromEntries([...STATUS_ORDER, "other"].map(key => [key, 0]));
    clients.forEach(client => { result[groupOf(client)] += 1; });
    return result;
  }, [clients]);
  const filteredClients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    return clients.filter(client => {
      if (statusFilter !== "all" && groupOf(client) !== statusFilter) return false;
      const haystack = [nameOf(client), client.email, client.address, client.status].filter(Boolean).join(" ").toLowerCase();
      return !query || haystack.includes(query) || (!!digits && String(client.phone || "").replace(/\D/g, "").includes(digits));
    }).sort((a, b) => {
      if (sort === "newest") return (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0) || nameOf(a).localeCompare(nameOf(b));
      if (sort === "oldest") return (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0) || nameOf(a).localeCompare(nameOf(b));
      return nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: "base", numeric: true });
    });
  }, [clients, searchTerm, statusFilter, sort]);
  const groups = useMemo(() => [...STATUS_ORDER, "other"].map(key => [key, filteredClients.filter(client => groupOf(client) === key)]).filter(([, list]) => list.length), [filteredClients]);
  // Keep an open editor visible if its saved status no longer matches the current filter.
  useEffect(() => {
    if (selectedClient && !dirty && !filteredClients.some(client => client.id === selectedClient.id)) {
      setSelectedClient(null); setBaseline("");
    }
  }, [filteredClients, selectedClient, dirty]);

  function renderCard(client) {
    const open = selectedClient?.id === client.id;
    const meta = STATUS_META[groupOf(client)];
    const initials = [client.first_name, client.last_name].filter(Boolean).map(value => String(value).charAt(0)).join("").toUpperCase() || "C";
    return <article key={client.id} className={`mc-card ${open ? "mc-card-open" : ""}`}>
      <div className="mc-card-top"><div className="mc-avatar" aria-hidden="true">{initials}</div><div className="mc-identity"><h3>{nameOf(client)}</h3><span className="mc-status" style={{ color: meta.color, background: meta.soft }}>{groupOf(client) === "other" ? client.status || "No status" : meta.label}</span></div><span className="mc-client-id">#{client.id}</span></div>
      <div className="mc-contact">
        <div><span>Email</span>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span className="mc-missing">Not provided</span>}</div>
        <div><span>Phone</span>{client.phone ? <a href={`tel:${String(client.phone).replace(/[^\d+]/g, "")}`}>{client.phone}</a> : <span className="mc-missing">Not provided</span>}</div>
        <div className="mc-address"><span>Address</span><span>{client.address || "Not provided"}</span></div>
      </div>
      <div className="mc-card-meta"><span>Added {formatDate(client.created_at)}</span>{Array.isArray(client.cleaners) && <span>{client.cleaners.length} assigned</span>}</div>
      <div className="mc-card-actions"><button type="button" className={`mc-button ${open ? "" : "mc-button-primary"}`} aria-expanded={open} aria-controls={`mc-editor-${client.id}`} disabled={busy || loading} onClick={() => selectClient(client)}>{open ? "Close details" : "Edit client"}<span aria-hidden="true">{open ? " −" : " ↗"}</span></button><ClientTaskListManager client={client} authAxios={authAxios} buttonClassName="mc-button mc-button-tasks" /></div>
      {open && <div className="mc-expanded" id={`mc-editor-${client.id}`}>
        <section className="mc-sheet"><div className="mc-sheet-heading"><div><h4>Client details & notes</h4><p>Keep contact information and cleaning instructions up to date.</p></div>{dirty && <span className="mc-unsaved">Unsaved changes</span>}</div>
          <fieldset className="mc-form-guard" disabled={busy || loading}><EditClient client={selectedClient} updateClientField={updateClientField} handlePhoneChange={handlePhoneChange} saveClient={saveClient} /></fieldset>
        </section>
        <section className="mc-sheet"><div className="mc-sheet-heading"><div><h4>Assigned cleaners</h4><p>Manage the team responsible for this client.</p></div><button type="button" className="mc-button mc-button-small" disabled={busy || loading || !directoryReady} onClick={() => runOperation(() => reloadAssignments(client.id), "Could not reload assignments.")}>Reload assignments</button></div>
          {directoryReady ? <fieldset className="mc-form-guard" disabled={busy || loading}><AssignCleaners client={selectedClient} staff={staff} admins={admins} onAssign={assignCleaner} onRemove={removeAssignment} /></fieldset> : <p className="mc-warning">Refresh the staff directory to manage assignments.</p>}
        </section>
        <div className="mc-delete-area"><div><strong>Delete this client</strong><p>Permanently removes the client and related records. This cannot be undone.</p></div><button type="button" className="mc-button mc-button-danger" disabled={busy || loading} onClick={deleteClient}>Delete client</button></div>
      </div>}
    </article>;
  }

  return <div className="mc-root">
    <style>{CSS}</style>
    <header className="mc-header"><div><span className="mc-eyebrow">CLIENT MANAGEMENT</span><h2>All clients</h2><p>People, cleaning teams, and task lists. Everything in one place.</p></div><button type="button" className="mc-button" disabled={loading || busy} onClick={refresh}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
    <div className="mc-stats"><div><span>Total clients</span><strong>{clients.length}</strong></div><div><span>Active</span><strong>{counts.active}</strong></div><div><span>New & waitlist</span><strong>{counts.new + counts.waitlist}</strong></div><div><span>Paused</span><strong>{counts.paused}</strong></div></div>
    <div className="mc-feedback" aria-live="polite">{notice && <p className="mc-success">✓ {notice}</p>}{error && <p className="mc-error" role="alert">{error}</p>}{directoryError && <p className="mc-warning">{directoryError}</p>}{busy && <p role="status">Saving changes…</p>}</div>
    <div className="mc-tools"><label className="mc-search"><span>Find a client</span><input type="search" placeholder="Name, email, phone, address, or status…" value={searchTerm} disabled={busy} onChange={event => changeView(() => { setSearchTerm(event.target.value); setCollapsed({}); })} /></label><label><span>Sort within status</span><select value={sort} disabled={busy} onChange={event => setSort(event.target.value)}><option value="name">Name: A–Z</option><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
    <div className="mc-filters" aria-label="Filter clients by status"><button type="button" className={statusFilter === "all" ? "is-active" : ""} aria-pressed={statusFilter === "all"} disabled={busy} onClick={() => changeView(() => { setStatusFilter("all"); setCollapsed({}); })}>All <span>{clients.length}</span></button>{[...STATUS_ORDER, ...(counts.other ? ["other"] : [])].map(key => <button type="button" key={key} aria-pressed={statusFilter === key} className={statusFilter === key ? "is-active" : ""} disabled={busy} onClick={() => changeView(() => { setStatusFilter(key); setCollapsed({}); })}>{STATUS_META[key].label}<span>{counts[key]}</span></button>)}</div>
    <div className="mc-results"><span role="status">Showing <strong>{filteredClients.length}</strong> of {clients.length} clients</span>{(searchTerm || statusFilter !== "all") && <button type="button" className="mc-text-button" disabled={busy} onClick={() => changeView(() => { setSearchTerm(""); setStatusFilter("all"); setCollapsed({}); })}>Clear filters</button>}</div>
    {loading && !clients.length ? <div className="mc-empty" role="status"><div className="mc-spinner" aria-hidden="true" /><h3>Loading your clients</h3><p>Getting client details and your team directory ready.</p></div> : !filteredClients.length ? <div className="mc-empty"><span className="mc-empty-icon" aria-hidden="true">☷</span><h3>{error ? "Clients are unavailable" : clients.length ? "No matching clients" : "Your client list is ready for a fresh start"}</h3><p>{error ? "Use Refresh to try again." : clients.length ? "Try another search or clear the status filter." : "Clients will appear here once they have been added."}</p></div> : <div className="mc-groups">{groups.map(([key, list]) => <section key={key} className="mc-group"><button type="button" className="mc-group-heading" disabled={busy} aria-expanded={!collapsed[key]} aria-controls={`mc-group-${key}`} onClick={() => { if (selectedClient && groupOf(selectedClient) === key && !collapsed[key] && !canLeaveEditor()) return; if (!collapsed[key] && selectedClient && groupOf(selectedClient) === key) { setSelectedClient(null); setBaseline(""); } setCollapsed(previous => ({ ...previous, [key]: !previous[key] })); }}><span><span className="mc-dot" style={{ background: STATUS_META[key].color }} />{STATUS_META[key].label}<span className="mc-group-count">{list.length}</span></span><span aria-hidden="true">{collapsed[key] ? "+" : "−"}</span></button>{!collapsed[key] && <div className="mc-grid" id={`mc-group-${key}`}>{list.map(renderCard)}</div>}</section>)}</div>}
  </div>;
}

const CSS = `
.mc-root{background:#f5f8fc;color:#172b41;border:1px solid #e1e8f0;border-radius:22px;padding:clamp(16px,3vw,32px);font-family:inherit;line-height:1.5;text-align:left;color-scheme:light;min-width:0}.mc-root *{box-sizing:border-box}.mc-root h2,.mc-root h3,.mc-root h4,.mc-root p{margin:0}.mc-root h2,.mc-root h3,.mc-root h4{color:#172b41}.mc-root button,.mc-root input,.mc-root select,.mc-root textarea{font-family:inherit}.mc-root button{cursor:pointer}.mc-root button:disabled{cursor:not-allowed;opacity:.55}.mc-root :focus-visible{outline:3px solid #0891b2;outline-offset:3px}.mc-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}.mc-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;color:#0e7490}.mc-header h2{font-size:clamp(26px,3vw,34px);font-weight:750;letter-spacing:-.03em;margin:4px 0}.mc-header p{font-size:14px;color:#52677d;max-width:520px}.mc-root .mc-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;border:1px solid #ccd8e5;background:#fff;color:#25435e;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;line-height:1.4;text-align:center;text-decoration:none;transition:background .15s,border-color .15s}.mc-root .mc-button:hover:not(:disabled){background:#edf4fa;border-color:#93b0c9}.mc-root .mc-button-primary{background:#0e7490;border-color:#0e7490;color:#fff}.mc-root .mc-button-primary:hover:not(:disabled){background:#155e75}.mc-root .mc-button-tasks{background:#ecfeff;border-color:#a5dce6;color:#155e75}.mc-root .mc-button-danger{color:#b42336;border-color:#f2bdc5;background:#fff}.mc-root .mc-button-danger:hover:not(:disabled){background:#fff1f2}.mc-root .mc-button-small{font-size:12px;padding:8px 10px}.mc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:22px}.mc-stats>div{background:#fff;border:1px solid #e0e8f0;border-radius:14px;padding:16px 20px}.mc-stats span{display:block;color:#52677d;font-size:12px;font-weight:600}.mc-stats strong{display:block;font-size:28px;font-weight:750;color:#183a55;line-height:1.3;margin-top:5px}.mc-feedback:empty{display:none}.mc-feedback>p{padding:12px 16px;border-radius:10px;font-size:13px;margin-bottom:12px;background:#edf4fa;color:#264862}.mc-feedback .mc-success{background:#ecfdf3;color:#166534;border:1px solid #bdebd0}.mc-feedback .mc-error{background:#fff1f2;color:#9f1239;border:1px solid #fecdd3}.mc-root .mc-warning{background:#fff9eb;color:#855214;padding:12px 16px;border-radius:10px;font-size:13px}.mc-tools{display:flex;align-items:flex-end;gap:14px;background:#fff;border:1px solid #e0e8f0;padding:18px;border-radius:16px}.mc-tools label{display:block;min-width:0}.mc-tools label>span{display:block;font-size:12px;font-weight:700;color:#36516b;margin-bottom:7px}.mc-search{flex:1}.mc-tools input,.mc-tools select{display:block;width:100%;border:1px solid #cbd8e5;border-radius:10px;padding:11px 13px;min-height:46px;background:#fff;color:#172b41;font-size:16px}.mc-tools input::placeholder{color:#667a8e;opacity:1}.mc-tools select{min-width:170px}.mc-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.mc-filters button{display:flex;align-items:center;gap:8px;padding:8px 12px;min-height:40px;background:#fff;color:#465d73;border:1px solid #dbe4ed;border-radius:9px;font-size:12px;font-weight:650}.mc-filters button>span{font-size:10px;min-width:18px;padding:1px 5px;border-radius:4px;background:#f0f4f8;color:#496176}.mc-filters button.is-active{background:#155e75;color:#fff;border-color:#155e75}.mc-filters button.is-active>span{background:#e0f2fe;color:#164e63}.mc-results{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:18px 0;color:#52677d;font-size:12px}.mc-root .mc-text-button{border:0;background:transparent;color:#0e7490;min-height:40px;font-size:12px;font-weight:700;text-decoration:underline}.mc-group{margin-top:22px}.mc-group-heading{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;background:transparent;padding:0 2px 12px;min-height:44px;color:#25435e;font-size:14px;font-weight:750}.mc-group-heading>span:first-child{display:flex;align-items:center;gap:10px}.mc-dot{width:8px;height:8px;border-radius:50%}.mc-group-count{background:#e7edf4;color:#425a70;padding:2px 7px;border-radius:5px;font-size:11px}.mc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:16px}.mc-card{background:#fff;border:1px solid #dce5ee;border-radius:16px;box-shadow:0 3px 10px #20395205;min-width:0;overflow:hidden}.mc-card-open{grid-column:1/-1;border-color:#70b9cc;box-shadow:0 0 0 2px #daf2f7}.mc-card-top{display:flex;align-items:center;gap:12px;padding:20px 20px 14px}.mc-avatar{display:flex;align-items:center;justify-content:center;width:44px;height:44px;flex-shrink:0;border-radius:13px;background:#eaf4fb;color:#235a7e;font-size:15px;font-weight:800}.mc-identity{min-width:0;flex:1}.mc-identity h3{font-size:17px;font-weight:750;overflow-wrap:anywhere;letter-spacing:-.015em}.mc-status{display:inline-block;font-size:10px;font-weight:750;line-height:1.5;padding:3px 8px;border-radius:6px;margin-top:4px;text-transform:capitalize}.mc-client-id{font-size:11px;color:#667a8e;align-self:flex-start}.mc-contact{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;padding:0 20px 14px}.mc-contact>div{min-width:0}.mc-contact>div>span:first-child{display:block;font-size:10px;letter-spacing:.04em;text-transform:uppercase;font-weight:700;color:#667a8e;margin-bottom:3px}.mc-contact a{font-size:13px;color:#155e75;text-decoration:none;overflow-wrap:anywhere}.mc-contact a:hover{text-decoration:underline}.mc-contact>div>span:last-child{font-size:13px;color:#415971;overflow-wrap:anywhere}.mc-contact .mc-address{grid-column:1/-1}.mc-card-meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:0 20px 14px;color:#61758a;font-size:11px}.mc-card-actions{display:flex;gap:10px;padding:14px 20px;border-top:1px solid #edf1f6;background:#fcfdff}.mc-card-actions>.mc-button{flex:1}.mc-expanded{padding:20px;background:#f3f7fb;border-top:1px solid #dce7ef}.mc-sheet{background:#fff;padding:20px;border-radius:13px;border:1px solid #dce5ee;margin-bottom:16px;min-width:0}.mc-sheet-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #e8eef4}.mc-sheet-heading h4{font-size:15px;font-weight:750}.mc-sheet-heading p{font-size:12px;color:#5b7186;margin-top:3px}.mc-unsaved{background:#fff7dd;color:#855214;padding:5px 8px;font-size:10px;font-weight:700;border-radius:6px;white-space:nowrap}.mc-form-guard{padding:0;margin:0;border:0;min-width:0;color:#243c54}.mc-form-guard:disabled{opacity:.65;pointer-events:none}.mc-form-guard label{color:#334e68!important}.mc-form-guard input:not([type=checkbox]):not([type=radio]),.mc-form-guard select,.mc-form-guard textarea{background-color:#fff!important;color:#172b41!important;border:1px solid #cbd8e5!important;max-width:100%;font-size:16px}.mc-form-guard input::placeholder,.mc-form-guard textarea::placeholder{color:#667a8e!important;opacity:1}.mc-form-guard input:-webkit-autofill{-webkit-text-fill-color:#172b41;-webkit-box-shadow:0 0 0 1000px #fff inset}.mc-delete-area{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px;border:1px solid #f2dce1;border-radius:12px;background:#fffafb}.mc-delete-area strong{font-size:13px;color:#8f2338}.mc-delete-area p{font-size:12px;color:#76535e;margin-top:3px;max-width:440px}.mc-delete-area button{flex-shrink:0}.mc-empty{background:#fff;border:1px dashed #cbd8e5;border-radius:16px;padding:44px 20px;text-align:center;margin-top:18px}.mc-empty h3{font-size:18px;font-weight:700}.mc-empty p{font-size:13px;color:#5b7186;margin-top:7px}.mc-empty-icon{font-size:36px;color:#0e7490}.mc-spinner{width:28px;height:28px;border:3px solid #dcecf1;border-top-color:#0e7490;border-radius:50%;margin:0 auto 16px;animation:mc-spin .8s linear infinite}@keyframes mc-spin{to{transform:rotate(360deg)}}
@media(max-width:820px){.mc-grid{grid-template-columns:1fr}.mc-stats>div{padding:14px}.mc-stats strong{font-size:24px}.mc-sheet-heading{flex-wrap:wrap}}
@media(max-width:520px){.mc-root{padding:14px;border-radius:14px}.mc-header{align-items:flex-start;gap:12px}.mc-header p{font-size:12px}.mc-header>.mc-button{font-size:12px;padding:9px 10px}.mc-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.mc-tools{flex-direction:column;align-items:stretch;padding:12px}.mc-filters{flex-wrap:nowrap;overflow-x:auto;padding:2px 2px 8px}.mc-filters button{white-space:nowrap;flex-shrink:0;min-height:44px}.mc-contact{grid-template-columns:1fr;padding:0 16px 14px}.mc-card-top{padding:16px 16px 12px}.mc-card-meta{padding-left:16px;padding-right:16px}.mc-card-actions{padding:12px;flex-direction:column;gap:8px}.mc-expanded{padding:10px}.mc-sheet{padding:14px}.mc-delete-area{align-items:stretch;flex-direction:column;padding:14px}.mc-identity h3{font-size:16px}.mc-sheet-heading{gap:10px}}
@media(prefers-reduced-motion:reduce){.mc-spinner{animation:none}.mc-root .mc-button{transition:none}}
`;
