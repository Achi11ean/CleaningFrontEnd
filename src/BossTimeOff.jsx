import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import CleaningTheme from "./CleaningTheme";

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className: "bto-status-pending",
    icon: "⏳",
  },
  approved: {
    label: "Approved",
    className: "bto-status-approved",
    icon: "✓",
  },
  rejected: {
    label: "Rejected",
    className: "bto-status-rejected",
    icon: "×",
  },
};

export default function BossTimeOff() {
  const { role, axios } = useAuthorizedAxios();

  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workingId, setWorkingId] = useState(null);

  const formatDateWithWeekday = (dateStr) => {
    if (!dateStr) return "Unknown date";

    // Keeps a YYYY-MM-DD value in local calendar time
    // instead of allowing UTC conversion to shift the date.
    const d = new Date(`${dateStr}T00:00:00`);

    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatSubmittedDate = (value) => {
    if (!value) return "Unknown";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";

    const parts = time.split(":");

    if (parts.length < 2) {
      return time;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return time;
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const fetchRequests = async () => {
    if (!axios) return;

    try {
      setLoading(true);
      setError(null);

      const res = await axios.get("/time-off/all", {
        params: statusFilter
          ? { status: statusFilter }
          : {},
      });

      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load time off requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !axios ||
      (role !== "admin" && role !== "manager")
    ) {
      return;
    }

    fetchRequests();
  }, [axios, role, statusFilter]);

  const setStatus = async (id, status) => {
    try {
      setWorkingId(id);

      await axios.patch(`/time-off/${id}`, {
        status,
      });

      await fetchRequests();
    } catch (err) {
      console.error(err);
      setError("Unable to update that request.");
    } finally {
      setWorkingId(null);
    }
  };

  const deleteRequest = async (id) => {
    if (
      !window.confirm(
        "Delete this time off request?"
      )
    ) {
      return;
    }

    try {
      setWorkingId(id);

      await axios.delete(`/time-off/${id}`);

      await fetchRequests();
    } catch (err) {
      console.error(err);
      setError("Unable to delete that request.");
    } finally {
      setWorkingId(null);
    }
  };

  if (
    !axios ||
    (role !== "admin" && role !== "manager")
  ) {
    return (
      <CleaningTheme>
        <main className="bto-page">
          <section className="bto-access-card ct-card">
            <div className="bto-access-icon">
              🔒
            </div>

            <span className="ct-eyebrow">
              Restricted Area
            </span>

            <h1>
              Manager <em>Access Required</em>
            </h1>

            <p>
              This section is available to
              administrators and managers.
            </p>
          </section>

          <style>{bossTimeOffStyles}</style>
        </main>
      </CleaningTheme>
    );
  }

  return (
    <CleaningTheme>
      <main className="bto-page">
        <section className="bto-shell">
          {/* Header */}
          <header className="bto-header">
            <div>
              <span className="ct-eyebrow">
                ✨ Staff Scheduling
              </span>

              <h1>
                Time Off <em>Approvals</em>
              </h1>

              <p>
                Review staff requests, approve
                availability changes, and keep the
                schedule sparkling clean.
              </p>
            </div>

            <div
              className="bto-header-icon"
              aria-hidden="true"
            >
              <span>🌴</span>
              <i>✦</i>
            </div>
          </header>

          {/* Toolbar */}
          <section className="ct-card bto-toolbar">
            <div className="bto-toolbar-copy">
              <span className="bto-toolbar-label">
                Request Queue
              </span>

              <strong>
                {loading
                  ? "Loading requests..."
                  : `${requests.length} ${
                      requests.length === 1
                        ? "request"
                        : "requests"
                    }`}
              </strong>
            </div>

            <div className="bto-filter-wrap">
              <span
                className="bto-filter-icon"
                aria-hidden="true"
              >
                ◉
              </span>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                aria-label="Filter time off requests"
              >
                <option value="">
                  All statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>

              <span
                className="bto-select-arrow"
                aria-hidden="true"
              >
                ▾
              </span>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="bto-error">
              <span aria-hidden="true">!</span>

              <div>
                <strong>
                  Something needs attention
                </strong>

                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <section className="ct-card bto-loading">
              <div className="bto-loading-icon">
                <span>🫧</span>
              </div>

              <span className="ct-eyebrow">
                Tidying the Schedule
              </span>

              <h2>
                Loading time off requests…
              </h2>

              <div className="bto-loading-line">
                <span />
              </div>
            </section>
          ) : requests.length === 0 ? (
            /* Empty */
            <section className="ct-card bto-empty">
              <div className="bto-empty-icon">
                🌤️
              </div>

              <span className="ct-eyebrow">
                All Clear
              </span>

              <h2>No requests found</h2>

              <p>
                There are currently no time off
                requests matching this status.
              </p>
            </section>
          ) : (
            /* Requests */
            <div className="bto-list">
              {requests.map((request) => {
                const status =
                  STATUS_STYLES[request.status] ||
                  STATUS_STYLES.pending;

                const ownerName =
                  request.owner?.display_name ||
                  "Unknown staff member";

                const isWorking =
                  workingId === request.id;

                return (
                  <article
                    key={request.id}
                    className="ct-card bto-request"
                  >
                    <div className="bto-request-top">
                      {/* Person */}
                      <div className="bto-person">
                        <div className="bto-avatar">
                          {ownerName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="bto-person-copy">
                          <div className="bto-name-row">
                            <h2>
                              {ownerName}
                            </h2>

                            <span
                              className={`bto-status ${status.className}`}
                            >
                              <span
                                aria-hidden="true"
                                className="bto-status-icon"
                              >
                                {status.icon}
                              </span>

                              {status.label}
                            </span>
                          </div>

                          <p>
                            Submitted{" "}
                            {formatSubmittedDate(
                              request.created_at
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Desktop actions */}
                      <div className="bto-actions bto-actions-desktop">
                        {request.status !==
                          "approved" && (
                          <button
                            type="button"
                            className="bto-btn bto-btn-approve"
                            disabled={isWorking}
                            onClick={() =>
                              setStatus(
                                request.id,
                                "approved"
                              )
                            }
                          >
                            <span aria-hidden="true">
                              ✓
                            </span>
                            Approve
                          </button>
                        )}

                        {request.status !==
                          "rejected" && (
                          <button
                            type="button"
                            className="bto-btn bto-btn-reject"
                            disabled={isWorking}
                            onClick={() =>
                              setStatus(
                                request.id,
                                "rejected"
                              )
                            }
                          >
                            <span aria-hidden="true">
                              ×
                            </span>
                            Reject
                          </button>
                        )}

                        <button
                          type="button"
                          className="bto-btn bto-btn-delete"
                          disabled={isWorking}
                          onClick={() =>
                            deleteRequest(
                              request.id
                            )
                          }
                        >
                          <span aria-hidden="true">
                            🗑
                          </span>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="bto-description">
                      <span className="bto-section-label">
                        Reason / Notes
                      </span>

                      {request.description ? (
                        <p>
                          {request.description}
                        </p>
                      ) : (
                        <p className="bto-muted">
                          No description provided.
                        </p>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="bto-dates">
                      <div className="bto-section-heading">
                        <span className="bto-section-label">
                          Requested Time
                        </span>

                        <small>
                          {request.entries?.length ||
                            0}{" "}
                          {(request.entries?.length ||
                            0) === 1
                            ? "entry"
                            : "entries"}
                        </small>
                      </div>

                      <div className="bto-date-list">
                        {(request.entries || []).map(
                          (entry, index) => (
                            <div
                              key={
                                entry.id ||
                                `${request.id}-${index}`
                              }
                              className="bto-date-card"
                            >
                              <div className="bto-calendar">
                                <span
                                  aria-hidden="true"
                                >
                                  📅
                                </span>
                              </div>

                              <div className="bto-date-copy">
                                <strong>
                                  {formatDateWithWeekday(
                                    entry.request_date
                                  )}
                                </strong>

                                <span>
                                  {entry.is_all_day
                                    ? "All day"
                                    : `${formatTime(
                                        entry.start_time
                                      )} – ${formatTime(
                                        entry.end_time
                                      )}`}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Mobile actions */}
                    <div className="bto-actions bto-actions-mobile">
                      {request.status !==
                        "approved" && (
                        <button
                          type="button"
                          className="bto-btn bto-btn-approve"
                          disabled={isWorking}
                          onClick={() =>
                            setStatus(
                              request.id,
                              "approved"
                            )
                          }
                        >
                          ✓ Approve
                        </button>
                      )}

                      {request.status !==
                        "rejected" && (
                        <button
                          type="button"
                          className="bto-btn bto-btn-reject"
                          disabled={isWorking}
                          onClick={() =>
                            setStatus(
                              request.id,
                              "rejected"
                            )
                          }
                        >
                          × Reject
                        </button>
                      )}

                      <button
                        type="button"
                        className="bto-btn bto-btn-delete"
                        disabled={isWorking}
                        onClick={() =>
                          deleteRequest(request.id)
                        }
                      >
                        🗑 Delete
                      </button>
                    </div>

                    {isWorking && (
                      <div className="bto-working">
                        <span className="bto-spinner" />
                        Updating request…
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <style>{bossTimeOffStyles}</style>
      </main>
    </CleaningTheme>
  );
}

const bossTimeOffStyles = `
  .bto-page {
    min-height: 100vh;
    padding: 58px 20px 90px;
  }

  .bto-shell {
    width: min(1000px, 100%);
    margin: 0 auto;
  }

  /* Header */

  .bto-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
    margin-bottom: 27px;
  }

  .bto-header h1 {
    margin-top: 9px;
    font-size: clamp(38px, 6vw, 59px);
    line-height: 1.02;
    color: #f1fbff;
  }

  .bto-header h1 em {
    display: block;
  }

  .bto-header p {
    max-width: 620px;
    margin-top: 15px;
    color: var(--ct-muted);
    font-size: 14px;
    line-height: 1.7;
  }

  .bto-header-icon {
    position: relative;
    flex: 0 0 auto;
    width: 96px;
    height: 96px;
    display: grid;
    place-items: center;
    border-radius: 29px;
    border: 1px solid #67e8f938;
    background:
      radial-gradient(circle at 30% 20%, #67e8f922, transparent 55%),
      #0b1930d6;
    box-shadow:
      inset 0 1px 0 #ffffff10,
      0 20px 45px #0000002c;
    backdrop-filter: blur(18px);
  }

  .bto-header-icon > span {
    font-size: 39px;
  }

  .bto-header-icon i {
    position: absolute;
    top: -6px;
    right: -5px;
    color: #afffee;
    font-style: normal;
    font-size: 24px;
    animation: btoTwinkle 2.1s ease-in-out infinite;
  }

  /* Toolbar */

  .bto-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    margin-bottom: 18px;
    padding: 17px 19px;
    border-radius: 22px;
  }

  .bto-toolbar-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bto-toolbar-label {
    color: #78a3b7;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .bto-toolbar-copy strong {
    color: #edfaff;
    font-size: 13px;
  }

  .bto-filter-wrap {
    position: relative;
    min-width: 190px;
  }

  .bto-filter-wrap select {
    width: 100%;
    min-height: 44px;
    appearance: none;
    padding: 9px 38px 9px 39px;
    border: 1px solid #74cde536;
    border-radius: 14px;
    outline: none;
    background: #071528d9;
    color: #e9faff;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    transition:
      border-color .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .bto-filter-wrap select:focus {
    border-color: #67e8f9;
    background: #0d2036;
    box-shadow: 0 0 0 4px #67e8f911;
  }

  .bto-filter-wrap select option {
    background: #09182a;
    color: #effcff;
  }

  .bto-filter-icon,
  .bto-select-arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .bto-filter-icon {
    left: 14px;
    color: #67e8f9;
    font-size: 11px;
  }

  .bto-select-arrow {
    right: 14px;
    color: #839daf;
  }

  /* Request list */

  .bto-list {
    display: grid;
    gap: 17px;
  }

  .bto-request {
    position: relative;
    overflow: hidden;
    padding: 22px;
    border-radius: 25px;
    transition:
      transform .22s ease,
      border-color .22s ease,
      box-shadow .22s ease;
  }

  .bto-request:hover {
    transform: translateY(-2px);
    border-color: #67e8f940;
    box-shadow: 0 22px 60px #00000025;
  }

  .bto-request::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 2px;
    background: linear-gradient(
      #67e8f9,
      #6ee7b7,
      transparent
    );
    opacity: .65;
  }

  .bto-request-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 22px;
  }

  /* Person */

  .bto-person {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 13px;
  }

  .bto-avatar {
    flex: 0 0 auto;
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    border: 1px solid #67e8f942;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        #67e8f926,
        #6ee7b714
      );
    color: #dffcff;
    font-family: Georgia, serif;
    font-size: 20px;
  }

  .bto-person-copy {
    min-width: 0;
  }

  .bto-name-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px;
  }

  .bto-name-row h2 {
    color: #f0fbff;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      sans-serif;
    font-size: 15px;
    font-weight: 750;
    letter-spacing: -.015em;
  }

  .bto-person-copy > p {
    margin-top: 5px;
    color: #718da1;
    font-size: 10px;
  }

  /* Status */

  .bto-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 25px;
    padding: 4px 9px;
    border: 1px solid;
    border-radius: 99px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .bto-status-icon {
    font-size: 10px;
  }

  .bto-status-pending {
    border-color: #f8d45d42;
    background: #eab30813;
    color: #ffe18b;
  }

  .bto-status-approved {
    border-color: #6ee7b743;
    background: #10b98113;
    color: #91f4ce;
  }

  .bto-status-rejected {
    border-color: #fb718545;
    background: #ef444413;
    color: #fca5a5;
  }

  /* Content */

  .bto-description,
  .bto-dates {
    margin-top: 18px;
    padding-top: 17px;
    border-top: 1px solid #74cde51d;
  }

  .bto-section-label {
    display: block;
    color: #67e8f9;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  .bto-description p {
    margin-top: 7px;
    color: #b2c8d8;
    font-size: 12px;
    line-height: 1.65;
  }

  .bto-description .bto-muted {
    color: #6e8798;
    font-style: italic;
  }

  .bto-section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 11px;
  }

  .bto-section-heading small {
    color: #6e8798;
    font-size: 9px;
  }

  .bto-date-list {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .bto-date-card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: min(100%, 280px);
    padding: 10px 12px;
    border: 1px solid #74cde528;
    border-radius: 15px;
    background:
      linear-gradient(
        125deg,
        #0d2138b8,
        #081528b8
      );
  }

  .bto-calendar {
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: #67e8f910;
    font-size: 15px;
  }

  .bto-date-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 2px;
  }

  .bto-date-copy strong {
    color: #e9faff;
    font-size: 10px;
    font-weight: 700;
  }

  .bto-date-copy span {
    color: #7f9aaa;
    font-size: 9px;
  }

  /* Buttons */

  .bto-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .bto-btn {
    min-height: 35px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid;
    border-radius: 11px;
    font-size: 10px !important;
    font-weight: 750;
    transition:
      transform .18s ease,
      background .18s ease,
      border-color .18s ease;
  }

  .bto-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .bto-btn:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  .bto-btn-approve {
    border-color: #6ee7b744;
    background: #10b98118;
    color: #9cf6d6;
  }

  .bto-btn-approve:hover:not(:disabled) {
    background: #10b98128;
    border-color: #6ee7b76b;
  }

  .bto-btn-reject {
    border-color: #f4c8573e;
    background: #eab30814;
    color: #ffe69b;
  }

  .bto-btn-reject:hover:not(:disabled) {
    background: #eab30824;
  }

  .bto-btn-delete {
    border-color: #fb71853c;
    background: #ef444410;
    color: #fca5a5;
  }

  .bto-btn-delete:hover:not(:disabled) {
    background: #ef444421;
  }

  .bto-actions-mobile {
    display: none;
  }

  /* Working */

  .bto-working {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    margin-top: 12px;
    color: #7fa1b5;
    font-size: 9px;
  }

  .bto-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid #67e8f92b;
    border-top-color: #67e8f9;
    border-radius: 50%;
    animation: btoSpin .65s linear infinite;
  }

  /* Loading / empty / access */

  .bto-loading,
  .bto-empty,
  .bto-access-card {
    padding: 52px 25px;
    text-align: center;
    border-radius: 26px;
  }

  .bto-loading-icon,
  .bto-empty-icon,
  .bto-access-icon {
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    margin: 0 auto 16px;
    border: 1px solid #67e8f93d;
    border-radius: 20px;
    background: #67e8f90f;
    font-size: 28px;
  }

  .bto-loading h2,
  .bto-empty h2,
  .bto-access-card h1 {
    margin-top: 9px;
    color: #edfaff;
    font-size: clamp(26px, 4vw, 36px);
  }

  .bto-empty p,
  .bto-access-card p {
    max-width: 450px;
    margin: 11px auto 0;
    color: var(--ct-muted);
    font-size: 12px;
    line-height: 1.65;
  }

  .bto-loading-line {
    width: min(220px, 70%);
    height: 3px;
    margin: 22px auto 0;
    overflow: hidden;
    border-radius: 99px;
    background: #1b344c;
  }

  .bto-loading-line span {
    display: block;
    width: 40%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      #67e8f9,
      #6ee7b7
    );
    animation: btoLoading 1.25s ease-in-out infinite;
  }

  /* Error */

  .bto-error {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    margin-bottom: 17px;
    padding: 13px 15px;
    border: 1px solid #fb71853a;
    border-radius: 15px;
    background: #ef444410;
  }

  .bto-error > span {
    flex: 0 0 auto;
    width: 27px;
    height: 27px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    background: #fb71851c;
    color: #fca5a5;
    font-weight: 900;
  }

  .bto-error strong {
    display: block;
    color: #fecaca;
    font-size: 11px;
  }

  .bto-error p {
    margin-top: 2px;
    color: #c9979e;
    font-size: 10px;
  }

  /* Animations */

  @keyframes btoSpin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes btoTwinkle {
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

  @keyframes btoLoading {
    0% {
      transform: translateX(-120%);
    }

    50% {
      transform: translateX(80%);
    }

    100% {
      transform: translateX(250%);
    }
  }

  /* Tablet */

  @media (max-width: 760px) {
    .bto-request-top {
      display: block;
    }

    .bto-actions-desktop {
      display: none;
    }

    .bto-actions-mobile {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      margin-top: 18px;
    }

    .bto-btn {
      width: 100%;
    }
  }

  /* Mobile */

  @media (max-width: 640px) {
    .bto-page {
      padding: 34px 14px 70px;
    }

    .bto-header {
      align-items: flex-start;
    }

    .bto-header-icon {
      width: 66px;
      height: 66px;
      border-radius: 21px;
    }

    .bto-header-icon > span {
      font-size: 27px;
    }

    .bto-header p {
      font-size: 12px;
    }

    .bto-toolbar {
      align-items: stretch;
      flex-direction: column;
      padding: 15px;
    }

    .bto-filter-wrap {
      width: 100%;
      min-width: 0;
    }

    .bto-request {
      padding: 18px 15px;
      border-radius: 21px;
    }

    .bto-person {
      align-items: flex-start;
    }

    .bto-avatar {
      width: 42px;
      height: 42px;
      border-radius: 14px;
    }

    .bto-date-list {
      display: grid;
      grid-template-columns: 1fr;
    }

    .bto-date-card {
      width: 100%;
      min-width: 0;
    }

    .bto-actions-mobile {
      grid-template-columns: 1fr 1fr;
    }

    .bto-btn-delete {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 430px) {
    .bto-header-icon {
      display: none;
    }

    .bto-header h1 {
      font-size: 38px;
    }

    .bto-name-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }

    .bto-actions-mobile {
      grid-template-columns: 1fr;
    }

    .bto-btn-delete {
      grid-column: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bto-header-icon i,
    .bto-loading-line span,
    .bto-spinner {
      animation: none;
    }

    .bto-request,
    .bto-btn {
      transition: none;
    }
  }
`;