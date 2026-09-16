import React from "react";
import { format, parseISO, isValid, differenceInMinutes } from "date-fns";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

function getFullName(shift) {
  const profile = shift.staff?.profile || shift.admin?.profile;
  if (profile?.first_name || profile?.last_name) {
    return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
  }
  return shift.staff?.username || shift.admin?.username || "Unknown";
}

function readDate(value) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

function formatDateTime(value) {
  const date = readDate(value);
  return date ? format(date, "MMM d, yyyy • h:mm a") : "—";
}

function getDuration(start, end) {
  const from = readDate(start);
  const to = readDate(end);
  if (!from || !to || to < from) return "—";
  const minutes = differenceInMinutes(to, from);
  if (minutes < 1) return "Less than a minute";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours} hr${hours === 1 ? "" : "s"}` : "", remainder ? `${remainder} min` : ""].filter(Boolean).join(" ");
}

export default function ClientShifts({ shifts = [] }) {
  const rows = Array.isArray(shifts) ? shifts.filter(Boolean) : [];

  return (
    <CleaningTheme className="client-shifts-theme">
      <style>{SHIFT_STYLES}</style>
      {rows.length === 0 ? (
        <div className="cs-empty" role="status">
          <span className="cs-empty-icon" aria-hidden="true"><CleaningSparkle /></span>
          <strong>No cleaning visits yet</strong>
          <p>Your visit details, cleaner notes, and photos will appear here.</p>
        </div>
      ) : (
        <div className="cs-grid">
          {rows.map(shift => {
            const name = getFullName(shift);
            const role = shift.staff ? "Staff" : shift.admin ? "Admin" : "Cleaner";
            const working = Boolean(shift.check_in_at && !shift.check_out_at);
            const photos = Array.isArray(shift.image_urls)
              ? shift.image_urls.filter(url => typeof url === "string" && url.trim())
              : [];
            const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("");

            return (
              <article className="cs-card" key={shift.id} aria-label={`Cleaning visit by ${name}`}>
                <header className="cs-card-header">
                  <span className="cs-avatar" aria-hidden="true">{initials}</span>
                  <div className="cs-person">
                    <span className="cs-eyebrow">Your cleaning professional</span>
                    <h4>{name}</h4>
                  </div>
                  <span className={`cs-role ${role === "Admin" ? "cs-role-admin" : ""}`}>{role}</span>
                </header>

                <dl className="cs-times">
                  <div><dt>Check-in</dt><dd>{formatDateTime(shift.check_in_at)}</dd></div>
                  <div><dt>Check-out</dt><dd>{formatDateTime(shift.check_out_at)}</dd></div>
                  <div className="cs-duration"><dt>Duration</dt><dd>{working ? <span className="cs-working"><i aria-hidden="true" />Still working</span> : getDuration(shift.check_in_at, shift.check_out_at)}</dd></div>
                </dl>

                {shift.message && (
                  <div className="cs-note">
                    <span className="cs-eyebrow">A note from your cleaner</span>
                    <p>{shift.message}</p>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="cs-photo-section">
                    <div className="cs-photo-heading"><span className="cs-eyebrow">Visit photos</span><span>{photos.length} photo{photos.length === 1 ? "" : "s"}</span></div>
                    <div className="cs-photos">
                      {photos.map((url, i) => (
                        <a key={`${url}-${i}`} href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open photo ${i + 1} from ${name}'s visit in a new tab`}>
                          <img src={url} alt={`Cleaning visit photo ${i + 1}`} loading="lazy" decoding="async" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </CleaningTheme>
  );
}

