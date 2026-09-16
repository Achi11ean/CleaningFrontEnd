import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Pass the authenticated Axios instance from useAdmin() OR useStaff().
// This component never reads tokens or changes your Axios base URL.
export default function ClientTaskListManager({ client, authAxios, buttonClassName, onChanged }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={buttonClassName} style={!buttonClassName ? { padding: "10px 14px", borderRadius: 12, background: "#ecfeff", border: "1px solid #a5f3fc", color: "#155e75", fontWeight: 700, cursor: "pointer" } : undefined}
      disabled={!client?.id} onClick={e => { e.stopPropagation(); setOpen(true); }}>☷ Manage task lists</button>
    {open && createPortal(<TaskListDialog key={client.id} client={client} api={authAxios} onChanged={onChanged} onClose={() => setOpen(false)} />, document.body)}
  </>;
}

const blankList = { name: "", description: "" };
const blankTask = { title: "", description: "", room: "", is_required: true, is_active: true };
const message = error => error?.response?.data?.error || error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";

function TaskListDialog({ client, api, onClose, onChanged }) {
  const [lists, setLists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const [confirm, setConfirm] = useState(null);
  const root = useRef(null);
  const alive = useRef(true);
  const lock = useRef(false);
  const apiRef = useRef(api);
  apiRef.current = api;
  const closeRef = useRef(null);
  const active = lists.find(l => l.id === selected);
  const items = useMemo(() => [...(active?.items || [])].sort((a, b) => a.display_order - b.display_order || a.id - b.id), [active]);
  const rooms = [...new Set(items.map(t => t.room || "").filter(Boolean))];
  const groups = useMemo(() => {
    const result = new Map();
    for (const item of items) {
      if (query && !`${item.title} ${item.description || ""} ${item.room || ""}`.toLowerCase().includes(query.toLowerCase().trim())) continue;
      const room = item.room || "";
      if (!result.has(room)) result.set(room, []);
      result.get(room).push(item);
    }
    return [...result];
  }, [items, query]);
  const visibleLists = lists.filter(l => status === "all" || (status === "active" ? l.is_active : !l.is_active));
  const clientName = client.name || client.business_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || `Client #${client.id}`;

  async function load(preferred) {
    if (!apiRef.current?.get) throw new Error("Pass authAxios from your Admin or Staff context to this component.");
    const { data } = await apiRef.current.get(`/clients/${client.id}/task-lists`);
    if (!Array.isArray(data.task_lists)) throw new Error("The server returned an unexpected task-list response.");
    if (!alive.current) return;
    setLists(data.task_lists);
    setSelected(current => data.task_lists.some(l => l.id === (preferred ?? current)) ? (preferred ?? current) : (data.task_lists[0]?.id ?? null));
  }
  useEffect(() => {
    alive.current = true;
    load().catch(e => { if (alive.current) setError(message(e)); }).finally(() => { if (alive.current) setLoading(false); });
    return () => { alive.current = false; };
  }, [client.id]); // API is read from a ref so unstable context values do not trigger refetch loops.

  function close() {
    if (lock.current) return;
    if (editor && !window.confirm("Discard the form you are editing and close?")) return;
    onClose();
  }
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    function keydown(e) {
      if (e.key === "Escape") { e.preventDefault(); closeRef.current(); }
      if (e.key !== "Tab") return;
      const nodes = [...root.current.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(n => n.getClientRects().length);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { e.preventDefault(); root.current.focus(); return; }
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || document.activeElement === root.current)) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus?.(); };
  }, []);
  useEffect(() => { if (editor) root.current?.querySelector(".ctl-editor input")?.focus(); }, [editor]);

  useEffect(() => { if (confirm) root.current?.querySelector(".ctl-confirm")?.focus(); }, [confirm]);

  async function mutate(action, success) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const preferred = await action();
      if (!alive.current) return;
      setEditor(null); setConfirm(null); setNotice(success);
      try { await load(preferred); }
      catch (e) { setError(`Saved, but could not refresh: ${message(e)} Use Refresh before making another change.`); }
      if (onChanged) { try { onChanged(client.id); } catch (_) { /* A parent notification must not mark a saved edit as failed. */ } }
    } catch (e) { if (alive.current) setError(message(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  function begin(kind, value) {
    if (busy) return;
    if (editor && !window.confirm("Discard the current form?")) return;
    setConfirm(null); setError("");
    setEditor({ kind, id: value?.id });
    setDraft(kind === "list" ? { ...blankList, ...value } : { ...blankTask, ...value });
  }
  function choose(id) {
    if (editor && !window.confirm("Discard the current form and switch lists?")) return;
    setSelected(id); setEditor(null); setConfirm(null); setQuery(""); setCollapsed({}); setError(""); setNotice("");
  }
  function submit(e) {
    e.preventDefault();
    if (editor.kind === "list") {
      const payload = { name: draft.name.trim(), description: draft.description?.trim() || "" };
      if (!payload.name) { setError("Enter a list name."); return; }
      mutate(async () => {
        const { data } = editor.id ? await apiRef.current.patch(`/client-task-lists/${editor.id}`, payload) : await apiRef.current.post(`/clients/${client.id}/task-lists`, payload);
        setStatus("all"); return data.task_list.id;
      }, editor.id ? "List updated." : "List created. Add your first room and task below.");
    } else {
      const payload = { title: draft.title.trim(), description: draft.description?.trim() || "", room: draft.room?.trim() || null, is_required: !!draft.is_required, is_active: !!draft.is_active };
      if (!payload.title) { setError("Enter a task title."); return; }
      mutate(async () => {
        if (editor.id) await apiRef.current.patch(`/client-task-list-items/${editor.id}`, payload);
        else await apiRef.current.post(`/client-task-lists/${selected}/items`, payload);
        setQuery(""); setCollapsed({});
      }, editor.id ? "Task updated." : "Task added.");
    }
  }
  function move(item, direction) {
    const siblings = items.filter(t => (t.room || "") === (item.room || ""));
    const other = siblings[siblings.findIndex(t => t.id === item.id) + direction];
    if (!other) return;
    const ordered = [...items], a = ordered.findIndex(t => t.id === item.id), b = ordered.findIndex(t => t.id === other.id);
    [ordered[a], ordered[b]] = [ordered[b], ordered[a]];
    mutate(() => apiRef.current.patch(`/client-task-lists/${selected}/reorder`, { items: ordered.map((t, index) => ({ id: t.id, display_order: index })) }).then(() => undefined), "Task order saved.");
  }
  async function refresh() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await load(); } catch (e) { setError(message(e)); }
    finally { lock.current = false; if (alive.current) { setBusy(false); setLoading(false); } }
  }
  const actionDisabled = busy || !!editor || !!confirm;
  return <div className="ctl-backdrop" onClick={e => e.stopPropagation()}>
    <style>{styles}</style>
    <section className="ctl" role="dialog" aria-modal="true" aria-labelledby="ctl-title" tabIndex={-1} ref={root}>
      <header className="ctl-header"><div><span className="ctl-eyebrow">CLIENT WORKSPACE</span><h2 id="ctl-title">{clientName}</h2><p>Task lists · Organized room by room</p></div><button type="button" onClick={close} disabled={busy} aria-label="Close task-list manager">✕</button></header>
      <div className="ctl-feedback" aria-live="polite">{notice && <p className="ctl-success">✓ {notice}</p>}{error && <p role="alert" className="ctl-error">{error}</p>}</div>
      <div className="ctl-layout">
        <aside className="ctl-sidebar"><div className="ctl-row"><h3>Task lists <small>({lists.length})</small></h3><button type="button" onClick={refresh} disabled={busy || !!editor || !!confirm}>Refresh</button></div>
          <button type="button" className="ctl-primary ctl-wide" disabled={busy} onClick={() => begin("list")}>＋ Create list</button>
          <label className="ctl-field">Show lists<select value={status} disabled={busy} onChange={e => setStatus(e.target.value)}><option value="all">All lists</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
          {loading ? <p role="status">Loading task lists…</p> : <div className="ctl-list-nav">{visibleLists.map(list => <button type="button" key={list.id} disabled={busy} aria-pressed={list.id === selected} className={`ctl-list-link ${list.id === selected ? "is-selected" : ""}`} onClick={() => choose(list.id)}><strong>{list.name}</strong><span>{list.items?.length || 0} tasks · {list.is_active ? "Active" : "Archived"}</span></button>)}{!visibleLists.length && <p className="ctl-muted">{lists.length ? "No lists in this view." : "Create a list for regular visits, deep cleans, or a custom service."}</p>}</div>}
        </aside>
        <main className="ctl-main" aria-busy={busy || loading}>
          {editor && <form className="ctl-editor" onSubmit={submit}><h3>{editor.id ? "Edit" : "New"} {editor.kind === "list" ? "task list" : "task"}</h3>
            <fieldset disabled={busy}>
              <label className="ctl-field">{editor.kind === "list" ? "List name" : "Task title"}<input required maxLength={editor.kind === "list" ? 200 : 255} value={(editor.kind === "list" ? draft.name : draft.title) || ""} placeholder={editor.kind === "list" ? "e.g. Weekly cleaning" : "e.g. Sanitize countertops"} onChange={e => setDraft({ ...draft, [editor.kind === "list" ? "name" : "title"]: e.target.value })} /></label>
              {editor.kind === "task" && <label className="ctl-field">Room / area<input list="ctl-room-options" maxLength={100} value={draft.room || ""} placeholder="Choose or type a room, e.g. Kitchen" onChange={e => setDraft({ ...draft, room: e.target.value })} /><datalist id="ctl-room-options">{rooms.map(room => <option key={room} value={room} />)}</datalist><small>Type a new room to create its section. Leave blank for General.</small></label>}
              <label className="ctl-field">{editor.kind === "list" ? "Description" : "Instructions"} <small>(optional)</small><textarea rows={3} value={draft.description || ""} placeholder="Add helpful details…" onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
              {editor.kind === "task" && <div className="ctl-checks"><label><input type="checkbox" checked={!!draft.is_required} onChange={e => setDraft({ ...draft, is_required: e.target.checked })} /> Required task</label><label><input type="checkbox" checked={!!draft.is_active} onChange={e => setDraft({ ...draft, is_active: e.target.checked })} /> Active task</label></div>}
              <div className="ctl-actions"><button type="submit" className="ctl-primary">{busy ? "Saving…" : "Save " + (editor.kind === "list" ? "list" : "task")}</button><button type="button" onClick={() => { if (window.confirm("Discard this form?")) setEditor(null); }}>Cancel</button></div>
            </fieldset>
          </form>}
          {active ? <>
            <div className="ctl-list-heading"><div><span className={`ctl-badge ${!active.is_active ? "ctl-inactive" : ""}`}>{active.is_active ? "Active list" : "Archived list"}</span><h3>{active.name}</h3>{active.description && <p className="ctl-description">{active.description}</p>}<p className="ctl-muted">{items.length} tasks · {new Set(items.map(t => t.room || "")).size} rooms / areas · {items.filter(t => t.is_required && t.is_active).length} active required</p></div>
              <div className="ctl-actions"><button type="button" disabled={actionDisabled} onClick={() => begin("list", active)}>Edit list</button><button type="button" disabled={actionDisabled} onClick={() => mutate(() => apiRef.current.patch(`/client-task-lists/${active.id}/${active.is_active ? "archive" : "restore"}`).then(() => undefined), active.is_active ? "List archived." : "List restored.")}>{active.is_active ? "Archive" : "Restore"}</button><button type="button" className="ctl-danger" disabled={actionDisabled || active.has_completed_sessions} title={active.has_completed_sessions ? "Archive this list to preserve completed cleaning history." : "Delete list"} onClick={() => setConfirm({ kind: "list", id: active.id, name: active.name })}>Delete list</button></div>
            </div>
            {active.has_completed_sessions && <p className="ctl-note">This list has completed cleaning history. Archive it when it is no longer needed.</p>}
            {!active.is_active && <p className="ctl-note">Archived lists are hidden from new cleaning visits. You can edit this list and restore it when ready.</p>}
            {confirm && <div className="ctl-confirm" role="alert" tabIndex={-1}><strong>Delete “{confirm.name}”?</strong><p>{confirm.kind === "list" ? "This permanently removes the list, all its tasks, and any associated cleaning sessions. Archive instead to keep them." : "This permanently removes the task from this template. Existing cleaning-session snapshots are retained by your backend."}</p><div className="ctl-actions"><button type="button" className="ctl-danger" disabled={busy} onClick={() => mutate(() => apiRef.current.delete(confirm.kind === "list" ? `/client-task-lists/${confirm.id}` : `/client-task-list-items/${confirm.id}`).then(() => undefined), "Deleted successfully.")}>Yes, delete</button><button type="button" disabled={busy} onClick={() => setConfirm(null)}>Keep it</button></div></div>}
            <div className="ctl-toolbar"><label className="ctl-field"><span className="ctl-sr">Search tasks or rooms</span><input type="search" value={query} placeholder="Search tasks or rooms…" onChange={e => setQuery(e.target.value)} /></label><button type="button" className="ctl-primary" disabled={actionDisabled} onClick={() => begin("task")}>＋ Add task / room</button></div>
            {!items.length && <div className="ctl-empty"><span aria-hidden="true">☷</span><h3>A fresh start for this client</h3><p>Add a task and give it a room. Tasks in the same room will stay together.</p></div>}
            {!!items.length && !groups.length && <p className="ctl-empty">No tasks match your search.</p>}
            {groups.map(([room, tasks]) => <section className="ctl-room" key={room}><div className="ctl-room-head"><button type="button" aria-expanded={!collapsed[room]} onClick={() => setCollapsed({ ...collapsed, [room]: !collapsed[room] })}><span aria-hidden="true">{collapsed[room] ? "▸" : "▾"}</span> {room || "General"} <small>{tasks.length} tasks</small></button><button type="button" disabled={actionDisabled} onClick={() => begin("task", { room })}>＋ Task</button></div>
              {!collapsed[room] && <ul>{tasks.map(task => { const siblings = items.filter(t => (t.room || "") === room); const index = siblings.findIndex(t => t.id === task.id); return <li key={task.id} className={!task.is_active ? "ctl-task-inactive" : ""}><div className="ctl-task-copy"><strong>{task.title}</strong><div className="ctl-tags"><span className="ctl-badge">{task.is_required ? "Required" : "Optional"}</span>{!task.is_active && <span className="ctl-badge ctl-inactive">Inactive</span>}</div>{task.description && <p className="ctl-description">{task.description}</p>}</div><div className="ctl-task-actions"><button type="button" disabled={actionDisabled || index === 0 || !!query.trim()} aria-label={`Move ${task.title} up`} onClick={() => move(task, -1)}>↑</button><button type="button" disabled={actionDisabled || index === siblings.length - 1 || !!query.trim()} aria-label={`Move ${task.title} down`} onClick={() => move(task, 1)}>↓</button><button type="button" disabled={actionDisabled} onClick={() => begin("task", task)}>Edit</button><button type="button" className="ctl-danger" disabled={actionDisabled} aria-label={`Delete ${task.title}`} onClick={() => setConfirm({ kind: "task", id: task.id, name: task.title })}>Delete</button></div></li>; })}</ul>}
            </section>)}
          </> : !editor && !loading && <div className="ctl-empty"><span aria-hidden="true">☷</span><h3>Every client. Every room. Every detail.</h3><p>Create your first task list to organize this client’s cleaning routine.</p><button type="button" className="ctl-primary" disabled={busy} onClick={() => begin("list")}>Create first list</button></div>}
        </main>
      </div><footer className="ctl-footer"><span>{busy ? "Saving / refreshing…" : "Changes apply to the template for future cleaning sessions."}</span><button type="button" disabled={busy} onClick={close}>Done</button></footer>
    </section>
  </div>;
}

