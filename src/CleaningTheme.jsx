import React, { useEffect, useState } from "react";

export function CleaningSparkle({ className = "", style }) {
  return <svg aria-hidden="true" className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C13 7 17 11 24 12c-7 1-11 5-12 12C11 17 7 13 0 12 7 11 11 7 12 0Z" /></svg>;
}

export function CleaningAtmosphere({ className = "" }) {
  return <div className={`ct-atmosphere ${className}`} aria-hidden="true">
    {Array.from({ length: 16 }, (_, i) => <i key={i} className="ct-bubble" style={{ left: `${(i * 37 + 3) % 100}%`, width: 12 + i % 5 * 9, height: 12 + i % 5 * 9, animationDelay: `${-i * 2.7}s`, animationDuration: `${18 + i % 7}s` }} />)}
    {Array.from({ length: 10 }, (_, i) => <CleaningSparkle key={i} className="ct-star" style={{ left: `${(i * 29 + 7) % 96}%`, top: `${(i * 19 + 9) % 95}%`, animationDelay: `${-i * .7}s` }} />)}
  </div>;
}

function CleaningWoman() {
  return <svg className="ct-woman" viewBox="0 0 160 210" fill="none" aria-hidden="true">
    <ellipse cx="82" cy="196" rx="63" ry="6" fill="#000000" opacity="0.24" />
    <g className="ct-step ct-step-back"><path d="M70 131 64 161 49 189" stroke="#25495b" strokeWidth="13" strokeLinecap="round"/><path d="M48 188h-9q-8 9 2 10h18v-9" fill="#143544"/></g>
    <g className="ct-step"><path d="M82 131 86 162 93 191" stroke="#356375" strokeWidth="13" strokeLinecap="round"/><path d="M90 187v11h24q2-7-13-10" fill="#143544"/></g>
    <g className="ct-body"><path d="M61 36q-18-2-19 17t-16 23q30 7 32-30" fill="#523331"/><path d="M56 32q4-24 25-19 22 3 19 31l-11 15-33-11Z" fill="#523331"/>
    <path d="M70 51v17h17V49" fill="#c98e70"/><ellipse cx="79" cy="37" rx="17" ry="21" fill="#e8b18e"/><path d="M59 31q17 3 22-13 3 15 17 17-1-27-21-23-18 2-18 19" fill="#523331"/><circle cx="88" cy="36" r="1.5" fill="#243c45"/><path d="m87 46 5-1" stroke="#9b534c" strokeWidth="2" strokeLinecap="round"/>
    <path d="M61 63q15-8 31 1l9 64q-23 11-47-1Z" fill="#198d91"/><path d="m67 64-4 19-8 44q23 10 43 0L86 82l-1-18" fill="#e1faf3"/><path d="M67 98h20v17H67z" fill="#a6ded2"/><path d="m90 69 15 27 15 2" stroke="#e8b18e" strokeWidth="10" strokeLinecap="round"/><path d="m61 72 19 25 29 10" stroke="#e8b18e" strokeWidth="10" strokeLinecap="round"/><path d="m61 69 9 12m22-11 5 10" stroke="#198d91" strokeWidth="14" strokeLinecap="round"/></g>
    <g className="ct-mop"><path d="m115 80 20 108" stroke="#567f8b" strokeWidth="5" strokeLinecap="round"/><path d="m114 78 3 14" stroke="#20a7a6" strokeWidth="7" strokeLinecap="round"/><path d="M120 186h29l7 11h-44Z" fill="#58bfb9"/><path d="m120 190-4 9m10-9-2 10m9-10v11m6-11 2 10m5-10 5 9" stroke="#b9ebe3" strokeWidth="3" strokeLinecap="round"/></g>
  </svg>;
}

export function CleaningLoader({ onSkip, duration = 4000 }) {
  return <div className="ct-loader" style={{ "--ct-intro-duration": `${duration}ms` }}>
    <CleaningAtmosphere />
    <div className="ct-loader-copy" role="status" aria-live="polite"><span className="ct-eyebrow">A little polish. A fresh beginning.</span><h1>A Breath of <em>Fresh Air</em><small>Cleaning Services</small></h1><p>Making everything sparkle for you…</p></div>
    <div className="ct-runway" aria-hidden="true">
      {Array.from({ length: 20 }, (_, i) => <CleaningSparkle key={i} className="ct-trail" style={{ left: `calc(125px + (100% - 150px) * ${i / 20})`, bottom: `${12 + i % 3 * 10}px`, animationDelay: `${duration * i / 20}ms` }} />)}
      <div className="ct-walker"><CleaningWoman />{Array.from({ length: 7 }, (_, i) => <i key={i} className="ct-soap" style={{ animationDelay: `${i * .19}s`, left: `${73 + i % 3 * 5}%`, width: 8 + i % 3 * 5, height: 8 + i % 3 * 5 }} />)}</div>
    </div>
    <div className="ct-loader-meter" aria-hidden="true"><span/></div>
    {onSkip && <button type="button" className="ct-skip" onClick={onSkip}>Skip intro <span aria-hidden="true">→</span></button>}
  </div>;
}

