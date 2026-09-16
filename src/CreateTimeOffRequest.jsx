import React, { useState } from "react";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";
import { toast } from "react-toastify";
import CleaningTheme from "./CleaningTheme";

export default function CreateTimeOffRequest({ onSuccess }) {
  // Detect which auth context is active
  let authAxios = null;
  let role = null;

  try {
    const adminCtx = useAdmin();

    if (adminCtx?.token) {
      authAxios = adminCtx.authAxios;
      role = "admin";
    }
  } catch {}

  try {
    const staffCtx = useStaff();

    if (staffCtx?.token) {
      authAxios = staffCtx.authAxios;
      role = "staff";
    }
  } catch {}

  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState([
    {
      request_date: "",
      is_all_day: true,
      start_time: "",
      end_time: "",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const updateEntry = (index, field, value) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      )
    );
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        request_date: "",
        is_all_day: true,
        start_time: "",
        end_time: "",
      },
    ]);
  };

  const removeEntry = (index) => {
    setEntries((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const validate = () => {
    if (!entries.length) {
      toast.error("Please add at least one requested date.");
      return false;
    }

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];

      if (!entry.request_date) {
        toast.error(
          `Please choose a date for request ${i + 1}.`
        );
        return false;
      }

      if (!entry.is_all_day) {
        if (!entry.start_time || !entry.end_time) {
          toast.error(
            `Please enter both a start and end time for request ${i + 1}.`
          );
          return false;
        }

        if (entry.end_time <= entry.start_time) {
          toast.error(
            `End time must be after start time for request ${i + 1}.`
          );
          return false;
        }
      }
    }

    return true;
  };

  const submit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await authAxios.post("/time-off", {
        description,
        entries: entries.map((entry) => ({
          request_date: entry.request_date,
          is_all_day: entry.is_all_day,
          start_time: entry.is_all_day
            ? null
            : entry.start_time,
          end_time: entry.is_all_day
            ? null
            : entry.end_time,
        })),
      });

      toast.success("Time off request submitted");

      setDescription("");
      setEntries([
        {
          request_date: "",
          is_all_day: true,
          start_time: "",
          end_time: "",
        },
      ]);

      onSuccess?.();
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
          "Failed to submit request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!authAxios || !role) {
    return (
      <CleaningTheme>
        <main className="ctor-page">
          <section className="ct-card ctor-access">
            <div className="ctor-access-icon">
              🔐
            </div>

            <span className="ct-eyebrow">
              Sign In Required
            </span>

            <h1>
              Request <em>Time Off</em>
            </h1>

            <p>
              You must be logged in as staff or an
              administrator to submit a time off request.
            </p>
          </section>

          <style>{timeOffStyles}</style>
        </main>
      </CleaningTheme>
    );
  }

  return (
    <CleaningTheme>
      <main className="ctor-page">
        <section className="ctor-shell">
          {/* Header */}
          <header className="ctor-header">
            <div>
              <span className="ct-eyebrow">
                ✨ Staff Scheduling
              </span>

              <h1>
                Request <em>Time Off</em>
              </h1>

              <p>
                Choose the dates you need away and let
                management know whether you need the full
                day or only part of it.
              </p>
            </div>

            <div
              className="ctor-header-icon"
              aria-hidden="true"
            >
              <span>🌴</span>
              <i>✦</i>
            </div>
          </header>

          {/* Main card */}
          <section className="ct-card ctor-card">
            <div className="ctor-card-heading">
              <div className="ctor-heading-icon">
                🧹
              </div>

              <div>
                <span className="ctor-kicker">
                  New Request
                </span>

                <h2>Plan Your Time Away</h2>

                <p>
                  Add one or multiple dates to the same
                  request.
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="ctor-field">
              <label htmlFor="time-off-description">
                <span>Notes or Description</span>
                <small>Optional</small>
              </label>

              <textarea
                id="time-off-description"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Example: Family trip, appointment, personal day..."
                rows={4}
              />
            </div>

            {/* Requested dates */}
            <div className="ctor-request-section">
              <div className="ctor-section-header">
                <div>
                  <span className="ctor-kicker">
                    Requested Time
                  </span>

                  <h3>
                    {entries.length}{" "}
                    {entries.length === 1
                      ? "Date"
                      : "Dates"}
                  </h3>
                </div>

                <button
                  type="button"
                  className="ctor-add-btn"
                  onClick={addEntry}
                  disabled={loading}
                >
                  <span aria-hidden="true">＋</span>
                  Add Date
                </button>
              </div>

              <div className="ctor-entry-list">
                {entries.map((entry, index) => (
                  <article
                    key={index}
                    className="ctor-entry"
                  >
                    <div className="ctor-entry-top">
                      <div className="ctor-entry-number">
                        <span>
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <div>
                          <strong>
                            Requested Date
                          </strong>
                          <small>
                            Time away entry
                          </small>
                        </div>
                      </div>

                      {entries.length > 1 && (
                        <button
                          type="button"
                          className="ctor-remove"
                          onClick={() =>
                            removeEntry(index)
                          }
                          disabled={loading}
                          aria-label={`Remove requested date ${
                            index + 1
                          }`}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="ctor-entry-grid">
                      {/* Date */}
                      <div className="ctor-field ctor-date-field">
                        <label
                          htmlFor={`request-date-${index}`}
                        >
                          <span>Date</span>
                          <small>Required</small>
                        </label>

                        <div className="ctor-input-wrap">
                          <span
                            className="ctor-input-icon"
                            aria-hidden="true"
                          >
                            📅
                          </span>

                          <input
                            id={`request-date-${index}`}
                            type="date"
                            value={entry.request_date}
                            onChange={(e) =>
                              updateEntry(
                                index,
                                "request_date",
                                e.target.value
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                      </div>

                      {/* All day */}
                      <div className="ctor-all-day-field">
                        <span className="ctor-toggle-label">
                          Duration
                        </span>

                        <label className="ctor-toggle-card">
                          <div className="ctor-toggle-copy">
                            <strong>All Day</strong>
                            <span>
                              I need the entire day off
                            </span>
                          </div>

                          <input
                            type="checkbox"
                            checked={entry.is_all_day}
                            onChange={(e) =>
                              updateEntry(
                                index,
                                "is_all_day",
                                e.target.checked
                              )
                            }
                            disabled={loading}
                          />

                          <span className="ctor-switch">
                            <i />
                          </span>
                        </label>
                      </div>
                    </div>

                    {!entry.is_all_day && (
                      <div className="ctor-time-block">
                        <div className="ctor-time-heading">
                          <div>
                            <span className="ctor-kicker">
                              Partial Day
                            </span>

                            <strong>
                              Select the time you need
                              away
                            </strong>
                          </div>

                          <span aria-hidden="true">
                            🕒
                          </span>
                        </div>

                        <div className="ctor-time-grid">
                          <div className="ctor-field">
                            <label
                              htmlFor={`start-time-${index}`}
                            >
                              <span>Start Time</span>
                              <small>Required</small>
                            </label>

                            <div className="ctor-input-wrap">
                              <span
                                className="ctor-input-icon"
                                aria-hidden="true"
                              >
                                ↪
                              </span>

                              <input
                                id={`start-time-${index}`}
                                type="time"
                                value={entry.start_time}
                                onChange={(e) =>
                                  updateEntry(
                                    index,
                                    "start_time",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </div>

                          <div className="ctor-field">
                            <label
                              htmlFor={`end-time-${index}`}
                            >
                              <span>End Time</span>
                              <small>Required</small>
                            </label>

                            <div className="ctor-input-wrap">
                              <span
                                className="ctor-input-icon"
                                aria-hidden="true"
                              >
                                ↩
                              </span>

                              <input
                                id={`end-time-${index}`}
                                type="time"
                                value={entry.end_time}
                                onChange={(e) =>
                                  updateEntry(
                                    index,
                                    "end_time",
                                    e.target.value
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="ctor-footer">
              <div className="ctor-footer-note">
                <span aria-hidden="true">🫧</span>

                <p>
                  Your request will remain pending until
                  an administrator or manager reviews it.
                </p>
              </div>

              <button
                type="button"
                className="ct-btn ctor-submit"
                disabled={loading}
                onClick={submit}
              >
                {loading ? (
                  <>
                    <span className="ctor-spinner" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">✨</span>
                    Submit Time Off Request
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </section>

        <style>{timeOffStyles}</style>
      </main>
    </CleaningTheme>
  );
}

const timeOffStyles = `
  .ctor-page {
    min-height: 100vh;
    padding: 58px 20px 90px;
  }

  .ctor-shell {
    width: min(900px, 100%);
    margin: 0 auto;
  }

  /* Header */

  .ctor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 28px;
  }

  .ctor-header h1 {
    margin-top: 10px;
    color: #f0fbff;
    font-size: clamp(38px, 6vw, 59px);
    line-height: 1.02;
  }

  .ctor-header h1 em {
    display: block;
  }

  .ctor-header p {
    max-width: 620px;
    margin-top: 15px;
    color: var(--ct-muted);
    font-size: 14px;
    line-height: 1.7;
  }

  .ctor-header-icon {
    position: relative;
    flex: 0 0 auto;
    width: 94px;
    height: 94px;
    display: grid;
    place-items: center;
    border: 1px solid #67e8f93b;
    border-radius: 30px;
    background:
      radial-gradient(
        circle at 30% 20%,
        #67e8f924,
        transparent 55%
      ),
      #0b1930d5;
    box-shadow:
      inset 0 1px 0 #ffffff10,
      0 20px 50px #0000002c;
    backdrop-filter: blur(18px);
  }

  .ctor-header-icon > span {
    font-size: 38px;
  }

  .ctor-header-icon i {
    position: absolute;
    top: -7px;
    right: -5px;
    color: #b4ffee;
    font-style: normal;
    font-size: 25px;
    animation: ctorTwinkle 2.2s ease-in-out infinite;
  }

  /* Card */

  .ctor-card {
    position: relative;
    overflow: hidden;
    padding: clamp(22px, 4vw, 36px);
    border-radius: 30px;
    box-shadow:
      0 30px 75px #00000036,
      inset 0 1px 0 #ffffff0c;
  }

  .ctor-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      #67e8f9,
      #6ee7b7,
      transparent
    );
    opacity: .75;
  }

  .ctor-card-heading {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-bottom: 26px;
    margin-bottom: 27px;
    border-bottom: 1px solid #74cde51f;
  }

  .ctor-heading-icon {
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    border: 1px solid #67e8f944;
    border-radius: 17px;
    background:
      linear-gradient(
        145deg,
        #67e8f91e,
        #6ee7b70f
      );
    font-size: 25px;
  }

  .ctor-kicker {
    display: block;
    margin-bottom: 4px;
    color: #67e8f9;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .16em;
    text-transform: uppercase;
  }

  .ctor-card-heading h2 {
    color: #f1fbff;
    font-size: clamp(24px, 4vw, 32px);
  }

  .ctor-card-heading p {
    margin-top: 6px;
    color: var(--ct-muted);
    font-size: 12px;
    line-height: 1.6;
  }

  /* Inputs */

  .ctor-field label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    color: #e8f9ff;
    font-size: 11px;
    font-weight: 750;
  }

  .ctor-field label small {
    color: #7693a8;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  .ctor-field textarea,
  .ctor-input-wrap input {
    width: 100%;
    appearance: none;
    border: 1px solid #74cde538;
    outline: none;
    background: #081529db;
    color: #eefcff;
    font: inherit;
    transition:
      border-color .2s ease,
      background .2s ease,
      box-shadow .2s ease;
  }

  .ctor-field textarea {
    min-height: 110px;
    resize: vertical;
    padding: 14px 15px;
    border-radius: 17px;
    font-size: 12px;
    line-height: 1.6;
  }

  .ctor-field textarea::placeholder {
    color: #607a8d;
  }

  .ctor-field textarea:focus,
  .ctor-input-wrap input:focus {
    border-color: #67e8f9;
    background: #0c1d34;
    box-shadow: 0 0 0 4px #67e8f910;
  }

  .ctor-input-wrap {
    position: relative;
  }

  .ctor-input-wrap input {
    min-height: 52px;
    padding: 11px 14px 11px 45px;
    border-radius: 15px;
    font-size: 12px;
  }

  .ctor-input-icon {
    position: absolute;
    top: 50%;
    left: 15px;
    z-index: 2;
    transform: translateY(-50%);
    color: #7dd3fc;
    font-size: 14px;
    pointer-events: none;
  }

  .ctor-input-wrap input:disabled,
  .ctor-field textarea:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter:
      invert(86%)
      sepia(21%)
      saturate(1032%)
      hue-rotate(156deg)
      brightness(101%);
    opacity: .85;
    cursor: pointer;
  }

  /* Request section */

  .ctor-request-section {
    margin-top: 29px;
    padding-top: 27px;
    border-top: 1px solid #74cde51f;
  }

  .ctor-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
  }

  .ctor-section-header h3 {
    color: #eafaff;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 15px;
    font-weight: 750;
  }

  .ctor-add-btn {
    min-height: 39px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 9px 13px;
    border: 1px solid #67e8f944;
    border-radius: 12px;
    background: #67e8f910;
    color: #baf8ff;
    font-size: 10px !important;
    font-weight: 750;
    transition:
      background .2s ease,
      transform .2s ease;
  }

  .ctor-add-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #67e8f91c;
  }

  .ctor-add-btn:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  /* Entries */

  .ctor-entry-list {
    display: grid;
    gap: 14px;
  }

  .ctor-entry {
    position: relative;
    padding: 18px;
    border: 1px solid #74cde528;
    border-radius: 21px;
    background:
      linear-gradient(
        140deg,
        #0d1f39cf,
        #071426cf
      );
  }

  .ctor-entry::after {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    border-radius: 2px;
    background: linear-gradient(
      #67e8f9,
      #6ee7b7,
      transparent
    );
    opacity: .65;
  }

  .ctor-entry-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 17px;
  }

  .ctor-entry-number {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .ctor-entry-number > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border: 1px solid #67e8f939;
    border-radius: 12px;
    background: #67e8f90e;
    color: #9debf5;
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .08em;
  }

  .ctor-entry-number strong {
    display: block;
    color: #edfaff;
    font-size: 11px;
  }

  .ctor-entry-number small {
    display: block;
    margin-top: 2px;
    color: #718da1;
    font-size: 8px;
  }

  .ctor-remove {
    width: 33px;
    height: 33px;
    display: grid;
    place-items: center;
    border: 1px solid #fb71853d;
    border-radius: 10px;
    background: #ef444410;
    color: #fca5a5;
    font-size: 11px !important;
    transition:
      background .2s ease,
      transform .2s ease;
  }

  .ctor-remove:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #ef444422;
  }

  .ctor-entry-grid {
    display: grid;
    grid-template-columns:
      minmax(0, 1.2fr)
      minmax(220px, .8fr);
    gap: 14px;
    align-items: end;
  }

  /* All-day switch */

  .ctor-toggle-label {
    display: block;
    margin-bottom: 8px;
    color: #e8f9ff;
    font-size: 11px;
    font-weight: 750;
  }

  .ctor-toggle-card {
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 9px 12px;
    border: 1px solid #74cde533;
    border-radius: 15px;
    background: #081529d5;
    cursor: pointer;
  }

  .ctor-toggle-copy strong {
    display: block;
    color: #eafaff;
    font-size: 10px;
  }

  .ctor-toggle-copy span {
    display: block;
    margin-top: 2px;
    color: #718b9e;
    font-size: 8px;
  }

  .ctor-toggle-card input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .ctor-switch {
    position: relative;
    flex: 0 0 auto;
    width: 42px;
    height: 23px;
    border: 1px solid #4b6477;
    border-radius: 99px;
    background: #13283b;
    transition:
      background .2s ease,
      border-color .2s ease;
  }

  .ctor-switch i {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #8197a8;
    transition:
      transform .2s ease,
      background .2s ease;
  }

  .ctor-toggle-card input:checked + .ctor-switch {
    border-color: #6ee7b75c;
    background: #10b98138;
  }

  .ctor-toggle-card input:checked + .ctor-switch i {
    transform: translateX(19px);
    background: #8ff5d1;
  }

  /* Partial day */

  .ctor-time-block {
    margin-top: 15px;
    padding: 14px;
    border: 1px solid #67e8f923;
    border-radius: 16px;
    background:
      linear-gradient(
        120deg,
        #67e8f908,
        #6ee7b707
      );
  }

  .ctor-time-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    margin-bottom: 12px;
  }

  .ctor-time-heading strong {
    color: #dff9ff;
    font-size: 10px;
  }

  .ctor-time-heading > span {
    font-size: 18px;
  }

  .ctor-time-grid {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  /* Footer */

  .ctor-footer {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid #74cde51f;
  }

  .ctor-footer-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-bottom: 15px;
    text-align: center;
  }

  .ctor-footer-note > span {
    flex: 0 0 auto;
    font-size: 17px;
  }

  .ctor-footer-note p {
    color: #7895a8;
    font-size: 9px;
    line-height: 1.6;
  }

  .ctor-submit {
    width: 100%;
    min-height: 54px;
    border: 0;
    justify-content: center;
    font-size: 12px;
  }

  .ctor-submit:disabled {
    opacity: .5;
    cursor: not-allowed;
    transform: none;
  }

  .ctor-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #063c4560;
    border-top-color: #063c45;
    border-radius: 50%;
    animation: ctorSpin .65s linear infinite;
  }

  /* Access */

  .ctor-access {
    width: min(600px, calc(100% - 30px));
    margin: 80px auto;
    padding: 55px 25px;
    text-align: center;
    border-radius: 27px;
  }

  .ctor-access-icon {
    width: 62px;
    height: 62px;
    display: grid;
    place-items: center;
    margin: 0 auto 16px;
    border: 1px solid #67e8f93d;
    border-radius: 20px;
    background: #67e8f90f;
    font-size: 29px;
  }

  .ctor-access h1 {
    margin-top: 9px;
    color: #effbff;
    font-size: clamp(31px, 5vw, 42px);
  }

  .ctor-access p {
    max-width: 420px;
    margin: 12px auto 0;
    color: var(--ct-muted);
    font-size: 12px;
    line-height: 1.65;
  }

  /* Animations */

  @keyframes ctorSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ctorTwinkle {
    0%,
    100% {
      opacity: .35;
      transform: scale(.75) rotate(0deg);
    }

    50% {
      opacity: 1;
      transform: scale(1.15) rotate(35deg);
    }
  }

  /* Tablet */

  @media (max-width: 720px) {
    .ctor-entry-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Mobile */

  @media (max-width: 640px) {
    .ctor-page {
      padding: 34px 14px 70px;
    }

    .ctor-header {
      align-items: flex-start;
    }

    .ctor-header-icon {
      width: 67px;
      height: 67px;
      border-radius: 22px;
    }

    .ctor-header-icon > span {
      font-size: 28px;
    }

    .ctor-header p {
      font-size: 12px;
    }

    .ctor-card {
      padding: 20px 15px;
      border-radius: 24px;
    }

    .ctor-card-heading {
      align-items: flex-start;
      padding-bottom: 21px;
      margin-bottom: 22px;
    }

    .ctor-heading-icon {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      font-size: 20px;
    }

    .ctor-section-header {
      align-items: stretch;
      flex-direction: column;
    }

    .ctor-add-btn {
      width: 100%;
    }

    .ctor-entry {
      padding: 15px 13px;
      border-radius: 18px;
    }

    .ctor-time-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 430px) {
    .ctor-header-icon {
      display: none;
    }

    .ctor-header h1 {
      font-size: 38px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ctor-header-icon i,
    .ctor-spinner {
      animation: none;
    }

    .ctor-add-btn,
    .ctor-remove,
    .ctor-switch,
    .ctor-switch i {
      transition: none;
    }
  }
`;