const styles = `
.ctl-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.6);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:24px}
.ctl{font-family:inherit;line-height:1.5;color:#183044;background:#fff;width:min(1120px,100%);max-height:92vh;max-height:92dvh;border-radius:24px;box-shadow:0 30px 100px #0004;display:flex;flex-direction:column;overflow:hidden;text-align:left;isolation:isolate}
.ctl *{box-sizing:border-box}.ctl h2,.ctl h3,.ctl p{margin:0}.ctl h2{font-size:24px;font-weight:750;overflow-wrap:anywhere}.ctl h3{font-size:17px;font-weight:750}.ctl small{font-size:12px;font-weight:500}.ctl button,.ctl input,.ctl select,.ctl textarea{font:inherit}.ctl button{border:1px solid #d9e3e9;background:#fff;color:#23465a;border-radius:10px;min-height:40px;padding:8px 12px;cursor:pointer;font-size:13px;font-weight:650;transition:background .15s}.ctl button:hover:not(:disabled){background:#edf8fa}.ctl button:disabled{opacity:.45;cursor:not-allowed}.ctl :focus-visible{outline:3px solid #0891b2;outline-offset:3px}.ctl .ctl-primary{background:#0e7490;color:#fff;border-color:#0e7490}.ctl .ctl-primary:hover:not(:disabled){background:#155e75}.ctl .ctl-danger{color:#b42336}.ctl-header{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 26px;background:linear-gradient(120deg,#e9fbfc,#f8fafc);border-bottom:1px solid #dce9ee}.ctl-header p{font-size:13px;color:#567080;margin-top:3px}.ctl-eyebrow{color:#0e7490;font-size:10px;letter-spacing:.16em;font-weight:800}.ctl-layout{display:grid;grid-template-columns:250px minmax(0,1fr);min-height:0;overflow:auto;flex:1}.ctl-sidebar{padding:20px;background:#f8fafc;border-right:1px solid #e2e8f0}.ctl-row{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:14px}.ctl-row button{font-size:11px;padding:6px}.ctl-wide{width:100%}.ctl-field{display:block;font-size:13px;font-weight:650;margin:12px 0}.ctl-field input,.ctl-field textarea,.ctl-field select{display:block;width:100%;min-width:0;border:1px solid #cbd9e0;border-radius:10px;background:#fff;color:#183044;padding:10px 12px;font-size:16px;font-weight:400;margin-top:5px}.ctl-field textarea{resize:vertical}.ctl-field small{display:inline-block;color:#617787;margin-top:5px}.ctl-list-nav{display:flex;flex-direction:column;gap:8px}.ctl .ctl-list-link{text-align:left;width:100%;padding:12px;overflow-wrap:anywhere}.ctl-list-link strong,.ctl-list-link span{display:block}.ctl-list-link span{font-size:11px;color:#617787;margin-top:5px}.ctl .is-selected{border-color:#0891b2;background:#e9f9fc;box-shadow:inset 3px 0 #0891b2}.ctl-main{padding:24px;min-width:0}.ctl-list-heading h3{font-size:23px;margin:8px 0;overflow-wrap:anywhere}.ctl-muted{font-size:12px;color:#617787;margin-top:10px!important}.ctl-description{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;color:#536b7b;margin-top:7px!important}.ctl-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.ctl-badge{display:inline-block;font-size:10px;font-weight:700;border-radius:6px;padding:3px 7px;color:#0e7490;background:#e8f7fa}.ctl-inactive{background:#eef0f3;color:#637080}.ctl-note{font-size:12px;color:#795820;background:#fff9e9;border-radius:10px;padding:10px 12px;margin-top:14px!important}.ctl-toolbar{display:flex;align-items:center;gap:12px;margin:15px 0}.ctl-toolbar .ctl-field{flex:1;margin:0}.ctl-toolbar input{margin:0}.ctl-room{border:1px solid #dce6eb;border-radius:14px;overflow:hidden;margin:14px 0}.ctl-room-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;background:#f1f7f9}.ctl-room-head>button:first-child{background:transparent;border:0;text-align:left;flex:1;font-size:15px;overflow-wrap:anywhere}.ctl-room-head small{display:inline-block;color:#617787;margin-left:8px}.ctl-room ul{list-style:none;margin:0;padding:0}.ctl-room li{display:flex;gap:12px;justify-content:space-between;align-items:center;padding:16px;border-top:1px solid #edf1f5}.ctl-task-copy{min-width:0}.ctl-task-copy>strong{font-size:14px;overflow-wrap:anywhere}.ctl-tags{display:flex;gap:6px;margin-top:5px}.ctl-task-actions{display:flex;flex-wrap:wrap;gap:5px;flex-shrink:0}.ctl-task-actions button{padding:7px 9px;font-size:12px}.ctl-task-inactive{background:#fafbfc}.ctl-editor{padding:20px;border:1px solid #9ed7e2;border-radius:15px;background:#f4fbfc;margin-bottom:24px}.ctl fieldset{border:0;margin:0;padding:0;min-width:0}.ctl-checks{display:flex;flex-wrap:wrap;gap:20px;font-size:13px}.ctl-checks label{display:flex;gap:8px;align-items:center;min-height:40px}.ctl-checks input{width:18px;height:18px;accent-color:#0e7490}.ctl-feedback:empty{display:none}.ctl-feedback p{padding:10px 24px;font-size:13px}.ctl-success{background:#edf9f1;color:#24623d}.ctl-error{background:#fff1f2;color:#9f1239}.ctl-confirm{border:1px solid #fecdd3;background:#fff5f6;border-radius:12px;padding:16px;margin-top:16px}.ctl-confirm p{font-size:13px;margin-top:6px}.ctl-empty{padding:36px 14px;text-align:center;color:#617787}.ctl-empty>span{font-size:42px;color:#0e7490}.ctl-empty p{font-size:14px;max-width:370px;margin:10px auto 20px}.ctl-footer{border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:15px;padding:12px 24px;background:#fff}.ctl-footer span{font-size:11px;color:#617787}.ctl-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:760px){.ctl-backdrop{padding:0}.ctl{height:100dvh;max-height:100dvh;width:100%;border-radius:0}.ctl-header{padding:16px}.ctl h2{font-size:20px}.ctl-layout{display:block}.ctl-sidebar{border-right:0;border-bottom:1px solid #e2e8f0;padding:14px}.ctl-list-nav{flex-direction:row;overflow:auto;padding:3px 3px 8px}.ctl .ctl-list-link{min-width:165px;max-width:220px;flex-shrink:0}.ctl-main{padding:16px}.ctl-room li{align-items:flex-start;flex-direction:column}.ctl-task-actions{align-self:flex-end}.ctl-toolbar{flex-wrap:wrap}.ctl-toolbar .ctl-field{flex-basis:100%}.ctl-toolbar>button{width:100%}.ctl button{min-height:44px}.ctl-footer{padding:10px 16px}.ctl-room-head{padding:7px}.ctl-editor{padding:14px}}
`;
