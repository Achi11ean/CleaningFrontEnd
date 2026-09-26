// src/Applications.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";
import CleaningTheme, {
  CleaningSparkle,
} from "./CleaningTheme";
/* =========================================================
   AUTH
   Admins use AdminContext.
   Managers use StaffContext.
========================================================= */
function useAuthorizedAxios() {
  const {
    admin,
    authAxios: adminAxios,
  } = useAdmin();
  const {
    staff,
    authAxios: staffAxios,
  } = useStaff();
  if (admin) {
    return {
      role: "admin",
      axios: adminAxios,
    };
  }
  if (staff) {
    return {
      role: staff.role,
      axios: staffAxios,
    };
  }
  return {
    role: null,
    axios: null,
  };
}
const STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "interview",
  "hired",
  "rejected",
  "withdrawn",
];
const EMPTY_EDIT = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  best_contact_method: "",
  town: "",
  experience: "",
  availability: "",
  reliable_transportation: false,
  work_authorization_status: "",
  citizenship_status: "",
  veteran_status: "",
  disability_status: "",
  prior_convictions: "",
  status: "new",
  internal_notes: "",
};
export default function Applications() {
  const {
    role,
    axios,
  } = useAuthorizedAxios();
  const authorized =
    role === "admin" ||
    role === "manager";
  const [applications, setApplications] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [notice, setNotice] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [selected, setSelected] =
    useState(null);
  const [editForm, setEditForm] =
    useState(EMPTY_EDIT);
  const [applicationsOpen, setApplicationsOpen] =
    useState(null);
  const [closedMessage, setClosedMessage] =
    useState("");
  const [savingSettings, setSavingSettings] =
    useState(false);
  /* =========================================================
     LOAD
  ========================================================= */
  const loadApplications = useCallback(
    async () => {
      if (!axios || !authorized) return;
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          "/job-applications"
        );
        setApplications(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load applications:",
          err
        );
        setError(
          err.response?.data?.error ||
            "Unable to load applications."
        );
      } finally {
        setLoading(false);
      }
    },
    [axios, authorized]
  );
  const loadSettings = useCallback(
    async () => {
      if (!axios || !authorized) return;
      try {
        const res = await axios.get(
          "/job-applications/status"
        );
        setApplicationsOpen(
          res.data?.applications_open !== false
        );
        setClosedMessage(
          res.data?.closed_message || ""
        );
      } catch (err) {
        console.error(
          "Failed to load application settings:",
          err
        );
      }
    },
    [axios, authorized]
  );
  useEffect(() => {
    if (!authorized) {
      setLoading(false);
      return;
    }
    loadApplications();
    loadSettings();
  }, [
    authorized,
    loadApplications,
    loadSettings,
  ]);
  /* =========================================================
     FILTERS
  ========================================================= */
  const filteredApplications =
    useMemo(() => {
      const q = search
        .trim()
        .toLowerCase();
      return applications.filter(
        (application) => {
          const matchesStatus =
            statusFilter === "all" ||
            application.status ===
              statusFilter;
          if (!matchesStatus) {
            return false;
          }
          if (!q) return true;
          const haystack = [
            application.first_name,
            application.last_name,
            application.email,
            application.phone,
            application.town,
            application.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        }
      );
    }, [
      applications,
      search,
      statusFilter,
    ]);
  const counts = useMemo(() => {
    const result = {
      all: applications.length,
    };
    STATUSES.forEach((status) => {
      result[status] =
        applications.filter(
          (item) =>
            item.status === status
        ).length;
    });
    return result;
  }, [applications]);
  /* =========================================================
     EDIT
  ========================================================= */
  const openApplication = (application) => {
    setSelected(application);
    setEditForm({
      ...EMPTY_EDIT,
      ...application,
      reliable_transportation:
        Boolean(
          application.reliable_transportation
        ),
      experience:
        application.experience || "",
      availability:
        application.availability || "",
      work_authorization_status:
        application.work_authorization_status ||
        "",
      citizenship_status:
        application.citizenship_status ||
        "",
      veteran_status:
        application.veteran_status || "",
      disability_status:
        application.disability_status || "",
      prior_convictions:
        application.prior_convictions || "",
      internal_notes:
        application.internal_notes || "",
    });
  };
  const closeApplication = () => {
    if (saving) return;
    setSelected(null);
    setEditForm(EMPTY_EDIT);
  };
  const handleEditChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };
  const saveApplication = async () => {
    if (
      !axios ||
      !selected ||
      saving
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...editForm,
        first_name:
          editForm.first_name.trim(),
        last_name:
          editForm.last_name.trim(),
        email:
          editForm.email
            .trim()
            .toLowerCase(),
        phone:
          editForm.phone.trim(),
        town:
          editForm.town.trim(),
      };
      const res = await axios.patch(
        `/job-applications/${selected.id}`,
        payload
      );
      const updated =
        res.data?.application ||
        payload;
      setApplications((prev) =>
        prev.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                ...updated,
              }
            : item
        )
      );
      setNotice(
        `${editForm.first_name}'s application was updated.`
      );
      setSelected(null);
      setEditForm(EMPTY_EDIT);
    } catch (err) {
      console.error(
        "Failed to update application:",
        err
      );
      setError(
        err.response?.data?.error ||
          "Unable to update application."
      );
    } finally {
      setSaving(false);
    }
  };
  /* =========================================================
     QUICK STATUS
  ========================================================= */
  const updateStatus = async (
    application,
    status
  ) => {
    if (!axios) return;
    const oldStatus =
      application.status;
    setApplications((prev) =>
      prev.map((item) =>
        item.id === application.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );
    try {
      await axios.patch(
        `/job-applications/${application.id}`,
        {
          status,
        }
      );
    } catch (err) {
      console.error(
        "Failed to update status:",
        err
      );
      setApplications((prev) =>
        prev.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: oldStatus,
              }
            : item
        )
      );
      setError(
        "Unable to update application status."
      );
    }
  };
  /* =========================================================
     DELETE
  ========================================================= */
  const deleteApplication = async (
    application
  ) => {
    if (!axios) return;
    const name =
      `${application.first_name} ${application.last_name}`.trim();
    const confirmed =
      window.confirm(
        `Permanently delete ${name}'s application?`
      );
    if (!confirmed) return;
    try {
      await axios.delete(
        `/job-applications/${application.id}`
      );
      setApplications((prev) =>
        prev.filter(
          (item) =>
            item.id !== application.id
        )
      );
      if (
        selected?.id ===
        application.id
      ) {
        setSelected(null);
      }
      setNotice(
        `${name}'s application was deleted.`
      );
    } catch (err) {
      console.error(
        "Failed to delete application:",
        err
      );
      setError(
        err.response?.data?.error ||
          "Unable to delete application."
      );
    }
  };
  /* =========================================================
     APPLICATION SETTINGS
  ========================================================= */
  const toggleApplications = async () => {
    if (
      !axios ||
      applicationsOpen === null ||
      savingSettings
    ) {
      return;
    }
    const next =
      !applicationsOpen;
    setSavingSettings(true);
    try {
      await axios.patch(
        "/job-applications/settings",
        {
          applications_open: next,
          closed_message:
            closedMessage || null,
        }
      );
      setApplicationsOpen(next);
      setNotice(
        next
          ? "Job applications are now open."
          : "Job applications are now closed."
      );
    } catch (err) {
      console.error(
        "Failed to update application settings:",
        err
      );
      setError(
        "Unable to change application settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };
  const saveClosedMessage = async () => {
    if (!axios || savingSettings) {
      return;
    }
    setSavingSettings(true);
    try {
      await axios.patch(
        "/job-applications/settings",
        {
          applications_open:
            Boolean(applicationsOpen),
          closed_message:
            closedMessage.trim() || null,
        }
      );
      setNotice(
        "Closed-applications message updated."
      );
    } catch (err) {
      console.error(err);
      setError(
        "Unable to save the closed message."
      );
    } finally {
      setSavingSettings(false);
    }
  };
  /* =========================================================
     ACCESS
  ========================================================= */
  if (!authorized) {
    return (
      <CleaningTheme className="applications-theme">
        <style>{styles}</style>
        <div className="ja-access">
          <CleaningSparkle />
          <h2>Management access only</h2>
          <p>
            Job applications can be viewed by
            administrators and managers.
          </p>
        </div>
      </CleaningTheme>
    );
  }
  /* =========================================================
     PAGE
  ========================================================= */
  return (
    <CleaningTheme className="applications-theme">
      <style>{styles}</style>
      <section className="ja-shell">
        {/* HEADER */}
        <header className="ja-header">
          <div>
            <p className="ja-eyebrow">
              <CleaningSparkle />
              Hiring
            </p>
            <h2>Applications</h2>
            <p>
              Review, update and manage
              applicants.
            </p>
          </div>
          <div className="ja-header-stats">
            <MiniStat
              value={counts.all}
              label="Total"
            />
            <MiniStat
              value={counts.new || 0}
              label="New"
              active
            />
            <MiniStat
              value={
                counts.interview || 0
              }
              label="Interview"
            />
          </div>
        </header>
        {/* OPEN / CLOSED */}
        <div className="ja-hiring-bar">
          <div className="ja-hiring-left">
            <span
              className={`ja-live-dot ${
                applicationsOpen
                  ? "is-open"
                  : ""
              }`}
            />
            <div>
              <strong>
                {applicationsOpen === null
                  ? "Loading hiring status…"
                  : applicationsOpen
                    ? "Applications open"
                    : "Applications closed"}
              </strong>
              <small>
                Controls the public application
                form.
              </small>
            </div>
          </div>
          <button
            type="button"
            className={`ja-switch ${
              applicationsOpen
                ? "is-on"
                : ""
            }`}
            role="switch"
            aria-label="Accept job applications"
            aria-checked={
              Boolean(
                applicationsOpen
              )
            }
            disabled={
              applicationsOpen === null ||
              savingSettings
            }
            onClick={
              toggleApplications
            }
          >
            <span />
          </button>
        </div>
        {!applicationsOpen &&
          applicationsOpen !== null && (
            <div className="ja-closed-message">
              <input
                aria-label="Message when applications are closed"
                value={closedMessage}
                onChange={(event) =>
                  setClosedMessage(
                    event.target.value
                  )
                }
                placeholder="Applications are currently closed. Please check back soon."
              />
              <button
                type="button"
                onClick={
                  saveClosedMessage
                }
                disabled={savingSettings}
              >
                Save message
              </button>
            </div>
          )}
        {/* MESSAGES */}
        {error && (
          <div className="ja-alert is-error" role="alert">
            <strong>!</strong>
            <span>{error}</span>
            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}
        {notice && (
          <div className="ja-alert is-success" role="status">
            <strong>✓</strong>
            <span>{notice}</span>
            <button
              type="button"
              onClick={() =>
                setNotice("")
              }
            >
              ×
            </button>
          </div>
        )}
        {/* TOOLS */}
        <div className="ja-tools">
          <div className="ja-search">
            <span aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              aria-label="Search applications"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, town, email…"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}
          </div>
          <button
            type="button"
            className="ja-refresh"
            aria-label="Refresh applications"
            onClick={
              loadApplications
            }
            disabled={loading}
          >
            ↻
            <span>Refresh</span>
          </button>
        </div>
        {/* FILTERS */}
        <div className="ja-filters">
          <FilterPill
            active={
              statusFilter === "all"
            }
            onClick={() =>
              setStatusFilter("all")
            }
          >
            All
            <b>{counts.all}</b>
          </FilterPill>
          {STATUSES.map((status) => (
            <FilterPill
              key={status}
              active={
                statusFilter ===
                status
              }
              onClick={() =>
                setStatusFilter(status)
              }
            >
              {pretty(status)}
              <b>
                {counts[status] || 0}
              </b>
            </FilterPill>
          ))}
        </div>
        {/* CONTENT */}
        {loading ? (
          <div className="ja-state">
            <span className="ja-loader" />
            <p>
              Loading applications…
            </p>
          </div>
        ) : filteredApplications.length ===
          0 ? (
          <div className="ja-state">
            <CleaningSparkle />
            <h3>
              No applications found
            </h3>
            <p>
              Try another search or
              status filter.
            </p>
          </div>
        ) : (
          <div className="ja-list">
            {filteredApplications.map(
              (application) => (
                <ApplicantCard
                  key={
                    application.id
                  }
                  application={
                    application
                  }
                  onOpen={() =>
                    openApplication(
                      application
                    )
                  }
                  onDelete={() =>
                    deleteApplication(
                      application
                    )
                  }
                  onStatusChange={(
                    status
                  ) =>
                    updateStatus(
                      application,
                      status
                    )
                  }
                />
              )
            )}
          </div>
        )}
        <div className="ja-count-footer">
          Showing{" "}
          <strong>
            {
              filteredApplications.length
            }
          </strong>{" "}
          of{" "}
          <strong>
            {applications.length}
          </strong>{" "}
          applications
        </div>
      </section>
      {selected && (
        <ApplicationModal
          application={selected}
          error={error}
          form={editForm}
          saving={saving}
          onChange={
            handleEditChange
          }
          onClose={
            closeApplication
          }
          onSave={
            saveApplication
          }
          onDelete={() =>
            deleteApplication(
              selected
            )
          }
        />
      )}
    </CleaningTheme>
  );
}
/* =========================================================
   APPLICANT CARD
========================================================= */
function ApplicantCard({
  application,
  onOpen,
  onDelete,
  onStatusChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `ja-application-details-${application.id}`;
  const name =
    `${application.first_name || ""} ${
      application.last_name || ""
    }`.trim();
  return (
    <article className="ja-card">
      <button
        type="button"
        className="ja-card-main"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded(value => !value)}
      >
        <div className="ja-avatar">
          {initials(application)}
        </div>
        <div className="ja-card-person">
          <div className="ja-name-row">
            <h3>{name}</h3>
            {application.status ===
              "new" && (
              <span className="ja-new">
                New
              </span>
            )}
          </div>
          <p>
            {application.town ||
              "Town not provided"}
          </p>
        </div>
      </button>
      <div className="ja-card-contact">
        <a
          href={`tel:${application.phone}`}
        >
          <span>☎</span>
          {formatPhone(application.phone)}
        </a>
        <a
          href={`mailto:${application.email}`}
        >
          <span>✉</span>
          {application.email}
        </a>
      </div>
      <div className="ja-card-meta">
        <Meta
          label="Contact"
          value={pretty(
            application.best_contact_method
          )}
        />
        <Meta
          label="Transportation"
          value={
            application.reliable_transportation
              ? "Yes"
              : "No"
          }
        />
        <Meta
          label="Applied"
          value={formatDate(
            application.created_at
          )}
        />
      </div>
      <div className="ja-card-actions">
        <select
          className={`ja-status status-${application.status}`}
          value={
            application.status ||
            "new"
          }
          onChange={(event) =>
            onStatusChange(
              event.target.value
            )
          }
          aria-label={`Status for ${name}`}
        >
          {STATUSES.map(
            (status) => (
              <option
                key={status}
                value={status}
              >
                {pretty(status)}
              </option>
            )
          )}
        </select>
        <button
          type="button"
          className={`ja-view${expanded ? " is-active" : ""}`}
          onClick={() => setExpanded(value => !value)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${expanded ? "Hide" : "View"} full application for ${name}`}
          title={expanded ? "Hide application" : "View full application"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" />
            <rect x="9" y="2" width="6" height="6" rx="2" />
            <path d="M8 12h8M8 16h8" />
          </svg>
        </button>
        <button
          type="button"
          className="ja-edit"
          onClick={onOpen}
        >
          Edit
        </button>
        <button
          type="button"
          className="ja-delete"
          onClick={onDelete}
          aria-label={`Delete ${name}`}
        >
          ×
        </button>
      </div>
      <div id={detailsId} className="ja-application-details" hidden={!expanded}>
        {expanded && <ApplicationDetails application={application} />}
      </div>
    </article>
  );
}

function ApplicationDetails({ application }) {
  const valueOrEmpty = value => value == null || String(value).trim() === "" ? "Not provided" : String(value);
  const groups = [
    ["Applicant", [
      ["First name", application.first_name],
      ["Last name", application.last_name],
      ["Phone", application.phone ? formatPhone(application.phone) : null],
      ["Email", application.email],
      ["Town", application.town],
      ["Preferred contact", application.best_contact_method ? pretty(application.best_contact_method) : null],
      ["Submitted", formatDate(application.created_at)],
    ]],
    ["Availability & experience", [
      ["Availability", application.availability],
      ["Experience", application.experience],
      ["Reliable transportation", application.reliable_transportation == null ? null : application.reliable_transportation ? "Yes" : "No"],
    ]],
    ["Employment", [
      ["Work authorization", application.work_authorization_status],
      ["Citizenship status", application.citizenship_status],
      ["Veteran status", application.veteran_status],
      ["Disability status", application.disability_status],
      ["Prior convictions", application.prior_convictions],
    ]],
    ["Management", [
      ["Status", pretty(application.status || "new")],
      ["Internal notes", application.internal_notes],
    ]],
  ];
  return (
    <>
      <div className="ja-details-title">
        <h4>Full application</h4>
        <span>#{application.id}</span>
      </div>
      {groups.map(([title, fields]) => (
        <section className="ja-detail-group" key={title}>
          <h5>{title}</h5>
          <dl>
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{valueOrEmpty(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}
/* =========================================================
   EDIT MODAL
========================================================= */
function ApplicationModal({
  application,
  form,
  saving,
  onChange,
  onClose,
  onSave,
  onDelete,
  error,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  const handleKeys = (event) => {
    if (event.key === "Escape") { event.stopPropagation(); closeRef.current(); }
    if (event.key !== "Tab") return;
    const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
  };
  return (
    <div
      className="ja-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="ja-modal"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeys}
        role="dialog"
        aria-modal="true"
        aria-label="Edit application"
      >
        <div className="ja-modal-header">
          <div className="ja-modal-person">
            <div className="ja-avatar is-large">
              {initials(
                application
              )}
            </div>
            <div>
              <span className="ja-eyebrow">
                Application #
                {application.id}
              </span>
              <h2>
                {form.first_name}{" "}
                {form.last_name}
              </h2>
              <p>
                Submitted{" "}
                {formatDate(
                  application.created_at
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ja-modal-close"
            aria-label="Close application"
            disabled={saving}
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="ja-modal-body">
          {error && <div className="ja-alert is-error" role="alert">{error}</div>}
          <EditSection title="Applicant">
            <div className="ja-form-grid">
              <Field label="First name">
                <input
                  name="first_name"
                  value={
                    form.first_name
                  }
                  onChange={onChange}
                />
              </Field>
              <Field label="Last name">
                <input
                  name="last_name"
                  value={
                    form.last_name
                  }
                  onChange={onChange}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                />
              </Field>
              <Field label="Town">
                <input
                  name="town"
                  value={form.town}
                  onChange={onChange}
                />
              </Field>
              <Field label="Contact">
                <select
                  name="best_contact_method"
                  value={
                    form.best_contact_method
                  }
                  onChange={onChange}
                >
                  <option value="">
                    —
                  </option>
                  <option value="phone">
                    Phone
                  </option>
                  <option value="text">
                    Text
                  </option>
                  <option value="email">
                    Email
                  </option>
                </select>
              </Field>
            </div>
          </EditSection>
          <EditSection title="Availability & Experience">
            <div className="ja-form-grid">
              <Field
                label="Availability"
                wide
              >
                <textarea
                  name="availability"
                  value={
                    form.availability
                  }
                  onChange={onChange}
                  rows={3}
                />
              </Field>
              <Field
                label="Experience"
                wide
              >
                <textarea
                  name="experience"
                  value={
                    form.experience
                  }
                  onChange={onChange}
                  rows={3}
                />
              </Field>
              <label className="ja-check">
                <input
                  type="checkbox"
                  name="reliable_transportation"
                  checked={Boolean(
                    form.reliable_transportation
                  )}
                  onChange={onChange}
                />
                <span>
                  ✓
                </span>
                Reliable transportation
              </label>
            </div>
          </EditSection>
          <EditSection title="Employment">
            <div className="ja-form-grid">
              <Field label="Work authorization">
                <input
                  name="work_authorization_status"
                  value={
                    form.work_authorization_status
                  }
                  onChange={onChange}
                />
              </Field>
              <Field label="Citizenship status">
                <input
                  name="citizenship_status"
                  value={
                    form.citizenship_status
                  }
                  onChange={onChange}
                />
              </Field>
              <Field label="Veteran status">
                <input
                  name="veteran_status"
                  value={
                    form.veteran_status
                  }
                  onChange={onChange}
                />
              </Field>
              <Field label="Disability status">
                <input
                  name="disability_status"
                  value={
                    form.disability_status
                  }
                  onChange={onChange}
                />
              </Field>
              <Field
                label="Prior convictions"
                wide
              >
                <textarea
                  name="prior_convictions"
                  value={
                    form.prior_convictions
                  }
                  onChange={onChange}
                  rows={3}
                />
              </Field>
            </div>
          </EditSection>
          <EditSection title="Management">
            <div className="ja-form-grid">
              <Field label="Status">
                <select
                  name="status"
                  value={form.status}
                  onChange={onChange}
                >
                  {STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {pretty(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </Field>
              <Field
                label="Internal notes"
                wide
              >
                <textarea
                  name="internal_notes"
                  value={
                    form.internal_notes
                  }
                  onChange={onChange}
                  placeholder="Private manager/admin notes…"
                  rows={4}
                />
              </Field>
            </div>
          </EditSection>
        </div>
        <div className="ja-modal-footer">
          <button
            type="button"
            className="ja-danger"
            disabled={saving}
            onClick={onDelete}
          >
            Delete
          </button>
          <div>
            <button
              type="button"
              className="ja-cancel"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ja-save"
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* =========================================================
   SMALL COMPONENTS
========================================================= */
function MiniStat({
  value,
  label,
  active = false,
}) {
  return (
    <div
      className={`ja-mini-stat ${
        active
          ? "is-active"
          : ""
      }`}
    >
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
function FilterPill({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      className={`ja-filter ${
        active
          ? "is-active"
          : ""
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Meta({
  label,
  value,
}) {
  return (
    <div className="ja-meta">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
function EditSection({
  title,
  children,
}) {
  return (
    <section className="ja-edit-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
function Field({
  label,
  wide = false,
  children,
}) {
  return (
    <label
      className={`ja-field ${
        wide
          ? "is-wide"
          : ""
      }`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
/* =========================================================
   HELPERS
========================================================= */
function initials(application) {
  return (
    `${
      application.first_name?.[0] ||
      ""
    }${
      application.last_name?.[0] ||
      ""
    }`.toUpperCase() || "?"
  );
}
function pretty(value) {
  if (!value) return "—";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}
function formatPhone(value) {
  if (!value) return "No phone";
  const digits = String(value).replace(/\D/g, "");
  const local = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  return local.length === 10 ? `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}` : value;
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }
  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}
/* =========================================================
   STYLES
========================================================= */
const styles = `
.applications-theme {
  --ct-muted:#52647b; --ct-line:#cbd8e6;
  min-height:0 !important; width:100%; min-width:0;
  background:#fff !important; color:#172b46 !important;
  color-scheme:light; font-family:inherit;
}
.applications-theme *, .applications-theme *::before, .applications-theme *::after {box-sizing:border-box;}
.applications-theme :is(h2,h3,p) {margin:0; color:inherit; text-shadow:none;}
.applications-theme :is(button,input,select,textarea) {font:inherit; letter-spacing:normal;}
.applications-theme button {cursor:pointer; text-transform:none; box-shadow:none;}
.applications-theme button:disabled {opacity:.6; cursor:wait;}
.applications-theme :is(button,a,input,select,textarea):focus-visible {outline:3px solid #217ca1; outline-offset:3px;}
.applications-theme .ja-shell {width:100%; max-width:1160px; min-width:0; margin:auto; padding:12px; color:#172b46; container-type:inline-size;}
.applications-theme .ja-header {display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px;}
.applications-theme .ja-eyebrow {display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:800; color:#34637b; letter-spacing:.1em; text-transform:uppercase;}
.applications-theme .ja-eyebrow svg {width:13px; height:13px;}
.applications-theme .ja-header h2 {font-size:25px; line-height:1.25; font-weight:800; letter-spacing:-.7px;}
.applications-theme .ja-header > div > p:last-child {font-size:12px; color:#52647b; margin-top:3px;}
.applications-theme .ja-header-stats {display:flex; gap:6px;}
.applications-theme .ja-mini-stat {display:grid; gap:1px; min-width:60px; padding:7px 10px; border:1px solid #dcd6ed; border-radius:13px; background:#f2effa; text-align:center;}
.applications-theme .ja-mini-stat strong {font-size:17px; line-height:1.2; color:#423563;}
.applications-theme .ja-mini-stat span {font-size:10px; color:#584d70;}
.applications-theme .ja-mini-stat.is-active {background:#e5f7f3; border-color:#b6e0d7;}
.applications-theme .ja-mini-stat.is-active :is(strong,span) {color:#195f54;}
.applications-theme .ja-hiring-bar {display:flex; align-items:center; justify-content:space-between; gap:12px; padding:9px 12px; border:1px solid #c6e0df; border-radius:14px; background:#eef9f7; margin-bottom:10px;}
.applications-theme .ja-hiring-left {display:flex; align-items:center; gap:9px; min-width:0;}
.applications-theme .ja-hiring-left strong {display:block; font-size:13px; color:#164f4d;}
.applications-theme .ja-hiring-left small {display:block; font-size:11px; color:#486b69; margin-top:2px;}
.applications-theme .ja-live-dot {width:8px; height:8px; flex-shrink:0; border-radius:50%; background:#b74158;}
.applications-theme .ja-live-dot.is-open {background:#197466; box-shadow:0 0 0 4px #d2ede6;}
.applications-theme .ja-switch {position:relative; width:52px; height:44px; flex-shrink:0; border:0; border-radius:12px; background:transparent; padding:0;}
.applications-theme .ja-switch::before {content:""; position:absolute; inset:9px 0; border-radius:99px; background:#66758a;}
.applications-theme .ja-switch span {position:absolute; width:20px; height:20px; top:12px; left:4px; border-radius:50%; background:white; transition:transform .18s;}
.applications-theme .ja-switch.is-on::before {background:#157566;}
.applications-theme .ja-switch.is-on span {transform:translateX(24px);}
.applications-theme .ja-closed-message {display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap;}
.applications-theme .ja-closed-message input {flex:1 1 220px; min-width:0;}
.applications-theme :is(.ja-closed-message input,.ja-search input,.ja-field input,.ja-field select,.ja-field textarea) {width:100%; min-width:0; border:1px solid #becddd; border-radius:10px; background:#fff; color:#172b46; padding:10px; font-size:16px; min-height:44px; box-shadow:none;}
.applications-theme input::placeholder, .applications-theme textarea::placeholder {color:#67768a; opacity:1;}
.applications-theme :is(.ja-closed-message button,.ja-refresh,.ja-edit,.ja-cancel) {border:1px solid #bfd3e5; background:#edf5fc; color:#234f74; border-radius:10px; padding:8px 12px; min-height:44px; font-size:12px; font-weight:700;}
.applications-theme .ja-alert {display:flex; align-items:center; gap:8px; padding:7px 10px; margin-bottom:10px; border:1px solid; border-radius:12px; font-size:12px; overflow-wrap:anywhere;}
.applications-theme .ja-alert span {flex:1;}
.applications-theme .ja-alert button {border:0; background:transparent; color:inherit; min-width:44px; min-height:44px; font-size:20px;}
.applications-theme .ja-alert.is-error {background:#fff0f2; border-color:#eabec6; color:#9c2940;}
.applications-theme .ja-alert.is-success {background:#eaf8ef; border-color:#b9dcc7; color:#216044;}
.applications-theme .ja-tools {display:flex; gap:7px; margin:10px 0 8px;}
.applications-theme .ja-search {position:relative; flex:1; min-width:0;}
.applications-theme .ja-search > span {position:absolute; left:12px; top:50%; transform:translateY(-50%); font-size:22px; color:#496d87;}
.applications-theme .ja-search input {padding-left:36px; padding-right:44px;}
.applications-theme .ja-search button {position:absolute; right:0; top:0; width:44px; height:44px; border:0; background:transparent; color:#435b73; font-size:20px;}
.applications-theme .ja-refresh {display:flex; align-items:center; justify-content:center; gap:5px; flex-shrink:0;}
.applications-theme .ja-filters {display:flex; gap:6px; overflow-x:auto; max-width:100%; padding:3px 3px 9px; scrollbar-width:thin; scrollbar-color:#bdcddd transparent; overscroll-behavior-x:contain;}
.applications-theme .ja-filter {display:inline-flex; align-items:center; gap:6px; flex-shrink:0; min-height:44px; padding:6px 11px; border:1px solid #d5dfeb; border-radius:99px; background:#f5f7fb; color:#425771; font-size:12px; font-weight:700;}
.applications-theme .ja-filter b {min-width:21px; padding:2px 5px; border-radius:99px; background:#e6edf5; color:inherit; font-size:11px;}
.applications-theme .ja-filter.is-active {background:#224f73; color:#fff; border-color:#224f73;}
.applications-theme .ja-filter.is-active b {background:#3c6487;}
.applications-theme .ja-list {display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:10px; align-items:start; margin-top:3px;}
.applications-theme .ja-card {display:grid; gap:8px; min-width:0; padding:12px; border:1px solid #cfdeeb; border-radius:16px; background:#f8fbff; box-shadow:0 2px 5px #163a5a06;}
.applications-theme .ja-card:nth-child(3n+2) {background:#fbf9ff; border-color:#ded5ee;}
.applications-theme .ja-card:nth-child(3n) {background:#f5fcf9; border-color:#cce5db;}
.applications-theme .ja-card-main {display:flex; align-items:center; gap:9px; width:100%; min-width:0; min-height:44px; padding:0; border:0; background:transparent; color:#172b46; text-align:left;}
.applications-theme .ja-avatar {width:38px; height:38px; display:grid; place-items:center; flex-shrink:0; border:1px solid #b8d6e3; border-radius:13px; background:#dff0f7; color:#285f7b; font-size:13px; font-weight:800;}
.applications-theme .ja-card:nth-child(3n+2) .ja-avatar {background:#eee5fc; color:#674789; border-color:#d8c7ee;}
.applications-theme .ja-card:nth-child(3n) .ja-avatar {background:#ddf3e9; color:#276951; border-color:#b9dfce;}
.applications-theme .ja-card-person {min-width:0;}
.applications-theme .ja-name-row {display:flex; align-items:center; gap:6px;}
.applications-theme .ja-name-row h3 {font-size:15px; font-weight:800; overflow-wrap:anywhere;}
.applications-theme .ja-card-person p {margin-top:2px; color:#55667b; font-size:12px; overflow-wrap:anywhere;}
.applications-theme .ja-new {flex-shrink:0; padding:3px 6px; border-radius:7px; background:#dcefe9; color:#235e4f; font-size:10px; font-weight:800;}
.applications-theme .ja-card-contact {display:grid; gap:0; min-width:0;}
.applications-theme .ja-card-contact a {display:flex; align-items:center; gap:7px; min-width:0; min-height:36px; color:#2b567a; font-size:13px; text-decoration:none; overflow-wrap:anywhere; word-break:break-word;}
.applications-theme .ja-card-contact a:hover {text-decoration:underline;}
.applications-theme .ja-card-contact span {flex-shrink:0; width:18px; color:#456f8a;}
.applications-theme .ja-card-meta {display:grid; grid-template-columns:1fr 1.25fr 1.15fr; gap:6px; padding:8px 0; border-top:1px solid #dce4ed;}
.applications-theme .ja-meta {min-width:0;}
.applications-theme .ja-meta span {display:block; color:#5c6a7d; font-size:10px; margin-bottom:3px;}
.applications-theme .ja-meta strong {display:block; color:#30465e; font-size:11px; font-weight:600; overflow-wrap:anywhere;}
.applications-theme .ja-card-actions {display:flex; align-items:center; gap:6px;}
.applications-theme .ja-status {flex:1; min-width:0; min-height:44px; border:1px solid #b9d0e5; border-radius:10px; padding:7px; background:#e9f2fd; color:#2d537c; font-size:16px; font-weight:600;}
.applications-theme .ja-status.status-hired {background:#e0f4e9; color:#21603e; border-color:#acd4be;}
.applications-theme .ja-status.status-interview {background:#fff2ce; color:#79530b; border-color:#e1cd94;}
.applications-theme .ja-status.status-rejected {background:#fce8ec; color:#993248; border-color:#e5b4c0;}
.applications-theme .ja-status.status-reviewing {background:#ede8fa; color:#604785; border-color:#d4c6e7;}
.applications-theme .ja-status.status-withdrawn {background:#eef0f4; color:#4f5d70; border-color:#cbd2dc;}
.applications-theme .ja-status option {background:#fff; color:#172b46;}
.applications-theme .ja-edit {padding-inline:16px;}
.applications-theme .ja-delete {width:44px; height:44px; border:1px solid #e7c3cb; border-radius:10px; background:#fff0f3; color:#a03850; font-size:22px; flex-shrink:0;}
.applications-theme .ja-state,.applications-theme .ja-access {padding:28px 16px; border:1px dashed #bfcddd; border-radius:16px; background:#f5f8fc; color:#233b56; text-align:center;}
.applications-theme .ja-state svg,.applications-theme .ja-access > svg {width:25px; height:25px; color:#357793;}
.applications-theme .ja-state h3 {font-size:15px; margin:6px 0;}
.applications-theme .ja-state p,.applications-theme .ja-access p {font-size:13px; color:#55677e; margin-top:5px;}
.applications-theme .ja-loader {display:inline-block; width:24px; height:24px; border:3px solid #d3e6ed; border-top-color:#267b8d; border-radius:50%; animation:ja-spin .8s linear infinite;}
@keyframes ja-spin {to {transform:rotate(360deg);}}
.applications-theme .ja-count-footer {color:#596a7f; font-size:11px; text-align:right; margin-top:10px;}
.applications-theme .ja-count-footer strong {color:#304b66;}
.applications-theme .ja-modal-backdrop {position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:16px; background:#152c47a6; color:#172b46;}
.applications-theme .ja-modal {width:100%; max-width:620px; max-height:min(620px,80vh); max-height:min(620px,80dvh); min-height:0; display:flex; flex-direction:column; border:1px solid #ccd9e7; border-radius:20px; overflow:hidden; background:#fff; box-shadow:0 20px 70px #10273c33; outline:none;}
.applications-theme .ja-modal-header {display:flex; align-items:center; justify-content:space-between; gap:8px; padding:14px; flex-shrink:0; border-bottom:1px solid #dce5ee; background:#eef6fb;}
.applications-theme .ja-modal-person {display:flex; gap:10px; align-items:center; min-width:0;}
.applications-theme .ja-modal-person > div {min-width:0;}
.applications-theme .ja-modal-person h2 {font-size:18px; font-weight:800; overflow-wrap:anywhere;}
.applications-theme .ja-modal-person p {font-size:11px; color:#536a80; margin-top:3px;}
.applications-theme .ja-modal-close {width:44px; height:44px; flex-shrink:0; padding:0; border:1px solid #c6d7e5; border-radius:12px; background:#fff; color:#385772; font-size:24px;}
.applications-theme .ja-modal-body {overflow-y:auto; overscroll-behavior:contain; min-height:0; padding:14px; -webkit-overflow-scrolling:touch;}
.applications-theme .ja-edit-section + .ja-edit-section {margin-top:16px; padding-top:12px; border-top:1px solid #dde6ef;}
.applications-theme .ja-edit-section h3 {font-size:13px; color:#345873; margin-bottom:9px; font-weight:800;}
.applications-theme .ja-form-grid {display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px;}
.applications-theme .ja-field {display:flex; flex-direction:column; gap:5px; min-width:0;}
.applications-theme .ja-field > span {font-size:12px; font-weight:600; color:#4a5e75;}
.applications-theme .ja-field.is-wide {grid-column:1/-1;}
.applications-theme .ja-field textarea {resize:vertical; min-height:74px; line-height:1.5;}
.applications-theme .ja-check {grid-column:1/-1; display:flex; align-items:center; gap:8px; min-height:44px; color:#35536a; font-size:13px;}
.applications-theme .ja-check input {width:20px; height:20px; accent-color:#17796a;}
.applications-theme .ja-check > span {display:none;}
.applications-theme .ja-modal-footer {display:flex; justify-content:space-between; align-items:center; gap:8px; flex-shrink:0; padding:10px 14px; padding-bottom:max(10px,env(safe-area-inset-bottom)); border-top:1px solid #d7e2ed; background:#f7fafc;}
.applications-theme .ja-modal-footer > div {display:flex; gap:7px;}
.applications-theme .ja-danger {border:1px solid #e7c3cb; border-radius:10px; background:#fff0f3; color:#a03850; padding:8px 12px; min-height:44px; font-size:12px; font-weight:700;}
.applications-theme .ja-save {border:1px solid #245b7b; border-radius:10px; background:#245b7b; color:#fff; padding:8px 14px; min-height:44px; font-size:12px; font-weight:700;}
@container (max-width:450px) {
  .applications-theme .ja-header {gap:9px;}
  .applications-theme .ja-header-stats {width:100%;}
  .applications-theme .ja-mini-stat {flex:1; display:flex; justify-content:center; align-items:center; gap:6px; padding:7px;}
  .applications-theme .ja-refresh {width:44px; padding:0; font-size:22px;}
  .applications-theme .ja-refresh span {display:none;}
}
@media (max-width:540px) {
  .applications-theme .ja-shell {padding:8px;}
  .applications-theme .ja-modal-backdrop {padding:10px; align-items:center;}
  .applications-theme .ja-modal {max-height:72vh; max-height:72dvh; border-radius:16px;}
  .applications-theme .ja-modal-header,.applications-theme .ja-modal-body {padding:10px;}
  .applications-theme .ja-modal-footer {padding-inline:10px;}
  .applications-theme .ja-modal-footer > div {flex:1; justify-content:flex-end;}
  .applications-theme .ja-modal-footer .ja-save {flex:1; max-width:180px; padding-inline:8px;}
  .applications-theme .ja-card-contact a {min-height:44px;}
}
@media (max-width:380px) {
  .applications-theme .ja-form-grid {grid-template-columns:minmax(0,1fr);}
  .applications-theme .ja-modal-person h2 {font-size:16px;}
  .applications-theme .ja-modal-footer :is(.ja-danger,.ja-cancel) {padding-inline:8px;}
}
@media (prefers-reduced-motion:reduce) {
  .applications-theme *, .applications-theme *::before {animation:none !important; transition:none !important;}
}

/* Inline application reading; the Edit button opens the separate editor. */
.applications-theme .ja-view {display:grid; place-items:center; flex:0 0 44px; width:44px; height:44px; padding:0; border:1px solid #d2c4e8; border-radius:10px; background:#f0eafa; color:#634582;}
.applications-theme .ja-view:hover,.applications-theme .ja-view.is-active {background:#634582; border-color:#634582; color:#fff;}
.applications-theme .ja-application-details[hidden] {display:none;}
.applications-theme .ja-application-details {min-width:0; border-top:1px solid #d4dfea; padding-top:10px; color:#243d57;}
.applications-theme .ja-details-title {display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px;}
.applications-theme .ja-details-title h4 {margin:0; color:#243d57; font-size:14px; font-weight:800;}
.applications-theme .ja-details-title > span {font-size:11px; color:#63758b;}
.applications-theme .ja-detail-group + .ja-detail-group {border-top:1px solid #dce4ed; padding-top:10px; margin-top:10px;}
.applications-theme .ja-detail-group h5 {margin:0 0 8px; font-size:12px; color:#4a5b76; font-weight:800;}
.applications-theme .ja-detail-group dl {display:grid; gap:9px; margin:0;}
.applications-theme .ja-detail-group dl > div {min-width:0;}
.applications-theme .ja-detail-group dt {font-size:11px; line-height:1.4; font-weight:600; color:#5b6d82;}
.applications-theme .ja-detail-group dd {margin:2px 0 0; font-size:13px; line-height:1.5; color:#243d57; white-space:pre-wrap; overflow-wrap:anywhere;}
`;
