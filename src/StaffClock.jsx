import { useCallback, useEffect, useRef, useState } from "react";
import { useStaff } from "./StaffContext";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

export default function StaffClock({ onRequestInventory }) {
  const { authAxios } = useStaff();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [clockedIn, setClockedIn] = useState(false);
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState("");
  const [statusKnown, setStatusKnown] = useState(false);
  const [showInventoryPrompt, setShowInventoryPrompt] = useState(false);
  const [lastDuration, setLastDuration] = useState("");
  const [now, setNow] = useState(() => new Date());
  const lock = useRef(false);
  const mounted = useRef(false);
  const request = useRef(0);
  const dialog = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    if (!clockedIn) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [clockedIn]);

  const loadStatus = useCallback(async () => {
    const id = ++request.current;
    setLoading(true); setError("");
    try {
      const { data } = await authAxios.get("/staff/me/clock-status");
      if (!mounted.current || id !== request.current) return;
      setClockedIn(Boolean(data.clocked_in));
      setEntry(data.clocked_in ? data.entry : null);
      setNow(new Date()); setStatusKnown(true);
    } catch {
      if (mounted.current && id === request.current) {
        setError("Failed to load clock status. Tap Refresh to try again.");
        setStatusKnown(false);
      }
    } finally {
      if (mounted.current && id === request.current) setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    mounted.current = true; loadStatus();
    return () => { mounted.current = false; request.current++; };
  }, [loadStatus]);

  useEffect(() => {
    if (!showInventoryPrompt) return;
    const previous = document.activeElement;
    closeButton.current?.focus();
    const keydown = event => {
      if (event.key === "Escape") setShowInventoryPrompt(false);
      if (event.key !== "Tab") return;
      const buttons = dialog.current?.querySelectorAll("button:not(:disabled)");
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); if (previous?.isConnected) previous.focus(); };
  }, [showInventoryPrompt]);

  const changeClock = async action => {
    if (lock.current || loading || !statusKnown) return;
    if ((action === "in" && clockedIn) || (action === "out" && !clockedIn)) return;
    lock.current = true; setBusy(action); setError("");
    try {
      const { data } = await authAxios.post(`/staff/clock-${action}`);
      if (!mounted.current) return;
      if (action === "in") {
        setClockedIn(true); setEntry(data.entry); setNow(new Date());
      } else {
        const seconds = Number(data.duration_seconds);
        setLastDuration(Number.isFinite(seconds) && seconds >= 0
          ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
          : "Duration unavailable");
        setClockedIn(false); setEntry(null); setShowInventoryPrompt(true);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err.response?.data?.error || `Failed to clock ${action}. Refresh status before trying again.`);
        // Recheck before retrying when the request outcome is unknown.
        if (!err.response) setStatusKnown(false);
      }
    } finally {
      lock.current = false; if (mounted.current) setBusy("");
    }
  };

  const started = entry?.clock_in_at ? new Date(entry.clock_in_at) : null;
  const validStart = started && !Number.isNaN(started.getTime());
  const seconds = clockedIn && validStart ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  const timer = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60].map(v => String(v).padStart(2, "0")).join(":");
  const disabled = loading || Boolean(busy) || !statusKnown;

  return <CleaningTheme className="sc-theme"><style>{styles}</style>
    <section className="sc-panel" aria-label="Staff time clock" aria-busy={loading || Boolean(busy)}>
      <header className="sc-header"><span className="sc-mark" aria-hidden="true"><CleaningSparkle /></span><div><p className="sc-kicker">Your workday</p><h2>Staff time clock</h2></div><button type="button" className="sc-refresh" onClick={loadStatus} disabled={loading || Boolean(busy)}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
      <p className="sc-intro">Track your work time, from the first clean to the final sparkle.</p>
      {error && <p className="sc-error" role="alert">{error}</p>}
      <div className={`sc-clock ${clockedIn ? "is-active" : ""}`}>
        <span className="sc-status" role="status"><i aria-hidden="true" />{loading ? "Checking clock status…" : !statusKnown ? "Status unavailable" : clockedIn ? "You’re clocked in" : "Ready when you are"}</span>
        <div className="sc-timer" aria-label="Elapsed work time">{statusKnown && clockedIn && !validStart ? "—" : timer}</div>
        <p className="sc-session">{clockedIn ? `${(seconds / 3600).toFixed(2)} hours · Current session` : "Hours : Minutes : Seconds"}</p>
        <div className="sc-started">{clockedIn && validStart ? <>Clocked in <strong>{started.toLocaleString()}</strong></> : "Clock in when your workday begins."}</div>
      </div>
      <div className="sc-actions"><button type="button" className="sc-in" disabled={disabled || clockedIn} onClick={() => changeClock("in")}>{busy === "in" ? "Clocking in…" : "Clock In"}</button><button type="button" className="sc-out" disabled={disabled || !clockedIn} onClick={() => changeClock("out")}>{busy === "out" ? "Clocking out…" : "Clock Out"}</button></div>
      {busy && <p className="sc-feedback" role="status">Saving your clock {busy}…</p>}
      {!clockedIn && lastDuration && <p className="sc-feedback">Last session: <strong>{lastDuration}</strong></p>}
    </section>
    {showInventoryPrompt && <div className="sc-overlay"><div ref={dialog} className="sc-dialog" role="dialog" aria-modal="true" aria-labelledby="sc-dialog-title" aria-describedby="sc-dialog-description"><span className="sc-dialog-mark" aria-hidden="true">✓</span><p className="sc-kicker">All wrapped up</p><h3 id="sc-dialog-title">You’re clocked out</h3><div className="sc-duration">{lastDuration}<span>Session time</span></div><p id="sc-dialog-description">Report inventory used during this shift?</p><div className="sc-actions"><button ref={closeButton} type="button" className="sc-later" onClick={() => setShowInventoryPrompt(false)}>Not now</button><button type="button" className="sc-in" onClick={() => { setShowInventoryPrompt(false); if (typeof onRequestInventory === "function") onRequestInventory(); }}>Yes, report usage</button></div></div></div>}
  </CleaningTheme>;
}

