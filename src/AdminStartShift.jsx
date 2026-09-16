import React, { useEffect, useRef, useState } from "react";
import { useAdmin } from "./AdminContext";
import CleaningTheme from "./CleaningTheme";

const sameId = (a, b) => String(a ?? "") === String(b ?? "");
const messageFor = (error, fallback) => error?.response?.data?.error || error?.message || fallback;

export default function AdminStartShift({ schedule, onStarted }) {
  // A different schedule must not inherit another shift's success/retry state.
  return <StartShiftFlow key={`${schedule?.client?.id}-${schedule?.id}`} schedule={schedule} onStarted={onStarted}/>;
}

function StartShiftFlow({ schedule, onStarted }) {
  const { authAxios } = useAdmin();
  const [phase, setPhase] = useState("idle");
  const [checkedIn, setCheckedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [distanceError, setDistanceError] = useState("");
  const [locationHelp, setLocationHelp] = useState(false);
  const [failedLists, setFailedLists] = useState([]);
  const [summary, setSummary] = useState("");
  const [progress, setProgress] = useState("");
  const [callbackError, setCallbackError] = useState("");
  const lock = useRef(false);
  const mounted = useRef(false);
  const callbackDone = useRef(false);
  const clientId = schedule?.client?.id;
  const scheduleId = schedule?.id;
  const busy = phase !== "idle";

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const isThisShift = data => Boolean(data?.active) &&
    sameId(data.client?.id ?? data.shift?.client_id, clientId) &&
    sameId(data.schedule?.id ?? data.shift?.schedule_id, scheduleId);

  const getPosition = () => new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this device.")); return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
    });
  });

  const notifyParent = async () => {
    if (callbackDone.current || !mounted.current) return;
    setCallbackError("");
    try {
      await onStarted?.();
      callbackDone.current = true;
    } catch {
      if (mounted.current) setCallbackError("Your shift is checked in. The dashboard could not refresh; try Open active shift below.");
    }
  };

  const start = async () => {
    if (lock.current || ready) return;
    if (!clientId || !scheduleId) { setError("A client and schedule are required to start this shift."); return; }
    lock.current = true;
    setPhase("checking"); setError(""); setDistanceError(""); setLocationHelp(false);
    setFailedLists([]); setCallbackError(""); setProgress("");
    try {
      // Confirm server state on every attempt, including retries/remounts.
      const current = (await authAxios.get("/admin/shifts/active")).data;
      if (!mounted.current) return;
      if (current.active && !isThisShift(current)) {
        setCheckedIn(false);
        setError("You are already checked in to another shift. Check out of that shift before starting this one.");
        return;
      }
      if (!current.active) {
        setCheckedIn(false);
        setPhase("location");
        let position;
        try { position = await getPosition(); }
        catch (geoError) {
          if (!mounted.current) return;
          setLocationHelp(Boolean(geoError.code));
          setError(geoError.code === 1
            ? "Location access is blocked. Allow location access in your browser settings, then try again."
            : geoError.code === 3
              ? "Location took too long. Please try again."
              : geoError.code === 2
                ? "Your location is unavailable. Check your device's location settings and try again."
                : messageFor(geoError, "Unable to get your location. Please try again."));
          return;
        }
        if (!mounted.current) return;
        setPhase("checkin");
        try {
          await authAxios.post("/admin/shifts/check-in", {
            client_id: clientId, schedule_id: scheduleId,
            lat: position.coords.latitude, lng: position.coords.longitude,
          });
        } catch (checkInError) {
          if (!mounted.current) return;
          const data = checkInError.response?.data;
          if (data?.distance_miles != null) {
            setDistanceError(`You are ${data.distance_miles} miles away. You must be within 1 mile to start this shift.`);
            return;
          }
          // A lost response can occur after the server has committed check-in.
          // Verify before reporting failure or ever offering another check-in.
          let recovered = false;
          try { recovered = isThisShift((await authAxios.get("/admin/shifts/active")).data); }
          catch { /* The next attempt will recheck active state before any POST. */ }
          if (!recovered) { if(mounted.current)setError(messageFor(checkInError,"Unable to confirm check-in. Please try again.")); return; }
        }
      }
      if (!mounted.current) return;
      setCheckedIn(true); setPhase("checklists");
      // Checklist work begins only after check-in succeeds or is confirmed active.
      let templates, sessions;
      try {
        const [listResponse, sessionResponse] = await Promise.all([
          authAxios.get(`/cleaning/clients/${clientId}/task-lists`),
          authAxios.get(`/cleaning/clients/${clientId}/active-sessions`),
        ]);
        templates = listResponse.data.task_lists;
        sessions = sessionResponse.data.cleaning_sessions;
        if (!Array.isArray(templates) || !Array.isArray(sessions)) throw new Error("The server returned an invalid checklist response.");
      } catch (listError) {
        if(mounted.current)setError(`You are checked in, but checklist setup could not finish. ${messageFor(listError,"Please retry checklist setup.")}`);
        return;
      }
      const failures = [];
      const activeLists = templates.filter(list=>list.is_active !== false);
      let resumed = 0;
      let created = 0;
      for (let index=0; index<activeLists.length; index++) {
        if (!mounted.current) return;
        const list = activeLists[index];
        setProgress(`Preparing checklist ${index+1} of ${activeLists.length}…`);
        const existing = sessions.find(session => sameId(session.task_list_id,list.id) && sameId(session.schedule_id,scheduleId) && session.status === "in_progress");
        if (existing) { resumed++; continue; }
        try {
          // Backend resumes an existing open session for this list/schedule.
          // Never send an admin ID in staff_id (a different table).
          const result = await authAxios.post(`/cleaning/task-lists/${list.id}/start`, {schedule_id:scheduleId});
          const session = result.data.cleaning_session;
          if (!session?.id) throw new Error("The server did not return a cleaning session.");
          sessions.push(session);
          created++;
        } catch (startError) {
          failures.push({id:list.id,name:list.name || `Checklist ${list.id}`,message:messageFor(startError,"Unable to prepare checklist.")});
        }
      }
      if (!mounted.current) return;
      setProgress(""); setFailedLists(failures);
      if (failures.length) {
        setError("You are checked in. Some checklists still need setup. Retry to resume the finished ones and prepare the rest.");
        return;
      }
      setReady(true);
      setSummary(activeLists.length
        ? `Checked in. ${resumed+created} shared ${activeLists.length===1?"checklist is":"checklists are"} ready.`
        : "Checked in. This client has no active task lists yet.");
      await notifyParent();
    } catch (unexpectedError) {
      if (mounted.current) setError(messageFor(unexpectedError,"Unable to confirm shift status. Please try again."));
    } finally {
      lock.current = false;
      if (mounted.current) setPhase("idle");
    }
  };

  const continueToShift = async () => {
    if (lock.current) return;
    lock.current=true;setPhase("opening");
    try { await notifyParent(); }
    finally {lock.current=false;if(mounted.current)setPhase("idle");}
  };
  const label = phase === "checking" ? "Checking shift status…"
    : phase === "location" ? "Checking your location…"
    : phase === "checkin" ? "Checking in…"
    : phase === "checklists" ? progress || "Preparing shared checklists…"
    : phase === "opening" ? "Opening shift…"
    : checkedIn ? "Retry checklist setup"
    : locationHelp ? "Get my location & start shift" : "Start shift & checklist";

  return <CleaningTheme className="ass-theme"><section className="ass-panel" aria-label="Start admin cleaning shift"><style>{styles}</style>
    <div className="ass-heading"><span aria-hidden="true">✦</span><div><p>Admin cleaning</p><h4>{ready ? "Ready to clean" : checkedIn ? "Finish checklist setup" : "Start this shift"}</h4></div></div>
    <p className="ass-description">{checkedIn ? "Your check-in is saved. Shared task lists let you and your partner track the same cleaning." : "Check in within 1 mile of the client. We’ll automatically start or resume their active cleaning checklists."}</p>
    {summary && <p className="ass-success" role="status">{summary}</p>}
    {error && <p className="ass-error" role="alert">{error}</p>}
    {distanceError && <p className="ass-distance" role="alert">{distanceError}</p>}
    {failedLists.length>0 && <ul className="ass-failures">{failedLists.map(list=><li key={list.id}><strong>{list.name}</strong><span>{list.message}</span></li>)}</ul>}
    {!ready && <button type="button" className="ass-primary" disabled={busy} onClick={start} aria-busy={busy}>{label}<span aria-hidden="true">{busy?"…":"→"}</span></button>}
    {busy && <p className="ass-sr-only" role="status">{label}</p>}
    {locationHelp && <p className="ass-hint">Allow location access when prompted. If access was previously blocked, enable it in your browser’s site settings.</p>}
    {callbackError && <p className="ass-error" role="alert">{callbackError}</p>}
    {((checkedIn && !ready && !busy) || callbackError) && <button type="button" className="ass-secondary" disabled={busy} onClick={continueToShift}>Open active shift</button>}
  </section></CleaningTheme>;
}