const SHIFT_STYLES = `
/* Embedded component: no full-page height or header padding. */
.cleaning-theme.client-shifts-theme{display:block;width:100%;min-width:0;min-height:0;height:auto;margin:0;padding:0;background:transparent;color:#daedf7;isolation:isolate}
.client-shifts-theme .cs-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.client-shifts-theme .cs-card{min-width:0;padding:18px;border:1px solid #89dce330;border-radius:18px;background:linear-gradient(135deg,#133448,#0b2135);box-shadow:0 8px 24px #020c161a}
.client-shifts-theme .cs-card-header{display:flex;align-items:center;gap:10px;padding-bottom:15px;border-bottom:1px solid #8ed8e222}
.client-shifts-theme .cs-avatar{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:13px;background:linear-gradient(135deg,#b1e7db,#91cbdc);color:#143947;font-size:13px;font-weight:800;text-transform:uppercase}
.client-shifts-theme .cs-person{flex:1;min-width:0}
.client-shifts-theme .cs-eyebrow{display:block;font-size:9px;font-weight:700;line-height:1.6;letter-spacing:.07em;text-transform:uppercase;color:#9cc4d2}
.client-shifts-theme .cs-person h4{margin:3px 0 0;color:#e1f5f4;font-size:14px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.client-shifts-theme .cs-role{flex-shrink:0;padding:5px 9px;border-radius:999px;border:1px solid #8be1bb33;background:#224b40;color:#b9efd4;font-size:10px;font-weight:650}
.client-shifts-theme .cs-role-admin{background:#203f58;border-color:#83c9ed33;color:#b9e6fb}
.client-shifts-theme .cs-times{margin:14px 0 0;display:grid;gap:11px}
.client-shifts-theme .cs-times>div{display:grid;grid-template-columns:74px minmax(0,1fr);gap:10px;align-items:baseline}
.client-shifts-theme .cs-times dt{color:#9ebfce;font-size:11px;line-height:1.7}
.client-shifts-theme .cs-times dd{margin:0;color:#d5eaf3;font-size:12px;line-height:1.7;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.client-shifts-theme .cs-times .cs-duration{padding:10px 12px;border-radius:10px;background:#a4e4cd0b;border:1px solid #9ee8cc1c}
.client-shifts-theme .cs-duration dd{color:#b9f0d8;font-weight:650}
.client-shifts-theme .cs-working{display:inline-flex;align-items:center;gap:7px}
.client-shifts-theme .cs-working i{width:6px;height:6px;flex-shrink:0;border-radius:50%;background:#a0edc9;box-shadow:0 0 0 4px #a0edc912}
.client-shifts-theme .cs-note{margin-top:14px;padding:11px 13px;border:1px solid #e6cda326;border-left:3px solid #d8c496;border-radius:9px;background:#dac79a09}
.client-shifts-theme .cs-note .cs-eyebrow{color:#d9cda9}
.client-shifts-theme .cs-note p{margin:6px 0 0;font-size:12px;line-height:1.8;color:#cbdde5;white-space:pre-wrap;overflow-wrap:anywhere}
.client-shifts-theme .cs-photo-section{margin-top:16px}
.client-shifts-theme .cs-photo-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.client-shifts-theme .cs-photo-heading>span:last-child{font-size:10px;color:#98bacb}
.client-shifts-theme .cs-photos{display:flex;flex-wrap:wrap;gap:8px}
.client-shifts-theme .cs-photos a{display:block;width:76px;height:76px;overflow:hidden;border:1px solid #98d9dd42;border-radius:11px;background:#19384a;transition:border-color .2s,transform .2s}
.client-shifts-theme .cs-photos img{display:block;width:100%;height:100%;object-fit:cover;color:#bedae7;font-size:10px}
.client-shifts-theme .cs-photos a:hover{transform:translateY(-2px);border-color:#b2efda}
.client-shifts-theme .cs-photos a:focus-visible{outline:3px solid #b2efda;outline-offset:3px}
.client-shifts-theme .cs-empty{padding:28px 18px;text-align:center;border:1px dashed #8bd4df44;border-radius:16px;background:#10283d;color:#d6edea}
.client-shifts-theme .cs-empty-icon{display:grid;place-items:center;width:40px;height:40px;margin:0 auto 10px;border-radius:13px;background:#9fe5ce14;color:#b2edda}
.client-shifts-theme .cs-empty-icon svg{width:23px;height:23px}
.client-shifts-theme .cs-empty strong{font-size:13px}
.client-shifts-theme .cs-empty p{font-size:12px;line-height:1.7;margin:7px 0 0;color:#9ebfce}
@media(max-width:640px){.client-shifts-theme .cs-grid{grid-template-columns:minmax(0,1fr);gap:12px}.client-shifts-theme .cs-card{padding:14px}.client-shifts-theme .cs-person .cs-eyebrow{font-size:8px;letter-spacing:.03em}.client-shifts-theme .cs-avatar{flex-basis:34px;width:34px;height:34px}.client-shifts-theme .cs-card-header{gap:8px}}
@media(prefers-reduced-motion:reduce){.client-shifts-theme .cs-photos a{transition:none}.client-shifts-theme .cs-photos a:hover{transform:none}}
`;