const styles = `
.cleaning-theme.sc-theme{min-height:0;max-width:620px;margin-inline:auto;border-radius:20px;background:radial-gradient(ellipse at top right,#1e617747,transparent 65%),#071321;overflow:visible}.cleaning-theme .sc-theme .ct-page-atmosphere{display:none}.sc-panel{position:relative;padding:22px;border:1px solid #7dd3fc33;border-radius:20px;color:#def1fa;min-width:0}.sc-header{display:flex;align-items:center;gap:11px}.sc-mark{display:grid;place-items:center;width:39px;height:39px;flex-shrink:0;border:1px solid #80ebd944;background:#173e4b;border-radius:12px;color:#a1efdb}.sc-mark svg{width:22px;height:22px}.sc-kicker{font-size:9px!important;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#99dbda!important;margin:0 0 4px!important}.sc-header h2{font-size:21px;font-weight:700;letter-spacing:-.03em;line-height:1.3;margin:0}.sc-refresh{margin-left:auto;flex-shrink:0;min-height:44px;padding:9px 11px;border:1px solid #80d1e640;border-radius:10px;background:#173449;color:#c0edf0;font-size:11px;font-weight:650;cursor:pointer}.sc-intro{font-size:12px;color:#9abed0;line-height:1.8;margin:14px 0!important}.sc-clock{padding:24px 15px 18px;background:linear-gradient(140deg,#122c42,#0b1b2e);border:1px solid #7dd3fc30;border-radius:16px;text-align:center}.sc-clock.is-active{border-color:#7be1c54a;background:radial-gradient(ellipse at top,#225c534a,transparent 70%),#0c2134}.sc-status{display:inline-flex;align-items:center;gap:7px;border:1px solid #83c5d936;background:#17384b;color:#b4dce8;border-radius:99px;padding:7px 11px;font-size:11px;font-weight:650}.sc-status i{width:6px;height:6px;border-radius:50%;background:#9cc6d3}.is-active .sc-status{color:#b7f0d5;border-color:#82e1bd44;background:#183e35}.is-active .sc-status i{background:#9af2c6;box-shadow:0 0 10px #86e9bb55}.sc-timer{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-variant-numeric:tabular-nums;font-size:clamp(30px,8vw,53px);font-weight:700;letter-spacing:-.045em;line-height:1.2;margin:23px 0 7px;color:#d3fbf0}.sc-session{font-size:11px;line-height:1.7;color:#9dbdce;margin:0!important}.sc-started{display:flex;flex-direction:column;gap:4px;margin-top:20px;padding-top:15px;border-top:1px solid #7dd3fc24;color:#89acbf;font-size:10px;line-height:1.7}.sc-started strong{font-size:12px;font-weight:550;color:#c8e4ee}.sc-actions{display:flex;gap:10px;margin-top:15px}.sc-actions button{flex:1;min-width:0;min-height:47px;padding:12px 10px;border-radius:11px;font-size:12px;font-weight:700;cursor:pointer;line-height:1.5}.sc-in{background:linear-gradient(110deg,#9fdcf3,#8fe7ce);border:1px solid #abeadf;color:#0b3241}.sc-out{background:#542a3d;border:1px solid #f0a8bd55;color:#ffd8e4}.sc-later{background:#19364b;border:1px solid #7dd3fc40;color:#cae7f2}.sc-theme button:disabled{opacity:.45;cursor:not-allowed}.sc-theme button:hover:not(:disabled){filter:brightness(1.08)}.sc-theme button:focus-visible{outline:3px solid #a1f1dc;outline-offset:3px}.sc-error{padding:11px 13px;border:1px solid #efa2bf44;background:#44243a;color:#ffd3e3;border-radius:11px;font-size:12px;line-height:1.7;margin:12px 0!important}.sc-feedback{font-size:11px;text-align:center;color:#a4c8d6;line-height:1.7;margin:12px 0 0!important}.sc-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:#020a17cc;backdrop-filter:blur(7px);overflow-y:auto}.sc-dialog{width:100%;max-width:390px;max-height:calc(100dvh - 32px);overflow:auto;border:1px solid #88e0d84d;border-radius:21px;padding:25px 20px;background:radial-gradient(ellipse at top,#20504c66,transparent 65%),#0a1d30;color:#e2f3fa;text-align:center;box-shadow:0 24px 70px #0008}.sc-dialog-mark{display:grid;place-items:center;margin:0 auto 14px;width:47px;height:47px;border:1px solid #99edc95c;border-radius:15px;background:#204c40;color:#b8f6d7;font-size:24px}.sc-dialog h3{font-size:22px;font-weight:700;letter-spacing:-.03em;margin:5px 0 18px}.sc-duration{font-size:29px;font-weight:700;color:#c0f5df;line-height:1.3}.sc-duration span{display:block;font-size:10px;font-weight:500;color:#99bdcc;margin-top:4px}.sc-dialog>p:not(.sc-kicker){font-size:12px;color:#b0cbd9;line-height:1.7;margin:20px 0 6px}
@media(max-width:640px){.sc-panel{padding:13px;border-radius:16px}.sc-header{gap:8px;flex-wrap:wrap}.sc-header h2{font-size:18px}.sc-kicker{font-size:8px!important}.sc-mark{width:33px;height:33px}.sc-refresh{font-size:10px;padding:8px}.sc-intro{font-size:11px}.sc-clock{padding:20px 12px 15px}.sc-dialog{padding:22px 15px}}
`;