const styles = `
.cleaning-theme.ass-theme{min-height:0;border-radius:15px;background:transparent;overflow:visible}.cleaning-theme .ass-theme .ct-page-atmosphere{display:none}

.ass-panel{margin-top:16px;padding:17px;border:1px solid #3e8b9f55;border-radius:15px;background:linear-gradient(135deg,#103047,#08182c);color:#e0f3fb;font-family:inherit}.ass-heading{display:flex;align-items:center;gap:10px;margin-bottom:11px}.ass-heading>span{display:grid;place-items:center;width:35px;height:35px;background:#1c4858;border:1px solid #80e6db44;border-radius:11px;color:#a3f1dc;font-size:22px;flex-shrink:0}.ass-heading p{margin:0;font-size:9px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#8fd9e2}.ass-panel .ass-heading h4{font-size:17px;font-weight:700;letter-spacing:-.02em;margin:4px 0 0;color:#e8f7fc;line-height:1.3}.ass-description{font-size:12px;line-height:1.8;color:#abc8d9;margin:0 0 14px!important}.ass-primary{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:47px;padding:12px 15px;border:0;border-radius:10px;background:linear-gradient(110deg,#8ddcf6,#8beed4);color:#082e3c;font:700 12px/1.5 system-ui;cursor:pointer}.ass-primary:hover{filter:brightness(1.07)}.ass-panel button:disabled{opacity:.55;cursor:wait}.ass-panel button:focus-visible{outline:3px solid #a3f6e8;outline-offset:4px}.ass-secondary{min-height:43px;width:100%;margin-top:9px;padding:10px 14px;border:1px solid #7dd3fc55;border-radius:9px;background:#17374e;color:#c6eef5;font-size:12px;font-weight:650;cursor:pointer}.ass-error,.ass-distance,.ass-success{font-size:12px;line-height:1.7;padding:11px 12px;border-radius:10px;margin:12px 0!important;overflow-wrap:anywhere}.ass-error{background:#4c2439;border:1px solid #ef9db54d;color:#ffdeea}.ass-distance{background:#493826;border:1px solid #f0cc8744;color:#ffe0ab}.ass-success{background:#143b35;border:1px solid #86e3bb44;color:#b9f4d8}.ass-hint{font-size:10px;line-height:1.8;color:#91b5c9;margin:11px 0 0!important}.ass-failures{margin:12px 0;padding:0;list-style:none}.ass-failures li{display:flex;flex-direction:column;gap:4px;margin:6px 0;border:1px solid #eb9cad33;border-radius:9px;padding:10px;background:#251f32;font-size:11px;line-height:1.6}.ass-failures li span{color:#d2b4c4}.ass-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
@media(max-width:640px){.ass-panel{padding:13px}.ass-description{font-size:11px}.ass-panel .ass-heading h4{font-size:16px}.ass-primary{font-size:12px;min-height:48px}}
`;