// Wrap other pages with <CleaningTheme> to share the palette and atmosphere.
// Set showLoader to replay the introduction on mount. loading can extend it.
export default function CleaningTheme({ children, showLoader = false, loading = false, minimumShowTime = 4000, className = "" }) {
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const duration = Math.max(4000, Number(minimumShowTime) || 4000);
  useEffect(() => {
    if (!showLoader) return;
    setMinimumElapsed(false);
    setSkipped(false);
    const timer = window.setTimeout(() => setMinimumElapsed(true), duration);
    return () => window.clearTimeout(timer);
  }, [showLoader, duration]);
  const busy = showLoader && ((!minimumElapsed && !skipped) || loading);
  useEffect(() => {
    if (!busy) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [busy]);
  return <div className={`cleaning-theme ${className}`}><style>{cleaningStyles}</style>
    {busy && <CleaningLoader duration={duration} onSkip={() => setSkipped(true)} />}
    <div hidden={busy}><CleaningAtmosphere className="ct-page-atmosphere" /><div className="ct-content">{children}</div></div>
  </div>;
}

const cleaningStyles = `
/* Viewport-sized so bubbles remain visible even on long pages. */
.cleaning-theme .ct-page-atmosphere{position:fixed;inset:0;z-index:2;pointer-events:none}
.cleaning-theme .ct-page-atmosphere .ct-bubble{border-color:#9aeaff66;background:radial-gradient(circle at 28% 24%,#ffffffc9 0 5%,#ffffff20 12%,#67e8f908 45%,#7dd3fc24 85%,#b3fff54d 100%);box-shadow:inset 2px 2px 6px #d8ffff3b,inset -3px -3px 8px #67e8f926,0 0 14px #38bdf812;animation-name:ct-page-rise}
.cleaning-theme .ct-page-atmosphere .ct-star{width:12px;height:12px;color:#b4f6ff;opacity:.35}
@keyframes ct-page-rise{0%{transform:translate3d(0,0,0) scale(.8);opacity:0}12%{opacity:.5}50%{transform:translate3d(26px,-55vh,0) scale(1)}85%{opacity:.4}100%{transform:translate3d(-18px,calc(-100vh - 100px),0) scale(1.1);opacity:0}}

.cleaning-theme{--ct-ink:#edfaff;--ct-muted:#adc4d7;--ct-teal:#67e8f9;--ct-mint:#6ee7b7;--ct-line:#74cde52b;position:relative;isolation:isolate;background:radial-gradient(ellipse at 80% 5%,#123563 0,transparent 40%),#030812;color:var(--ct-ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif;min-height:100vh;overflow-x:clip}.cleaning-theme *{box-sizing:border-box}.cleaning-theme [hidden]{display:none!important}.cleaning-theme a{color:inherit;text-decoration:none}.cleaning-theme button{font:inherit;cursor:pointer}.cleaning-theme :is(a,button):focus-visible{outline:3px solid #67e8f9;outline-offset:5px}.cleaning-theme h1,.cleaning-theme h2,.cleaning-theme h3,.cleaning-theme p{margin:0}.cleaning-theme h1,.cleaning-theme h2{font-family:Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.045em}.cleaning-theme em{font-weight:400;color:var(--ct-teal)}.ct-content{position:relative;z-index:1}.ct-atmosphere{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0}.ct-bubble,.ct-soap{position:absolute;border-radius:50%;border:1px solid #77c9c88c;background:radial-gradient(circle at 28% 24%,#ffffffed 0 8%,#ffffff30 19%,#9bdfdd0d 57%,#84ccc957 92%);box-shadow:inset -2px -3px 7px #83c7c72b,inset 2px 2px 4px #fff9}.ct-bubble{bottom:-65px;animation:ct-rise 20s linear infinite}.ct-star{position:absolute;width:16px;height:16px;color:#9cefff;animation:ct-twinkle 4s ease-in-out infinite}.ct-shell{width:min(1160px,calc(100% - 48px));margin:auto}.ct-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:10px;font-weight:750;letter-spacing:.19em;text-transform:uppercase;color:var(--ct-teal);line-height:1.8}.ct-btn{display:inline-flex;align-items:center;justify-content:center;gap:24px;min-height:49px;padding:13px 23px;border-radius:99px;background:linear-gradient(110deg,#7dd3fc,#67e8f9,#6ee7b7);color:#031322!important;font-size:13px;font-weight:650;border:1px solid transparent;transition:transform .2s,box-shadow .2s;box-shadow:0 7px 20px #087e8218}.ct-btn:hover{transform:translateY(-2px);box-shadow:0 10px 25px #087e8233}.ct-btn-secondary{background:#10243fbb;border-color:#7dd3fc55;color:var(--ct-ink)!important;box-shadow:none}.ct-section{padding:78px 0}.ct-section h2{font-size:clamp(32px,4vw,49px);line-height:1.1}.ct-section p{color:var(--ct-muted);line-height:1.8}.ct-section-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:30px}.ct-section-heading .ct-eyebrow{margin-bottom:12px}.ct-card{border:1px solid var(--ct-line);background:linear-gradient(145deg,#112441ed,#070f20ed);border-radius:24px;box-shadow:0 12px 38px #174e5010}.ct-loader{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:safe center;overflow:auto;padding:90px 0 28px;background:radial-gradient(ellipse at 50% 65%,#143c63 0,transparent 65%),#020712}.ct-loader-copy{position:relative;text-align:center;padding:20px;z-index:1}.ct-loader h1{font-size:clamp(36px,6vw,65px);line-height:1.12;margin:20px 0}.ct-loader h1 em{display:block}.ct-loader h1 small{display:block;font:600 12px/2 system-ui;letter-spacing:.23em;text-transform:uppercase;margin-top:18px}.ct-loader p{font-size:13px;color:var(--ct-muted)}.ct-runway{position:relative;width:min(760px,90%);height:245px;flex-shrink:0;overflow:hidden}.ct-walker{position:absolute;bottom:29px;width:150px;height:197px;left:0;animation:ct-walk var(--ct-intro-duration,4s) linear both}.ct-woman{width:100%;height:100%;overflow:visible}.ct-step{transform-origin:76px 135px;animation:ct-step .7s ease-in-out infinite alternate}.ct-step-back{animation-delay:-.7s}.ct-body{animation:ct-body .35s ease-in-out infinite alternate}.ct-mop{transform-origin:118px 99px;animation:ct-mop .7s ease-in-out infinite alternate}.ct-soap{bottom:10px;opacity:0;animation:ct-soap 1.1s ease-out infinite}.ct-trail{position:absolute;width:20px;height:20px;color:#b2fff0;opacity:0;animation:ct-trail 1s ease-in-out forwards}.ct-loader-meter{width:130px;height:3px;background:#284258;border-radius:10px;margin-top:26px;overflow:hidden}.ct-loader-meter span{display:block;height:100%;background:#67e8f9;transform-origin:left;animation:ct-wipe var(--ct-intro-duration,4s) linear both}
@keyframes ct-rise{0%{transform:translate(0,0);opacity:0}10%,85%{opacity:.65}100%{transform:translate(40px,-110vh);opacity:0}}@keyframes ct-twinkle{0%,100%{opacity:.1;transform:scale(.55) rotate(0)}50%{opacity:.7;transform:scale(1) rotate(45deg)}}@keyframes ct-walk{to{left:calc(100% - 150px)}}@keyframes ct-wipe{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes ct-step{from{transform:rotate(-13deg)}to{transform:rotate(13deg)}}@keyframes ct-body{to{transform:translateY(2px)}}@keyframes ct-mop{to{transform:rotate(-5deg)}}@keyframes ct-soap{10%{opacity:.85}100%{opacity:0;transform:translate(-25px,-120px) scale(1.3)}}@keyframes ct-trail{0%{opacity:0;transform:scale(.2)}40%{opacity:1;transform:scale(1.2) rotate(40deg)}100%{opacity:.65;transform:scale(.75) rotate(90deg)}}
.ct-skip{position:relative;z-index:2;flex-shrink:0;display:inline-flex;align-items:center;gap:18px;margin-top:22px;padding:11px 22px;min-height:44px;border:1px solid #7dd3fc66;border-radius:99px;background:#102944;color:#e0f8ff;font-size:12px!important}.ct-skip:hover{background:#1c4261}.ct-loader-copy{flex-shrink:0}.ct-loader h1{color:#f0faff;text-shadow:0 0 35px #7dd3fc22}
@media(max-height:650px){.ct-loader{justify-content:flex-start;padding-top:75px}.ct-loader h1{font-size:32px;margin:8px 0}.ct-loader-copy{padding:10px 18px}.ct-loader h1 small{margin-top:8px}.ct-runway{height:205px}.ct-loader-meter{margin-top:12px}.ct-skip{margin-top:12px}}
@media(max-width:640px){.ct-shell{width:calc(100% - 32px)}.ct-section{padding:48px 0}.ct-section-heading{align-items:start;flex-direction:column}.ct-loader .ct-eyebrow{font-size:9px}.ct-runway{height:220px}.ct-loader h1{margin:12px 0}}
@media(prefers-reduced-motion:reduce){.cleaning-theme *,.cleaning-theme *::before,.cleaning-theme *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.ct-bubble,.ct-soap{display:none}.ct-star{opacity:.25}.ct-walker{left:calc(50% - 75px)}.ct-trail{opacity:.55}}
`;
