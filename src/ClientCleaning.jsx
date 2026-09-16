import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { format } from "date-fns";
import ClientViewConsults from "./ClientViewConsults";
import ClientRequestForm from "./ClientRequestForm";
import ClientShifts from "./ClientShifts";
import CreateReview from "./CreateReview";
import ClientCompletedChecklists from "./ClientCompletedChecklists";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

export default function ClientCleaning() {
  const [showIntro, setShowIntro] = useState(true);
  const portalHeading = useRef(null);
  useEffect(() => {
    // A little extra time lets guests see the smile after the neon comes on.
    const timer = window.setTimeout(() => setShowIntro(false), 3600);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!showIntro) portalHeading.current?.focus({ preventScroll: true });
  }, [showIntro]);
  const [lastName, setLastName] = useState("");
  const [last4, setLast4] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
const [showConsults, setShowConsults] = useState(false);
const [showReviewModal, setShowReviewModal] = useState(false);
const [assignments, setAssignments] = useState([]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null); setAssignments([]); setShowConsults(false); setShowReviewModal(false);

    try {
      const res = await axios.post("https://cleaningback.onrender.com/cleaning", {
  last_name: lastName,
  last4: last4,
});
setResult(res.data);

// Assignments are optional; a failure must not hide the client portal.
try {
  const assignmentRes = await axios.get(`https://cleaningback.onrender.com/public/clients/${res.data.client.id}/assignments`);
  setAssignments(assignmentRes.data.assignments || []);
} catch { setAssignments([]); }

    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return format(new Date(iso), "MMM d, yyyy • h:mm a");
  };

 if (showIntro) return <CleaningPortalIntro onSkip={() => setShowIntro(false)} />;

 return (
<CleaningTheme className="cp-theme"><style>{PORTAL_STYLES}</style><div className="cp-page">
  <div className="w-full max-w-5xl space-y-6">
    {/* HEADER */}
    <div className="cp-hero">
      <h1 ref={portalHeading} tabIndex={-1} className="cp-title">
        <CleaningSparkle /> Your cleaning portal
      </h1>

      <p className="mt-1 text-sm text-[#93b6c9] italic">
        Designed for transparency, care, and your peace of mind.
      </p>
    </div>


      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="cp-lookup bg-[#10283d] border border-[#7dd3fc33] rounded-2xl shadow-md p-6 space-y-6"
      >
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-[#bedae7] mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-[#7dd3fc44] rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#bedae7] mb-1">
              Last 4 Digits of Phone
            </label>
            <input
              type="text"
              value={last4}
              onChange={(e) =>
                setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-full border border-[#7dd3fc44] rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              required
              pattern="[0-9]{4}"
              inputMode="numeric"
              maxLength={4}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-br from-[#287e80] to-[#236c58] text-white py-3 rounded-xl font-bold text-lg hover:brightness-110 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "View Cleaning Info"}
        </button>

        {error && (
          <p className="text-[#fac2d5] font-semibold text-center">{error}</p>
        )}
      </form>

      {/* RESULTS */}
      {result && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#b9efd7]">
            Hello, {result.client.first_name}! 👋
          </h2>
{assignments.length > 0 && (
 <section>
  <h3 className="text-xl font-semibold mb-4">🧹 Assigned Cleaners</h3>

  {assignments.filter((a) => a.type === "staff").length > 0 ? (
    <ul className="space-y-4">
      {assignments
        .filter((a) => a.type === "staff")
        .map((a) => (
          <li
            key={a.assignment_id}
            className="bg-[#10283d] border border-[#7dd3fc33] rounded-xl shadow p-4 text-sm flex items-center gap-4"
          >
            {/* {a.profile?.photo_url && (
              <img
                src={a.profile.photo_url}
                alt={`${a.username}'s profile`}
                className="w-12 h-12 rounded-full object-cover border border-[#7dd3fc44]"
              />
            )} */}

            <div className="space-y-1">
             <div>
  <strong>Name:</strong>{" "}
  <span className="font-medium">
    {a.profile?.first_name && a.profile?.last_name
      ? `${a.profile.first_name} ${a.profile.last_name.charAt(0)}.`
      : a.username}
  </span>
</div>

              <div>
                <strong>Role:</strong> {a.role}
              </div>
           
            </div>
          </li>
        ))}
    </ul>
  ) : (
    <p className="text-[#a7c6d7] italic">No cleaners have been assigned yet.</p>
  )}
</section>

)}

          <ClientTaskHistory key={result.client.id} clientId={result.client.id} />

          {/* Consultation */}
          <section>
            <h3 className="text-xl font-semibold mb-4">🧠 Consultation History</h3>
            <button
              onClick={() => setShowConsults((prev) => !prev)}
              className="mb-4 px-4 py-2 rounded-xl font-semibold border bg-[#10283d] text-[#b1e8d2] hover:bg-emerald-50 transition"
            >
              {showConsults
                ? "Hide Consultation Reports"
                : "View Consultation Reports"}
            </button>
            {showConsults && (
              <ClientViewConsults consultations={result.consultations} />
            )}
          </section>

          {/* Schedule */}
          {(result.client.schedules || []).length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2">📅 Cleaning Schedule</h3>
              <div className="space-y-4">
                {(result.client.schedules || []).map((sched) => (
                  <div
                    key={sched.id}
                    className="bg-[#10283d] border border-[#7dd3fc33] rounded-xl shadow-sm p-4 text-sm"
                  >
                    <div>
                      <strong>Type:</strong>{" "}
                      {(sched.schedule_type || "").replace(/_/g, " ")}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`font-semibold ${
                          sched.status === "active"
                            ? "text-[#a5e5c4]"
                            : sched.status === "paused"
                            ? "text-[#eddaa9]"
                            : "text-[#93b6c9]"
                        }`}
                      >
                        {sched.status}
                      </span>
                    </div>
                    <div>
                      <strong>Start Date:</strong>{" "}
                      {new Date(`${sched.start_date}T00:00:00`).toLocaleDateString()}
                    </div>
                    {sched.day_of_week != null && (
                      <div>
                        <strong>Day of Week:</strong>{" "}
                        {
                          [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ][sched.day_of_week]
                        }
                      </div>
                    )}
                    <div>
                      <strong>Time:</strong>{" "}
                      {format(
                        new Date(`1970-01-01T${sched.start_time}`),
                        "h:mm a"
                      )}{" "}
                      –{" "}
                      {format(
                        new Date(`1970-01-01T${sched.end_time}`),
                        "h:mm a"
                      )}
                    </div>
                    {sched.description && (
                      <div className="mt-1 italic text-[#a7c6d7]">
                        {sched.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shifts */}
        {/* Shifts */}
<section>
  <h3 className="text-xl font-semibold mb-4">🧾 Recent Shifts</h3>
  <ClientShifts shifts={result.shifts} />
</section>

{/* Completed Checklists */}
<section>
  <h3 className="text-xl font-semibold mt-6 mb-4">✅ Completed Checklists</h3>
  <ClientCompletedChecklists checklists={result.completed_checklists} />
</section>


          {/* Requests */}
          <ClientRequestForm clientId={result.client.id} />

          {/* Review Box */}
          <div className="text-center bg-[#10283d] border border-[#7dd3fc33] rounded-2xl shadow-md p-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-[#dfedf7]">
              💬 Want to share your experience?
            </h3>
            <p className="text-[#a7c6d7] text-sm sm:text-base">
              We’d love to hear from you! Leave us a review and help others feel
              confident choosing our cleaning services. Your feedback might even
              be featured on our site! 🌟
            </p>

            <button
              onClick={() => setShowReviewModal(true)}
              className="mt-2 inline-block w-full sm:w-auto px-6 py-3 font-semibold rounded-full bg-gradient-to-br from-[#2b788f] to-[#296e66] text-white shadow-md hover:brightness-110 transition-all"
            >
              ⭐ Leave a Review
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div role="dialog" aria-modal="true" aria-label="Leave a review" className="cp-review relative bg-[#10283d] rounded-2xl shadow-2xl max-w-xl w-full">
            <button
              aria-label="Close review" onClick={() => setShowReviewModal(false)}
              className="absolute top-2 right-2 text-[#93b6c9] hover:text-[#dfedf7] text-xl font-bold"
            >
              ×
            </button>
            <CreateReview />
          </div>
        </div>
      )}
    </div>
  </div></CleaningTheme>
);

}


// Render outside CleaningTheme so transforms and clipping cannot hide the intro.
function CleaningPortalIntro({ onSkip }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="cp-intro" onKeyDown={event => { if (event.key === "Escape") onSkip(); }}>
      <style>{INTRO_STYLES}</style>
      <div className="cp-intro-inner">
        <p className="cp-intro-eyebrow">A little care. A little sparkle.</p>
        <div className="cp-intro-scene" aria-hidden="true">
          <div className="cp-neon-sign">
            <span className="cp-sign-small">WELCOME TO</span>
            <span className="cp-sign-name">A Breath of<br />Fresh Air</span>
            <span className="cp-sign-portal">Cleaning Portal</span>
            <span className="cp-sign-star cp-star-one">✧</span>
            <span className="cp-sign-star cp-star-two">✦</span>
          </div>
          <svg className="cp-cleaner" viewBox="0 0 260 350" fill="none">
            <ellipse cx="126" cy="326" rx="81" ry="10" fill="#000" opacity=".18" />
            {/* Legs, shoes, uniform and apron */}
            <path d="M102 240L96 310M146 240L155 310" stroke="#d99c7c" strokeWidth="21" strokeLinecap="round" />
            <path d="M98 308L80 317M155 308L170 317" stroke="#d8f4ed" strokeWidth="20" strokeLinecap="round" />
            <path d="M102 128Q126 117 149 133L166 255Q127 271 85 252Z" fill="#4ca8a6" />
            <path d="M112 132L104 166L97 242Q125 254 155 242L146 166L137 132" fill="#e6f8ee" />
            <path d="M111 194H142V216Q126 229 111 216Z" fill="#acdbce" />
            <path d="M101 146Q68 173 80 202L103 188" stroke="#e7ac8b" strokeWidth="17" strokeLinecap="round" />
            <path d="M100 136L85 162" stroke="#4ca8a6" strokeWidth="24" strokeLinecap="round" />
            {/* A shoulder-pivot sweep moves the feather duster over the sign. */}
            <g className="cp-dusting-arm">
              <path d="M148 144L180 116L187 78" stroke="#e7ac8b" strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M147 141L161 130" stroke="#4ca8a6" strokeWidth="24" strokeLinecap="round" />
              <path d="M187 82L203 36" stroke="#e7c995" strokeWidth="7" strokeLinecap="round" />
              <g fill="#c4b5ed" stroke="#ebe3ff" strokeWidth="2">
                <ellipse cx="211" cy="24" rx="14" ry="25" transform="rotate(24 211 24)" />
                <ellipse cx="199" cy="21" rx="9" ry="22" transform="rotate(-8 199 21)" />
                <ellipse cx="222" cy="30" rx="9" ry="22" transform="rotate(45 222 30)" />
              </g>
            </g>
            {/* The head turns from profile to a smiling face. */}
            <g className="cp-cleaner-head">
              <circle cx="96" cy="65" r="22" fill="#50362f" />
              <path d="M125 103V129" stroke="#e7ac8b" strokeWidth="20" />
              <ellipse cx="124" cy="79" rx="35" ry="41" fill="#50362f" />
              <ellipse cx="128" cy="87" rx="28" ry="33" fill="#efb997" />
              <path d="M97 83Q92 35 132 43Q156 42 160 72Q139 73 127 56Q114 80 97 83" fill="#50362f" />
              <path d="M100 53Q125 36 149 51" stroke="#a5dfcf" strokeWidth="7" strokeLinecap="round" />
              <g className="cp-face-profile">
                <circle cx="143" cy="85" r="3" fill="#49332d" />
                <path d="M153 90L161 96L151 98" fill="#efb997" />
                <path d="M140 104Q147 108 151 102" stroke="#9d4d4a" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <g className="cp-face-smile">
                <path d="M112 85Q116 81 120 85M136 85Q140 81 144 85" stroke="#49332d" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="111" cy="96" rx="6" ry="3" fill="#e68e87" />
                <ellipse cx="146" cy="96" rx="6" ry="3" fill="#e68e87" />
                <path d="M118 101Q129 119 140 101Z" fill="#a65254" />
                <path d="M121 103H137" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </g>
            </g>
          </svg>
          <span className="cp-dust cp-dust-one">✧</span><span className="cp-dust cp-dust-two">✦</span><span className="cp-dust cp-dust-three">✧</span>
        </div>
        <p className="cp-intro-caption" role="status">Freshening up your cleaning portal…</p>
        <div className="cp-intro-progress" aria-hidden="true"><span /></div>
        <button autoFocus type="button" className="cp-intro-skip" onClick={onSkip}>Skip intro <span aria-hidden="true">→</span></button>
      </div>
    </div>, document.body
  );
}

const INTRO_STYLES = `
.cp-intro,.cp-intro *{box-sizing:border-box}
.cp-intro{position:fixed;inset:0;z-index:2147483000;overflow-y:auto;background:radial-gradient(ellipse at 50% 38%,#194b55 0%,#0b2536 45%,#05131f 85%);color:#dff9ee;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:flex;padding:28px 18px;padding-top:max(28px,env(safe-area-inset-top));padding-bottom:max(28px,env(safe-area-inset-bottom))}
.cp-intro-inner{width:min(100%,660px);margin:auto;text-align:center}
.cp-intro-eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:10px;color:#b4d6d5;margin:0 0 18px}
.cp-intro-scene{position:relative;width:100%;aspect-ratio:660/390}
.cp-neon-sign{position:absolute;left:26%;top:8%;width:70%;height:65%;border:2px solid #4c706e;border-radius:24px;background:#0b202a;display:flex;flex-direction:column;justify-content:center;align-items:center;box-shadow:0 18px 50px #0005;color:#607b7d;animation:cp-sign-on .35s 2.5s forwards}
.cp-sign-small{font-size:clamp(7px,1.8vw,10px);letter-spacing:.28em;margin-bottom:10px}
.cp-sign-name{font-family:Georgia,serif;font-size:clamp(26px,6.5vw,48px);font-weight:600;line-height:1.04;letter-spacing:-.04em}
.cp-sign-portal{font-size:clamp(10px,2.8vw,18px);letter-spacing:.1em;margin-top:14px}
.cp-sign-star{position:absolute;font-size:26px;opacity:0;animation:cp-sparkle-in .5s 2.5s forwards}.cp-star-one{right:7%;top:8%}.cp-star-two{left:7%;bottom:8%;font-size:18px}
.cp-cleaner{position:absolute;left:0;bottom:0;height:91%;width:41%;overflow:visible}
.cp-dusting-arm{transform-origin:148px 144px;animation:cp-dust-sweep .62s ease-in-out 4 alternate}
.cp-cleaner-head{transform-origin:126px 115px;animation:cp-head-turn .45s 2.5s forwards}
.cp-face-profile{animation:cp-profile-out .2s 2.5s forwards}.cp-face-smile{opacity:0;animation:cp-sparkle-in .25s 2.65s forwards}
.cp-dust{position:absolute;color:#d5ffee;font-size:22px;pointer-events:none;opacity:0;animation:cp-dust-float .8s ease-out 3}.cp-dust-one{left:34%;top:14%}.cp-dust-two{left:42%;top:20%;animation-delay:.2s}.cp-dust-three{left:31%;top:32%;animation-delay:.4s}
.cp-intro-caption{font-size:13px;color:#bbdcd9;margin:12px 0 18px}.cp-intro-progress{height:3px;width:120px;background:#badfd31c;border-radius:10px;margin:0 auto;overflow:hidden}.cp-intro-progress span{display:block;width:100%;height:100%;background:#a7efd5;transform-origin:left;animation:cp-intro-fill 3.6s linear forwards}
.cp-intro-skip{appearance:none;display:inline-flex;align-items:center;justify-content:center;gap:20px;margin-top:25px;min-height:44px;padding:10px 20px;border:1px solid #97c8c65c;border-radius:999px;background:#163742;color:#dff9ee;font:600 12px system-ui;cursor:pointer}.cp-intro-skip:hover{background:#23515a}.cp-intro-skip:focus-visible{outline:2px solid #bdfce2;outline-offset:5px}
@keyframes cp-dust-sweep{from{transform:rotate(-17deg)}to{transform:rotate(16deg)}}
@keyframes cp-sign-on{to{color:#d6fff0;border-color:#afffe2;box-shadow:0 0 12px #99ffd566,inset 0 0 22px #99ffd51f,0 0 65px #75ffd329;text-shadow:0 0 8px #a2ffdca6,0 0 24px #7bffcd6b}}
@keyframes cp-head-turn{50%{transform:scaleX(.82) rotate(-4deg)}to{transform:scaleX(1) rotate(-5deg)}}
@keyframes cp-profile-out{to{opacity:0}}@keyframes cp-sparkle-in{to{opacity:1}}
@keyframes cp-dust-float{15%{opacity:.8}to{opacity:0;transform:translate(15px,-25px) rotate(35deg)}}
@keyframes cp-intro-fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media(max-width:420px){.cp-intro{padding-left:12px;padding-right:12px}.cp-neon-sign{border-radius:16px}.cp-sign-small{margin-bottom:7px}.cp-sign-portal{margin-top:9px}.cp-intro-eyebrow{letter-spacing:.14em;font-size:9px}.cp-sign-star{font-size:16px}}
@media(prefers-reduced-motion:reduce){.cp-dusting-arm,.cp-cleaner-head,.cp-dust,.cp-intro-progress span{animation:none}.cp-intro-progress span{transform:none}.cp-neon-sign,.cp-face-profile,.cp-face-smile,.cp-sign-star{animation-duration:.01s}}
`;

const API = "https://cleaningback.onrender.com";
function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString([], {month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"});
}
function TaskRows({ items, history = false }) {
  const groups = new Map();
  [...items].sort((a,b) => (a.display_order || 0) - (b.display_order || 0)).forEach(item => {
    const room = item.room?.trim() || "General";
    if (!groups.has(room)) groups.set(room, []);
    groups.get(room).push(item);
  });
  if (!items.length) return <p className="cp-muted">No tasks recorded.</p>;
  return <div className="cp-rooms">{[...groups].map(([room, tasks]) => <section key={room}><h5>{room}</h5>{tasks.map(task => <div className="cp-task-row" key={task.id}><span className={history && task.is_completed ? "cp-done" : "cp-dot"} aria-hidden="true">{history ? task.is_completed ? "✓" : "○" : "✦"}</span><div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<small>{history ? task.is_completed ? "Completed" : "Not completed" : task.is_required ? "Required" : "Optional"}{history && task.completed_at ? ` · ${displayDate(task.completed_at)}` : ""}</small>{history && task.completion_notes && <p className="cp-task-note">{task.completion_notes}</p>}</div></div>)}</section>)}</div>;
}
function ClientTaskHistory({ clientId }) {
  const [tab, setTab] = useState("history");
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setErrors({});
      const responses = await Promise.allSettled([
        axios.get(`${API}/cleaning/clients/${clientId}/task-lists`),
        axios.get(`${API}/cleaning/clients/${clientId}/history`),
      ]);
      if (cancelled) return;
      const nextErrors = {};
      responses.forEach((response,index) => {
        const key = index === 0 ? "templates" : "history";
        const rows = response.status === "fulfilled" ? response.value.data?.[index === 0 ? "task_lists" : "cleaning_sessions"] : null;
        if (!Array.isArray(rows)) {
          nextErrors[key] = `Unable to load ${key === "templates" ? "task templates" : "cleaning history"}. Tap Refresh to try again.`;
          if (index === 0) setTemplates([]); else setSessions([]);
        } else if (index === 0) setTemplates(rows);
        else setSessions(rows);
      });
      setErrors(nextErrors); setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [clientId, refreshKey]);
  const visible = sessions.filter(session => filter === "all" || session.status === filter);
  return <section className="cp-task-library" aria-label="Your cleaning task lists">
    <header className="cp-library-header"><div><p className="cp-eyebrow">The details that make a difference</p><h3>Your cleaning checklists</h3><p>See what’s planned and what was completed at each visit.</p></div><button type="button" onClick={() => setRefreshKey(key => key + 1)} disabled={loading}>{loading ? "Refreshing…" : "↻ Refresh"}</button></header>
    <div className="cp-tabs"><button type="button" aria-pressed={tab === "history"} onClick={() => setTab("history")}>Cleaning history</button><button type="button" aria-pressed={tab === "templates"} onClick={() => setTab("templates")}>Task templates</button></div>
    {loading ? <p className="cp-muted" role="status">Loading your checklists…</p> : errors[tab] ? <p className="cp-error" role="alert">{errors[tab]}</p> : tab === "templates" ? <>
      <p className="cp-muted">Your current active cleaning plans. Past visits retain the tasks recorded at the time.</p>
      {!templates.length && <p className="cp-empty">No active task templates yet.</p>}
      {templates.map(list => <details className="cp-checklist" key={list.id}><summary><span>{list.name || `Task list #${list.id}`}</span><small>{(list.items || []).filter(item => item.is_active !== false).length} tasks</small></summary><div className="cp-checklist-body">{list.description && <p className="cp-muted">{list.description}</p>}<TaskRows items={(list.items || []).filter(item => item.is_active !== false)} /></div></details>)}
    </> : <>
      <label className="cp-filter">Show visits<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All visits</option><option value="completed">Completed</option><option value="in_progress">In progress</option><option value="cancelled">Cancelled</option></select></label>
      {!visible.length && <p className="cp-empty">{sessions.length ? "No visits match this filter." : "Your cleaning task history will appear here after a checklist is started."}</p>}
      {visible.map(session => {
        const tasks = session.tasks || [];
        const complete = tasks.filter(task => task.is_completed).length;
        const list = templates.find(template => String(template.id) === String(session.task_list_id));
        return <details className="cp-checklist" key={session.id}><summary><span>{displayDate(session.started_at)}<small>{list?.name || `Checklist #${session.task_list_id}`} · Visit #{session.id}</small></span><span className={`cp-state cp-state-${session.status}`}>{(session.status || "Unknown").replace(/_/g," ")}</span></summary><div className="cp-checklist-body"><p className="cp-progress">{complete} of {tasks.length} tasks completed</p><progress max={Math.max(1,tasks.length)} value={complete} aria-label="Tasks completed" />{session.finalized_at && <p className="cp-muted">Completed {displayDate(session.finalized_at)}</p>}{session.notes && <p className="cp-muted">{session.notes}</p>}<TaskRows items={tasks} history /></div></details>;
      })}
    </>}
  </section>;
}

const PORTAL_STYLES = `
.cleaning-theme.cp-theme{display:block;overflow:visible;height:auto;padding-top:0;background:radial-gradient(ellipse at top right,#1b647344,transparent 60%),#061321;color:#daedf7;min-height:100vh}.cp-page{max-width:1100px;margin:auto;padding:calc(var(--cp-header-clearance, 140px) + env(safe-area-inset-top, 0px)) 22px 40px}.cp-hero{text-align:center;padding:25px 18px;border:1px solid #89dce33b;border-radius:20px;background:linear-gradient(120deg,#163e4e,#0d2238)}.cp-title{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;font-size:clamp(25px,4vw,40px);line-height:1.25;letter-spacing:-.04em;font-weight:750;color:#d5f8ec}.cp-title svg{width:32px;height:32px;color:#a1edcf}.cp-hero>p{font-size:12px;margin-top:12px!important;color:#a6cad8}.cp-page button{min-height:44px}.cp-page input{background:#0b2135;color:#e2f3fb;min-height:46px;font-size:14px}.cp-page button:focus-visible,.cp-page input:focus-visible,.cp-page select:focus-visible,.cp-page summary:focus-visible{outline:3px solid #a2ead3;outline-offset:3px}.cp-lookup{padding:19px!important}.cp-page h3{font-size:19px;font-weight:700;letter-spacing:-.02em}.cp-task-library{padding:18px;background:#0e283c;border:1px solid #8adce23b;border-radius:17px}.cp-library-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:15px}.cp-library-header h3{margin:4px 0}.cp-library-header p:not(.cp-eyebrow){font-size:11px;line-height:1.7;color:#a3c2d3;margin:5px 0}.cp-eyebrow{font-size:9px;letter-spacing:.08em;font-weight:700;text-transform:uppercase;color:#92d8d0;margin:0}.cp-library-header button{background:#21485b;color:#c4eeec;border:1px solid #85d4df44;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:650}.cp-library-header button:disabled{opacity:.5}.cp-tabs{display:flex;gap:5px;border:1px solid #7dd3fc29;border-radius:11px;background:#091e32;padding:4px;margin-bottom:14px}.cp-tabs button{flex:1;min-height:44px;background:transparent;border:0;border-radius:8px;color:#a5c7d7;font-size:12px;font-weight:650}.cp-tabs button[aria-pressed=true]{background:linear-gradient(110deg,#a3ddeb,#96e2c9);color:#133746}.cp-muted{font-size:11px;color:#a2c3d3;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:9px 0}.cp-empty{padding:19px;border:1px dashed #7dd3fc33;border-radius:11px;font-size:12px;color:#a9c7d6;text-align:center;line-height:1.7}.cp-filter{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11px;color:#aac8d8;margin-bottom:13px}.cp-filter select{background:#123249;border:1px solid #7dd3fc40;color:#d8edf7;padding:9px 12px;border-radius:9px;min-height:44px}.cp-checklist{border:1px solid #7dd3fc2c;background:#0a2034;border-radius:12px;margin-top:10px;overflow:hidden}.cp-checklist summary{cursor:pointer;padding:14px;font-size:12px;font-weight:650;line-height:1.7;overflow-wrap:anywhere}.cp-checklist summary>span:first-child{display:inline-block;max-width:100%}.cp-checklist summary small{display:block;font-size:10px;font-weight:400;color:#91b8cb}.cp-checklist summary>small{display:inline;margin-left:10px}.cp-state{display:inline-block;border-radius:99px;padding:4px 8px;margin:5px 0 0 10px;background:#234259;color:#bfe4f0;font-size:9px;text-transform:capitalize}.cp-state-completed{background:#224c3b;color:#bcecd1}.cp-state-cancelled{background:#492a3d;color:#f7c2d6}.cp-checklist-body{border-top:1px solid #7dd3fc26;padding:14px}.cp-progress{font-size:12px;color:#b5eed5;font-weight:650;margin:0 0 8px}.cp-checklist progress{width:100%;height:6px;accent-color:#90e4c1}.cp-rooms h5{font-size:11px;font-weight:700;letter-spacing:.04em;color:#afd8e5;margin:16px 0 8px}.cp-task-row{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-top:1px solid #7dd3fc1c}.cp-task-row>div{min-width:0;flex:1}.cp-task-row strong{font-size:12px;line-height:1.6;overflow-wrap:anywhere;font-weight:650}.cp-task-row p{font-size:11px;line-height:1.8;color:#a1bfce;margin:4px 0;white-space:pre-wrap;overflow-wrap:anywhere}.cp-task-row small{display:block;font-size:9px;line-height:1.7;color:#91b6c8;margin-top:4px}.cp-done{color:#a0edc9}.cp-dot{color:#91c4d6}.cp-task-note{font-style:italic}.cp-error{font-size:12px;color:#ffd0df;border:1px solid #eca5be44;border-radius:10px;padding:12px;background:#43283c}.cp-review{max-height:90dvh;overflow-y:auto;padding:35px 12px 12px}.cp-review>button{z-index:1;min-width:44px;background:#15384b;border-radius:10px;color:#d5f1f7}
@media(max-width:640px){.cp-page{padding:calc(var(--cp-header-clearance, 120px) + env(safe-area-inset-top, 0px)) 12px 25px}.cp-hero{padding:20px 12px}.cp-title{font-size:26px}.cp-lookup{padding:14px!important}.cp-page input{font-size:16px}.cp-task-library{padding:12px}.cp-checklist summary{padding:11px}.cp-checklist-body{padding:11px}.cp-tabs button{font-size:11px}.cp-filter select{font-size:16px;max-width:100%}.cp-library-header button{width:100%}}
`;
