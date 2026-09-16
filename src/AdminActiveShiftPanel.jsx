import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAdmin } from "./AdminContext";
import ConsultationChecklist from "./ConsultationChecklist";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

const CLOUD_NAME = "dcemixedh";
const UPLOAD_PRESET = "cleaning";
const errorText = (error, fallback) => error?.response?.data?.error || error?.message || fallback;
const sameId = (a, b) => String(a ?? "") === String(b ?? "");
const time12 = value => {
  if (!value) return "—";
  const [h,m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  const date = new Date(); date.setHours(h,m,0,0);
  return date.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});
};
const dateTime = value => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "—";
};
function cleanerName(task) {
  const person = task.completed_by;
  const profile = person?.profile || person;
  return [profile?.first_name,profile?.last_name].filter(Boolean).join(" ") || person?.display_name || person?.username || "";
}

// hasConsultation must be supplied by a confirmed consultation lookup.
// resolveHasConsultation is an optional async ({ clientId, authAxios, activeShift }) => boolean.
// No consultation URL is assumed: the supplied backend contains only task routes.
export default function AdminActiveShiftPanel({ refreshKey, onShiftUpdated, hasConsultation = false, resolveHasConsultation, debug = true }) {
  const { authAxios } = useAdmin();
  // Temporary diagnostics: set debug={false} to silence. No tokens, photos,
  // contact details, task text, or freeform notes are logged.
  const log = useCallback((event, details) => {
    if (debug) console.log(`[AdminTasks] ${event}`, details);
  }, [debug]);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shiftError, setShiftError] = useState("");
  const [view, setView] = useState("tasks");
  const [consultationAvailable, setConsultationAvailable] = useState(false);
  const [consultationError, setConsultationError] = useState("");
  const [consultationVersion, setConsultationVersion] = useState(0);
  const [lists, setLists] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [listId, setListId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [listDiagnostic, setListDiagnostic] = useState("");
  const [busyTask, setBusyTask] = useState(null);
  const [starting, setStarting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [filter, setFilter] = useState("all");
  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [status, setStatus] = useState("");
  const shiftRef = useRef(null);
  const mounted = useRef(false);
  const shiftRequest = useRef(0);
  const taskRequest = useRef(0);
  const actionLock = useRef(false);
  const uploadLock = useRef(false);
  const fileRef = useRef(null);
  const clientId = activeShift?.client?.id;
  const scheduleId = activeShift?.schedule?.id ?? activeShift?.shift?.schedule_id ?? null;
  const shiftId = activeShift?.shift?.id;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; shiftRequest.current++; taskRequest.current++; }; }, []);
  const loadActiveShift = useCallback(async () => {
    const requestId = ++shiftRequest.current;
    setLoading(true); setShiftError("");
    try {
      const { data } = await authAxios.get("/admin/shifts/active");
      log("active shift response", {
        requestId, responseKeys: Object.keys(data || {}), active: data?.active,
        clientId: data?.client?.id, nestedShiftClientId: data?.shift?.client_id,
        scheduleId: data?.schedule?.id, nestedShiftScheduleId: data?.shift?.schedule_id,
        shiftId: data?.shift?.id,
      });
      if (!mounted.current || requestId !== shiftRequest.current) {
        log("active shift response ignored", { requestId, latestRequestId: shiftRequest.current, mounted: mounted.current });
        return;
      }
      const next = data.active ? data : null;
      if (!sameId(shiftRef.current?.shift?.id, next?.shift?.id)) {
        taskRequest.current++;
        setLists([]); setSessions([]); setListId(""); setSessionId("");
        setPhotoUrl(""); setMessage(""); setUploadError(""); setView("tasks"); setLastSynced(null);
      }
      shiftRef.current = next; setActiveShift(next);
    } catch (error) {
      log("active shift request failed", {status:error.response?.status,code:error.code,responseKeys:Object.keys(error.response?.data || {})});
      if (mounted.current && requestId === shiftRequest.current) setShiftError(errorText(error,"Unable to load your active shift."));
    } finally { if (mounted.current && requestId === shiftRequest.current) setLoading(false); }
  }, [authAxios, log]);
  useEffect(() => { loadActiveShift(); }, [loadActiveShift, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setConsultationAvailable(Boolean(hasConsultation)); setConsultationError("");
    if (clientId && resolveHasConsultation) {
      Promise.resolve().then(() => resolveHasConsultation({clientId,authAxios,activeShift:shiftRef.current})).then(exists => {
        if (!cancelled) setConsultationAvailable(Boolean(exists));
      }).catch(() => { if (!cancelled) setConsultationError("Could not check consultation availability. Refresh to try again."); });
    }
    return () => { cancelled = true; };
  }, [clientId, hasConsultation, resolveHasConsultation, authAxios, consultationVersion]);
  useEffect(() => { if (!consultationAvailable) setView("tasks"); }, [consultationAvailable]);

  const loadTasks = useCallback(async () => {
    if (!clientId) { log("task loading skipped: no client ID", {clientId,scheduleId}); return; }
    const requestId = ++taskRequest.current;
    log("loading checklists", {requestId,clientId,scheduleId,
      taskListsUrl:`/cleaning/clients/${clientId}/task-lists`,
      activeSessionsUrl:`/cleaning/clients/${clientId}/active-sessions`});
    setTasksLoading(true); setTaskError(""); setListDiagnostic("");
    try {
      const [templateRes, sessionRes] = await Promise.all([
        authAxios.get(`/cleaning/clients/${clientId}/task-lists`).then(response => {
          log("task-list response", {requestId,clientId,status:response.status,responseKeys:Object.keys(response.data || {}),
            lists: Array.isArray(response.data?.task_lists) ? response.data.task_lists.map(list=>({
              id:list.id,clientId:list.client_id,isActive:list.is_active,
              itemCount:Array.isArray(list.items)?list.items.length:null,
              activeItemCount:Array.isArray(list.items)?list.items.filter(item=>item.is_active).length:null,
            })) : "Expected task_lists array is missing"});
          return response;
        }).catch(error => {log("task-list request failed",{requestId,status:error.response?.status,code:error.code,responseKeys:Object.keys(error.response?.data || {})});throw error;}),
        authAxios.get(`/cleaning/clients/${clientId}/active-sessions`).then(response => {
          log("active-session response", {requestId,clientId,status:response.status,responseKeys:Object.keys(response.data || {}),
            sessions:Array.isArray(response.data?.cleaning_sessions)?response.data.cleaning_sessions.map(item=>({
              sessionId:item.id,taskListId:item.task_list_id,scheduleId:item.schedule_id,status:item.status,
              taskCount:Array.isArray(item.tasks)?item.tasks.length:null,
              totalTasks:item.total_tasks,completedTasks:item.completed_tasks,
              matchesCurrentSchedule:sameId(item.schedule_id,scheduleId),
            })):"Expected cleaning_sessions array is missing"});
          return response;
        }).catch(error => {log("active-session request failed",{requestId,status:error.response?.status,code:error.code,responseKeys:Object.keys(error.response?.data || {})});throw error;}),
      ]);
      if (!mounted.current || requestId !== taskRequest.current) {
        log("task responses ignored",{requestId,latestRequestId:taskRequest.current,mounted:mounted.current});return;
      }
      const templates = templateRes.data.task_lists || [];
      const open = (sessionRes.data.cleaning_sessions || []).filter(session => sameId(session.schedule_id,scheduleId));
      log("schedule matching", {requestId,scheduleId,templateCount:templates.length,
        matchingSessionIds:open.map(item=>item.id),
        excludedSessions:(sessionRes.data.cleaning_sessions || []).filter(item=>!sameId(item.schedule_id,scheduleId)).map(item=>({id:item.id,scheduleId:item.schedule_id,taskListId:item.task_list_id}))});
      setLists(templates); setSessions(previous => [...open, ...previous.filter(item => item.status === "completed" && !open.some(other => sameId(other.id,item.id)))]);
      setListId(previous => templates.some(list=>sameId(list.id,previous)) || open.some(session=>sameId(session.task_list_id,previous)) ? previous : String(open[0]?.task_list_id ?? templates[0]?.id ?? ""));
      setSessionId(previous => open.some(session=>sameId(session.id,previous)) ? previous : "");
      setLastSynced(new Date());
      if (templates.length === 0) {
        // Read-only comparison. Do not reactivate archived lists or start their sessions.
        try {
          const adminResponse = await authAxios.get(`/clients/${clientId}/task-lists`);
          if (!mounted.current || requestId !== taskRequest.current) return;
          const storedLists = adminResponse.data?.task_lists;
          if (!Array.isArray(storedLists)) throw new Error("Expected management task_lists array is missing.");
          const activeLists = storedLists.filter(list => list.is_active === true);
          log("management vs cleaning comparison", {
            clientId, scheduleId, managementClientId: adminResponse.data?.client_id,
            cleaningListCount: templates.length, managementListCount: storedLists.length,
            managementActiveListCount: activeLists.length,
            lists: storedLists.map(list => ({
              id: list.id, clientId: list.client_id, isActive: list.is_active,
              activeValueType: typeof list.is_active,
              itemCount: Array.isArray(list.items) ? list.items.length : null,
              activeItemCount: Array.isArray(list.items) ? list.items.filter(item => item.is_active === true).length : null,
            })),
          });
          if (!storedLists.length) {
            setListDiagnostic(`Neither task-list endpoint returned lists for client #${clientId}. Check the client ID and the endpoint used by the clients-page task component.`);
          } else if (!activeLists.length) {
            setListDiagnostic(`Client #${clientId} has ${storedLists.length} stored task list(s), but none has is_active=true. Restore the intended list in client task-list management, then Refresh here and select Start / join checklist.`);
          } else {
            setListDiagnostic(`The management endpoint returned ${activeLists.length} active list(s) for client #${clientId}, while the cleaning endpoint returned none. This is an API response mismatch; creating a session is not the first issue. See the management vs cleaning comparison log.`);
          }
        } catch (comparisonError) {
          if (!mounted.current || requestId !== taskRequest.current) return;
          log("management comparison failed",{clientId,status:comparisonError.response?.status,code:comparisonError.code,responseKeys:Object.keys(comparisonError.response?.data || {})});
          setListDiagnostic("The cleaning endpoint returned no active lists, and the management comparison could not load. Check its request in the Network tab.");
        }
      }
    } catch (error) {
      log("task loading failed",{requestId,status:error.response?.status,code:error.code,errorType:error.name});
      if (mounted.current && requestId === taskRequest.current) setTaskError(errorText(error,"Unable to refresh shared tasks."));
    } finally { if (mounted.current && requestId === taskRequest.current) setTasksLoading(false); }
  }, [clientId,scheduleId,authAxios,log]);
  useEffect(() => {
    if (clientId) loadTasks();
    else log("waiting for active shift client",{clientId});
    return () => { taskRequest.current++; };
  }, [loadTasks, clientId, refreshKey, log]);
  const matchingSessions = sessions.filter(session=>sameId(session.task_list_id,listId));
  const session = matchingSessions.find(item=>sameId(item.id,sessionId)) || matchingSessions[0] || null;
  const selectedList = lists.find(list=>sameId(list.id,listId));
  const options = [...lists];
  sessions.forEach(item => { if (!options.some(list=>sameId(list.id,item.task_list_id))) options.push({id:item.task_list_id,name:`Open checklist #${item.task_list_id}`}); });
  const taskRows = useMemo(()=>[...(session?.tasks || [])].sort((a,b)=>(a.display_order || 0)-(b.display_order || 0)),[session]);
  const completed = taskRows.filter(task=>task.is_completed).length;
  const percent = taskRows.length ? Math.round(completed/taskRows.length*100) : 0;
  const grouped = useMemo(()=>{
    const groups = new Map();
    taskRows.filter(task=>filter!=="remaining" || !task.is_completed).forEach(task=>{
      const room = task.room?.trim() || "General";
      if (!groups.has(room)) groups.set(room,[]);
      groups.get(room).push(task);
    });
    return [...groups.entries()];
  },[taskRows,filter]);
  const busy = starting || finalizing || busyTask !== null || checkingOut;
  useEffect(() => {
    const reason = loading ? "Active shift is loading"
      : !activeShift ? "No active shift"
      : !clientId ? "Active shift response has no client.id"
      : tasksLoading ? "Checklist requests are loading"
      : taskError ? "Checklist request failed (see request logs)"
      : !options.length ? "No active lists or matching open sessions returned"
      : !session ? "Template exists but no matching session: Start / join checklist is shown"
      : !taskRows.length ? "Selected cleaning session has no snapshot tasks"
      : !grouped.length ? "Remaining-only filter hides all completed tasks"
      : view !== "tasks" ? "Consultation tab is selected"
      : "Task checkboxes are displayed";
    log("display decision",{reason,clientId,scheduleId,shiftId,view,filter,selectedListId:listId,
      selectedSessionId:session?.id ?? null,sessionStatus:session?.status,
      availableListIds:options.map(item=>item.id),matchingSessionIds:matchingSessions.map(item=>item.id),
      templateItemCount:selectedList?.items?.length ?? null,sessionTaskCount:taskRows.length,
      completedTaskCount:completed,visibleRoomCount:grouped.length,
      checkboxesDisabled:busy || tasksLoading || loading || Boolean(shiftError) || session?.status!=="in_progress"});
  }, [log,loading,activeShift,clientId,scheduleId,shiftId,tasksLoading,taskError,lists,sessions,listId,sessionId,view,filter,taskRows,completed,grouped,busy,shiftError]);

  const startChecklist = async () => {
    if (actionLock.current || tasksLoading || !listId || !clientId) {
      log("start/join blocked",{locked:actionLock.current,tasksLoading,listId,clientId});return;
    }
    log("start/join requested",{clientId,scheduleId,listId,shiftId});
    actionLock.current = true; setStarting(true); setTaskError("");
    const currentShiftId = shiftId;
    taskRequest.current++;
    try {
      // Re-read before starting, so an already-started partner checklist is reused.
      const {data} = await authAxios.get(`/cleaning/clients/${clientId}/active-sessions`);
      const existing = (data.cleaning_sessions || []).find(item=>sameId(item.task_list_id,listId) && sameId(item.schedule_id,scheduleId));
      const result = existing || (await authAxios.post(`/cleaning/task-lists/${listId}/start`, scheduleId == null ? {} : {schedule_id:scheduleId})).data.cleaning_session;
      log("start/join result",{resumed:Boolean(existing),sessionId:result?.id,taskListId:result?.task_list_id,scheduleId:result?.schedule_id,taskCount:result?.tasks?.length,status:result?.status});
      if (!result?.id) throw new Error("The server did not return a cleaning session.");
      if (!mounted.current || !sameId(shiftRef.current?.shift?.id,currentShiftId)) return;
      setSessions(previous=>[result,...previous.filter(item=>!sameId(item.id,result.id))]);
      setSessionId(String(result.id)); setLastSynced(new Date());
      setStatus(existing ? "Joined the shared checklist." : "Checklist ready. Progress is shared with your cleaning partner.");
    } catch (error) { log("start/join failed",{status:error.response?.status,code:error.code,responseKeys:Object.keys(error.response?.data || {})}); if (mounted.current) setTaskError(errorText(error,"Unable to start the checklist.")); }
    finally { actionLock.current = false; if (mounted.current) setStarting(false); }
  };
  const toggleTask = async task => {
    if (actionLock.current || tasksLoading || !session || session.status !== "in_progress") return;
    actionLock.current = true; setBusyTask(task.id); setTaskError("");
    const currentSessionId = session.id;
    const currentShiftId = shiftId;
    taskRequest.current++;
    try {
      // Do not send admin.id as staff_id: those are different database tables.
      const {data} = await authAxios.patch(`/cleaning/tasks/${task.id}`, {is_completed:!task.is_completed});
      if (!data.task) throw new Error("The server did not return the saved task.");
      if (!mounted.current || !sameId(shiftRef.current?.shift?.id,currentShiftId)) return;
      setSessions(previous=>previous.map(item=>sameId(item.id,currentSessionId) ? {...item,...data.cleaning_session,tasks:item.tasks.map(row=>sameId(row.id,task.id) ? data.task : row)} : item));
      setStatus(data.task.is_completed ? "Task completed and saved." : "Task marked incomplete.");
      // A full read also picks up partner changes made since the last refresh.
      try {
        const fresh = (await authAxios.get(`/cleaning/sessions/${currentSessionId}`)).data.cleaning_session;
        if (mounted.current && sameId(shiftRef.current?.shift?.id,currentShiftId)) { setSessions(previous=>previous.map(item=>sameId(item.id,currentSessionId) ? fresh : item)); setLastSynced(new Date()); }
      } catch { if (mounted.current) setTaskError("Your change was saved, but partner updates could not be refreshed. Tap Refresh."); }
    } catch (error) {
      if (mounted.current) setTaskError(errorText(error,"Task could not be saved. Refresh and try again."));
      if (error.response?.status === 409) {
        try { const fresh=(await authAxios.get(`/cleaning/sessions/${currentSessionId}`)).data.cleaning_session; if(mounted.current)setSessions(previous=>previous.map(item=>sameId(item.id,currentSessionId)?fresh:item)); } catch { /* Keep the original save error visible. */ }
      }
    } finally { actionLock.current=false; if(mounted.current)setBusyTask(null); }
  };
  const completeChecklist = async () => {
    if (actionLock.current || tasksLoading || loading || shiftError || !session || session.status !== "in_progress") return;
    actionLock.current = true; setFinalizing(true); setTaskError(""); setStatus("");
    const currentSessionId = session.id;
    const currentShiftId = shiftId;
    taskRequest.current++;
    const isCurrent = () => mounted.current && sameId(shiftRef.current?.shift?.id,currentShiftId);
    const applySession = fresh => {
      if (!fresh || !sameId(fresh.id,currentSessionId) || !isCurrent()) return;
      setSessions(previous => previous.map(item => sameId(item.id,currentSessionId) ? fresh : item));
      setLastSynced(new Date());
    };
    try {
      // Admin IDs must never be passed as staff IDs. The server validates
      // required tasks against current shared progress before closing.
      const {data} = await authAxios.post(`/cleaning/sessions/${currentSessionId}/finalize`, {});
      const closed = data.cleaning_session;
      if (!closed || !sameId(closed.id,currentSessionId) || closed.status !== "completed") {
        throw new Error("The server did not confirm checklist completion.");
      }
      applySession(closed);
      if (isCurrent()) setStatus("Checklist completed and closed for the team. You are still checked in to your shift.");
    } catch (error) {
      // Recover a lost success response, or a partner finalizing first.
      let fresh;
      try {
        fresh = (await authAxios.get(`/cleaning/sessions/${currentSessionId}`)).data.cleaning_session;
        applySession(fresh);
      } catch { /* Preserve the completion error if refreshing also fails. */ }
      if (isCurrent()) {
        if (sameId(fresh?.id,currentSessionId) && fresh?.status === "completed") {
          setStatus("Checklist completed and closed for the team. You are still checked in to your shift.");
        } else {
          setTaskError(errorText(error,"Could not complete the checklist. Refresh and try again."));
        }
      }
    } finally {
      actionLock.current = false;
      if (mounted.current) setFinalizing(false);
    }
  };
  const refresh = async () => {
    if (actionLock.current || tasksLoading || uploading) return;
    setConsultationVersion(v=>v+1);
    await loadTasks();
  };
  const uploadPhoto = async file => {
    if (!file || uploadLock.current || actionLock.current) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please choose an image."); return; }
    uploadLock.current=true; setUploading(true); setUploadError("");
    const currentShiftId = shiftId;
    const body = new FormData(); body.append("file",file); body.append("upload_preset",UPLOAD_PRESET);
    try {
      const response=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,{method:"POST",body});
      if(!response.ok)throw new Error("Photo upload failed. Please try again.");
      const data=await response.json();
      if(!data.secure_url)throw new Error("The upload did not return an image URL.");
      if(mounted.current && sameId(shiftRef.current?.shift?.id,currentShiftId)){setPhotoUrl(data.secure_url);setStatus("Photo ready for checkout.");}
    }catch(error){if(mounted.current)setUploadError(error.message || "Unable to upload photo.");}
    finally{uploadLock.current=false;if(mounted.current)setUploading(false);if(fileRef.current)fileRef.current.value="";}
  };
  const checkOut = async () => {
    if(actionLock.current || uploadLock.current || loading || shiftError) return;
    actionLock.current=true;setCheckingOut(true);setStatus("Checking out…");
    try {
      await authAxios.post("/admin/shifts/check-out",{image_urls:photoUrl?[photoUrl]:[],message:message.trim()||null});
      if(!mounted.current)return;
      shiftRequest.current++;taskRequest.current++;shiftRef.current=null;
      setActiveShift(null);setSessions([]);setLists([]);setPhotoUrl("");setMessage("");setUploadError("");setStatus("Shift checked out successfully.");
      try { await onShiftUpdated?.(); } catch { setStatus("Checked out successfully. Refresh the dashboard to update its shift status."); }
    }catch(error){if(mounted.current)setStatus(errorText(error,"Unable to check out. Please try again."));}
    finally{actionLock.current=false;if(mounted.current)setCheckingOut(false);}
  };

  return <CleaningTheme className="asp-theme"><style>{styles}</style><section className="asp-panel" aria-label="Active admin cleaning shift">
    <header className="asp-header"><span className="asp-mark"><CleaningSparkle/></span><div><p className="asp-eyebrow">Admin cleaning workspace</p><h3>{activeShift ? "Your active shift" : "Shift status"}</h3></div>{activeShift && <span className="asp-live">Checked in</span>}</header>
    {shiftError && <div className="asp-error" role="alert">{shiftError}<button type="button" onClick={loadActiveShift}>Retry</button></div>}
    {loading && <p className="asp-empty" role="status">Loading shift status…</p>}
    {status && <p className="asp-feedback" role="status">{status}</p>}
    {!loading && !activeShift && !shiftError && <p className="asp-empty">You are not currently checked in to a client shift.</p>}
    {activeShift && <>
      <div className="asp-shift"><h4>{[activeShift.client?.first_name,activeShift.client?.last_name].filter(Boolean).join(" ") || "Client cleaning"}</h4><div><span>Scheduled <strong>{time12(activeShift.schedule?.start_time)} – {time12(activeShift.schedule?.end_time)}</strong></span><span>Checked in <strong>{dateTime(activeShift.shift?.check_in_at)}</strong></span></div></div>
      <div className="asp-tabbar"><div className="asp-tabs"><button type="button" aria-pressed={view==="tasks"} onClick={()=>setView("tasks")}>Cleaning tasks</button>{consultationAvailable && <button type="button" aria-pressed={view==="consultation"} onClick={()=>setView("consultation")}>Consultation</button>}</div><button type="button" className="asp-refresh" disabled={busy || tasksLoading || uploading || loading} onClick={refresh}>{tasksLoading ? "Refreshing…" : "↻ Refresh"}</button></div>
      {consultationError && <p className="asp-error" role="alert">{consultationError}</p>}
      {view==="consultation" && consultationAvailable && <div className="asp-consultation"><ConsultationChecklist key={`${clientId}-${consultationVersion}`} clientId={clientId}/></div>}
      {view==="tasks" && <div className="asp-tasks">
        <p className="asp-help">Check off your work as you go. Refresh to see your partner’s latest progress.</p>
        {taskError && <p className="asp-error" role="alert">{taskError}</p>}
        {listDiagnostic && <p className="asp-error" role="status">{listDiagnostic}</p>}
        {tasksLoading && !lists.length && !sessions.length && <p className="asp-empty" role="status">Loading shared checklists…</p>}
        {options.length > 0 && <label className="asp-select">Checklist<select value={listId} disabled={busy || tasksLoading} onChange={event=>{setListId(event.target.value);setSessionId("");setFilter("all");setTaskError("");}}>{options.map(list=><option key={list.id} value={list.id}>{list.name}</option>)}</select></label>}
        {matchingSessions.length>1 && <label className="asp-select">Open cleaning session<select value={session?.id || ""} disabled={busy || tasksLoading} onChange={event=>setSessionId(event.target.value)}>{matchingSessions.map(item=><option key={item.id} value={item.id}>#{item.id} · Started {dateTime(item.started_at)}</option>)}</select></label>}
        {!tasksLoading && !taskError && options.length===0 && <p className="asp-empty">No active task lists are available for this client yet.</p>}
        {!session && selectedList && <div className="asp-start"><h4>{selectedList.name}</h4>{selectedList.description && <p>{selectedList.description}</p>}<p>{(selectedList.items||[]).filter(item=>item.is_active).length} tasks ready for this cleaning.</p><button type="button" className="asp-primary" disabled={busy || tasksLoading || loading || Boolean(shiftError)} onClick={startChecklist}>{starting ? "Opening checklist…" : "Start / join checklist"}</button></div>}
        {session && <>
          <div className="asp-progress"><div><strong>{completed} of {taskRows.length} tasks complete</strong><span>{percent}%</span></div><progress max="100" value={percent} aria-label="Cleaning task completion"/><div className="asp-progress-meta"><small>{lastSynced ? `Refreshed ${lastSynced.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}` : "Shared cleaning checklist"}</small><button type="button" aria-pressed={filter==="remaining"} onClick={()=>setFilter(value=>value==="all"?"remaining":"all")}>{filter==="remaining" ? "Show all tasks" : "Only remaining"}</button></div></div>
          {session.status!=="in_progress" && <p className="asp-feedback">This checklist is {session.status}. Task changes are locked.</p>}
          {session.status!=="completed" && grouped.map(([room,tasks])=><section className="asp-room" key={room}><h4>{room}<span>{tasks.filter(task=>task.is_completed).length}/{tasks.length}</span></h4>{tasks.map(task=><label key={task.id} className={`asp-task ${task.is_completed?"is-done":""}`}><input type="checkbox" checked={Boolean(task.is_completed)} disabled={busy || tasksLoading || loading || Boolean(shiftError) || session.status!=="in_progress"} onChange={()=>toggleTask(task)}/><span className="asp-task-copy"><strong>{task.title}</strong>{task.description && <span>{task.description}</span>}<small>{busyTask===task.id ? "Saving…" : task.is_completed ? `Completed${cleanerName(task)?` by ${cleanerName(task)}`:""}${task.completed_at?` · ${dateTime(task.completed_at)}`:""}` : task.is_required ? "Required" : "Optional"}</small>{task.completion_notes && <span className="asp-task-note">{task.completion_notes}</span>}</span></label>)}</section>)}
          {session.status!=="completed" && !grouped.length && <p className="asp-empty">{taskRows.length ? "All tasks are complete. Beautiful work." : "This cleaning session has no tasks."}</p>}
          {session.status === "in_progress" && <div className="asp-complete">
            <p>Finished this cleaning? Complete closes this shared checklist for everyone. All required tasks must be checked off; optional tasks may remain.</p>
            <button type="button" className="asp-primary" disabled={busy || tasksLoading || loading || Boolean(shiftError)} onClick={completeChecklist}>{finalizing ? "Completing…" : "✓ Complete"}</button>
          </div>}
        </>}
      </div>}
      <details className="asp-wrapup"><summary>Photo & shift notes <span>Optional</span></summary><div className="asp-wrapup-body"><label className="asp-upload">{uploading?"Uploading photo…":photoUrl?"Replace shift photo":"Add a shift photo"}<input ref={fileRef} type="file" accept="image/*" capture="environment" disabled={uploading || busy || loading} onChange={event=>uploadPhoto(event.target.files?.[0])}/></label>{uploadError && <p className="asp-error" role="alert">{uploadError}</p>}{photoUrl && <div className="asp-photo"><img src={photoUrl} alt="Photo to attach to this shift"/><button type="button" disabled={uploading || checkingOut} onClick={()=>setPhotoUrl("")}>Remove photo</button></div>}<label className="asp-notes">Shift notes<textarea rows={3} value={message} disabled={checkingOut} onChange={event=>setMessage(event.target.value)} placeholder="Work completed, issues, or a note for the team…"/></label></div></details>
      <footer className="asp-checkout"><p>Your checklist is shared. Complete closes the checklist for the team. Check out ends only your shift; any unfinished checklist stays open for your partner.</p><button type="button" disabled={busy || uploading || tasksLoading || loading || Boolean(shiftError)} onClick={checkOut}>{checkingOut?"Checking out…":"Check out of shift"}</button></footer>
    </>}
  </section></CleaningTheme>;
}

const styles = `
.asp-complete{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:16px;padding:14px;border:1px solid #6ee7b744;border-radius:12px;background:#103331}.asp-complete p{flex:1 1 210px;font-size:11px;line-height:1.7;color:#b8ddd6}.asp-complete .asp-primary{flex:1 0 120px;margin:0}

.cleaning-theme.asp-theme{min-height:0;background:radial-gradient(ellipse at top right,#16485d66,transparent 60%),#061121;border-radius:18px;overflow:visible}.cleaning-theme .asp-theme .ct-page-atmosphere{display:none}.asp-panel{padding:21px;color:#dceefa;min-width:0}.asp-header{display:flex;align-items:center;gap:11px;margin-bottom:17px}.asp-mark{width:39px;height:39px;display:grid;place-items:center;background:#153e4c;border:1px solid #76e9dc44;border-radius:12px;flex-shrink:0}.asp-mark svg{width:22px;height:22px;color:#9ff2dd}.asp-eyebrow{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#89d8df;font-weight:700}.asp-header h3{font-size:21px;line-height:1.3;margin-top:4px;letter-spacing:-.03em;font-weight:700}.asp-live{margin-left:auto;white-space:nowrap;background:#123e36;border:1px solid #6ee7b744;color:#9df1cb;font-size:9px;padding:6px 9px;border-radius:99px}.asp-live:before{content:"";display:inline-block;height:5px;width:5px;background:#7ae8b5;border-radius:50%;margin-right:5px}.asp-shift{background:#11253a;border:1px solid #7dd3fc2b;border-radius:14px;padding:15px;margin-bottom:17px}.asp-shift h4{font-size:18px;line-height:1.4;font-weight:650;margin:0 0 11px;overflow-wrap:anywhere}.asp-shift>div{display:flex;flex-wrap:wrap;gap:11px 30px}.asp-shift>div>span{display:flex;flex-direction:column;gap:4px;font-size:9px;color:#90b5ca}.asp-shift strong{font-size:12px;color:#d1e8f3;font-weight:550}.asp-tabbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;justify-content:space-between;margin-bottom:13px}.asp-tabs{display:flex;gap:4px;background:#0b1b2e;border:1px solid #7dd3fc33;padding:4px;border-radius:11px}.asp-tabs button{min-height:40px;padding:8px 13px;border:0;border-radius:7px;background:transparent;color:#a9c6d8;font-size:12px!important;font-weight:600!important}.asp-tabs button[aria-pressed=true]{background:linear-gradient(110deg,#8cdef3,#8bf0d6);color:#103744}.asp-refresh{min-height:43px;border:1px solid #7dd3fc44;background:#123047;border-radius:10px;padding:9px 13px;color:#c6f2ef;font-size:11px!important;font-weight:650!important}.asp-help{font-size:11px;color:#9abacd;line-height:1.7;margin-bottom:14px!important}.asp-select{display:flex;flex-direction:column;gap:6px;font-size:10px;font-weight:650;color:#a9cedd;margin:12px 0}.asp-select select{width:100%;min-height:45px;padding:9px 12px;border-radius:10px;border:1px solid #7dd3fc44;background:#10263c;color:#dcf3fc;font-size:13px}.asp-start{padding:19px;border:1px dashed #7dd3fc44;border-radius:13px;background:#0c2135}.asp-start h4{font-size:16px;font-weight:650;margin:0 0 8px}.asp-start p{font-size:12px;color:#a2c0d1;line-height:1.7;margin:8px 0}.asp-primary{min-height:44px;border:0;border-radius:10px;padding:10px 17px;background:linear-gradient(110deg,#8bdff3,#83efd4);color:#0d3343;font-size:12px!important;font-weight:700!important;margin-top:7px}.asp-progress{border:1px solid #7dd3fc26;background:#0d2337;padding:13px 15px;border-radius:13px;margin:14px 0}.asp-progress>div:first-child{display:flex;justify-content:space-between;gap:10px;font-size:12px}.asp-progress strong{font-weight:650}.asp-progress>div>span{color:#96eedb}.asp-progress progress{appearance:none;display:block;border:0;width:100%;height:6px;margin:12px 0;border-radius:99px;overflow:hidden;background:#224159;color:#7ce6d5}.asp-progress progress::-webkit-progress-bar{background:#224159}.asp-progress progress::-webkit-progress-value{background:linear-gradient(90deg,#7dd3fc,#6ee7b7);border-radius:99px}.asp-progress progress::-moz-progress-bar{background:#7ce6d5}.asp-progress-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}.asp-progress-meta small{font-size:10px;color:#8fb3c6}.asp-progress-meta button{border:1px solid #7dd3fc33;padding:6px 9px;min-height:34px;border-radius:7px;background:#15354a;color:#b6eee8;font-size:10px!important}.asp-room{margin-top:18px}.asp-room h4{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px;font-weight:700;margin:0 2px 9px;color:#d4edf7}.asp-room h4>span{font-size:10px;color:#86b2c7;font-weight:500}.asp-task{display:flex;align-items:flex-start;gap:12px;padding:14px;margin:7px 0;border:1px solid #7dd3fc29;border-radius:12px;background:#102339;cursor:pointer;transition:background .18s,border-color .18s}.asp-task:hover{background:#153149;border-color:#8bdded55}.asp-task.is-done{background:#0e302f;border-color:#6ee7b72b}.asp-task input{accent-color:#65dcb9;width:21px;height:21px;min-width:21px;margin:1px 0 0;cursor:pointer}.asp-task-copy{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1;overflow-wrap:anywhere}.asp-task-copy strong{font-size:13px;line-height:1.5;font-weight:650}.asp-task-copy>span{font-size:11px;line-height:1.7;color:#a6c3d4;white-space:pre-wrap}.asp-task-copy small{font-size:9px;line-height:1.6;color:#90b6c6}.asp-task.is-done strong{color:#bcf2dc}.asp-task.is-done small{color:#87cbb8}.asp-task-note{font-style:italic}.asp-wrapup{margin-top:21px;border:1px solid #7dd3fc2b;background:#0c1e31;border-radius:13px}.asp-wrapup summary{cursor:pointer;padding:15px;font-size:12px;font-weight:650;min-height:47px}.asp-wrapup summary>span{float:right;font-size:10px;color:#7fa5bc;font-weight:500}.asp-wrapup-body{padding:0 15px 15px;display:flex;flex-direction:column;gap:14px}.asp-upload{display:flex;flex-direction:column;gap:12px;border:1px dashed #7dd3fc55;border-radius:11px;padding:13px;font-size:12px;color:#bdeaf1}.asp-upload input{font-size:11px;max-width:100%;color:#a6c6d9}.asp-upload input::file-selector-button{min-height:40px;background:#21465b;border:1px solid #7dd3fc44;color:#d3f2f9;border-radius:8px;padding:8px 12px;margin-right:8px;cursor:pointer}.asp-photo{display:flex;align-items:center;gap:12px}.asp-photo img{width:105px;height:105px;object-fit:cover;border-radius:12px;border:1px solid #7dd3fc44}.asp-photo button{min-height:40px;padding:9px 12px;border:1px solid #7dd3fc33;border-radius:8px;background:#173249;color:#c9e9f0;font-size:11px!important}.asp-notes{display:flex;flex-direction:column;gap:8px;font-size:11px;font-weight:600;color:#b9d8e7}.asp-notes textarea{resize:vertical;width:100%;min-height:90px;background:#071729;border:1px solid #7dd3fc3b;color:#daeff8;border-radius:10px;padding:12px;font-size:13px;line-height:1.6}.asp-notes textarea::placeholder{color:#789caf}.asp-checkout{display:flex;align-items:center;justify-content:space-between;gap:17px;padding-top:19px;margin-top:18px;border-top:1px solid #7dd3fc25}.asp-checkout p{font-size:10px;color:#91b1c5;line-height:1.8;max-width:360px}.asp-checkout button{min-height:46px;flex-shrink:0;background:#742d42;border:1px solid #efa7b577;border-radius:11px;color:#ffe8ed;font-size:12px!important;font-weight:650!important;padding:11px 18px}.asp-checkout button:hover{background:#923951}.asp-panel button:disabled,.asp-panel select:disabled{opacity:.5;cursor:wait}.asp-task input:disabled{cursor:wait}.asp-empty{font-size:12px;line-height:1.7;padding:20px 14px;background:#0d2235;border:1px dashed #7dd3fc33;border-radius:12px;color:#a4c6d8;text-align:center}.asp-error{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;line-height:1.7;background:#462039;color:#ffcfdf;border:1px solid #f6a0bb44;border-radius:10px;padding:11px;margin:10px 0!important}.asp-error button{background:#752f4b;color:#ffe6ee;padding:8px 13px;border:1px solid #ee9cbb55;border-radius:8px;min-height:40px}.asp-feedback{font-size:11px;line-height:1.7;background:#123438;color:#b9f2df;border:1px solid #6ee7b72b;border-radius:10px;padding:10px 12px;margin:12px 0!important}.asp-consultation{background:#f6fafc;color:#193b4b;padding:12px;border-radius:13px;margin-top:12px}
@media(max-width:640px){.asp-panel{padding:13px}.asp-header{gap:8px}.asp-header h3{font-size:19px}.asp-eyebrow{font-size:8px;letter-spacing:.08em}.asp-mark{width:34px;height:34px;border-radius:10px}.asp-live{font-size:8px;padding:5px 7px}.asp-shift{padding:12px}.asp-shift h4{font-size:16px}.asp-shift>div{gap:10px 18px}.asp-shift strong{font-size:11px}.asp-tabbar{gap:7px}.asp-tabs{flex:1}.asp-tabs button{flex:1;font-size:11px!important;padding:8px;min-height:42px}.asp-refresh{font-size:10px!important;padding:9px;min-height:44px}.asp-select select,.asp-notes textarea{font-size:16px}.asp-task{padding:12px 10px;gap:10px}.asp-task-copy strong{font-size:13px}.asp-task-copy>span{font-size:11px}.asp-progress{padding:12px}.asp-progress-meta button{min-height:40px}.asp-checkout{flex-direction:column;align-items:stretch;gap:11px}.asp-checkout p{max-width:none}.asp-checkout button{width:100%}.asp-wrapup-body{padding:0 11px 13px}.asp-help{font-size:10px}}
`;
