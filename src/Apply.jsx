// src/Apply.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";
const API_BASE = "https://cleaningback.onrender.com";
const INITIAL_FORM = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  best_contact_method: "",
  town: "",
  experience: "",
  availability: "",
  reliable_transportation: "",
  work_authorization_status: "",
  citizenship_status: "",
  veteran_status: "",
  disability_status: "",
  prior_convictions: "",
};
export default function Apply() {
  const [form, setForm] = useState(INITIAL_FORM);
const formatPhoneNumber = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
  const [applicationsOpen, setApplicationsOpen] = useState(null);
  const [closedMessage, setClosedMessage] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/job-applications/status`
        );
        if (!mounted) return;
        setApplicationsOpen(
          res.data?.applications_open !== false
        );
        setClosedMessage(
          res.data?.closed_message || ""
        );
      } catch (err) {
        console.error(
          "Failed to load job application status:",
          err
        );
        if (!mounted) return;
        setApplicationsOpen(false);
        setClosedMessage(
          "We couldn't load the application form right now. Please try again shortly."
        );
      } finally {
        if (mounted) {
          setLoadingStatus(false);
        }
      }
    };
    loadStatus();
    return () => {
      mounted = false;
    };
  }, []);
  const requiredComplete = useMemo(() => {
    return Boolean(
      form.first_name.trim() &&
        form.last_name.trim() &&
        form.phone.trim() &&
        form.email.trim() &&
        form.best_contact_method &&
        form.town.trim() &&
        form.availability.trim()
    );
  }, [form]);
const handleChange = (event) => {
  const { name, value } = event.target;
  setForm((prev) => ({
    ...prev,
    [name]: name === "phone" ? formatPhoneNumber(value) : value,
  }));
  if (error) {
    setError("");
  }
};
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!requiredComplete) {
      setError(
        "Please complete all required fields before submitting your application."
      );
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        town: form.town.trim(),
        experience: form.experience.trim() || null,
        availability: form.availability.trim(),
        reliable_transportation:
          form.reliable_transportation === "yes",
        work_authorization_status:
          form.work_authorization_status || null,
        citizenship_status:
          form.citizenship_status || null,
        veteran_status:
          form.veteran_status || null,
        disability_status:
          form.disability_status || null,
        prior_convictions:
          form.prior_convictions.trim() || null,
      };
      await axios.post(
        `${API_BASE}/job-applications`,
        payload
      );
      setSuccess(true);
      setForm(INITIAL_FORM);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(
        "Job application submission failed:",
        err
      );
      const response = err.response?.data;
      if (err.response?.status === 403) {
        setApplicationsOpen(false);
        setClosedMessage(
          response?.message ||
            "Applications are currently closed."
        );
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        return;
      }
      if (response?.fields?.length) {
        setError(
          `Please complete: ${response.fields
            .map((field) => field.replaceAll("_", " "))
            .join(", ")}.`
        );
      } else {
        setError(
          response?.error ||
            "We couldn't submit your application. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };
  const startAnotherApplication = () => {
    setSuccess(false);
    setError("");
    setForm(INITIAL_FORM);
  };
  return (
    <CleaningTheme
      showLoader
      loading={loadingStatus}
      minimumShowTime={4000}
      className="apply-page-theme"
    >
      <style>{applyStyles}</style>
      <main className="apply-page">
        <section className="apply-hero">
          <div className="ct-shell">
            <div className="apply-hero-inner">
              <div className="apply-hero-copy">
                <span className="ct-eyebrow">
                  <CleaningSparkle className="apply-inline-sparkle" />
                  Join Our Team
                </span>
                <h1>
                  Help us make every space feel like
                  <em> a breath of fresh air.</em>
                </h1>
                <p>
                  We're looking for dependable, caring, and
                  detail-oriented people who take pride in
                  creating clean and welcoming spaces.
                </p>
                <div className="apply-hero-tags">
                  <span>✦ Flexible availability</span>
                  <span>✦ Local team</span>
                  <span>✦ Meaningful work</span>
                </div>
              </div>
              <div className="apply-hero-art">
                <SoapBottle ready={!loadingStatus} />
              </div>
            </div>
          </div>
        </section>
        <section className="apply-content ct-shell">
          {loadingStatus ? null : applicationsOpen === false ? (
            <ClosedApplications
              message={closedMessage}
            />
          ) : success ? (
            <SuccessCard
              onReset={startAnotherApplication}
            />
          ) : (
            <>
              <div className="apply-heading">
                <div>
                  <span className="ct-eyebrow">
                    Employment Application
                  </span>
                  <h2>Tell us about yourself.</h2>
                  <p>
                    Fields marked with{" "}
                    <strong className="apply-required">*</strong>{" "}
                    are required.
                  </p>
                </div>
                <div className="apply-open-pill">
                  <span />
                  Applications open
                </div>
              </div>
              <form
                className="apply-form"
                onSubmit={handleSubmit}
              >
                <FormSection
                  number="01"
                  eyebrow="Let's start with the basics"
                  title="Contact Information"
                  description="Tell us how we can reach you."
                >
                  <div className="apply-grid">
                    <Field
                      label="First Name"
                      required
                    >
                      <input
                        type="text"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        autoComplete="given-name"
                        placeholder="First name"
                        required
                      />
                    </Field>
                    <Field
                      label="Last Name"
                      required
                    >
                      <input
                        type="text"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        autoComplete="family-name"
                        placeholder="Last name"
                        required
                      />
                    </Field>
                    <Field
                      label="Phone Number"
                      required
                    >
               <input
  type="tel"
  name="phone"
  value={form.phone}
  onChange={handleChange}
  autoComplete="tel"
  placeholder="(860) 555-0123"
  inputMode="tel"
  maxLength={14}
  required
/>
                    </Field>
                    <Field
                      label="Email"
                      required
                    >
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                      />
                    </Field>
                    <Field
                      label="Best Contact Method"
                      required
                    >
                      <select
                        name="best_contact_method"
                        value={form.best_contact_method}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select one
                        </option>
                        <option value="phone">
                          Phone call
                        </option>
                        <option value="text">
                          Text message
                        </option>
                        <option value="email">
                          Email
                        </option>
                      </select>
                    </Field>
                    <Field
                      label="Town / City"
                      required
                    >
                      <input
                        type="text"
                        name="town"
                        value={form.town}
                        onChange={handleChange}
                        autoComplete="address-level2"
                        placeholder="Your town"
                        required
                      />
                    </Field>
                  </div>
                </FormSection>
                <FormSection
                  number="02"
                  eyebrow="Your experience"
                  title="Work & Availability"
                  description="Experience is welcome, but tell us about yourself even if you're new to professional cleaning."
                >
                  <div className="apply-grid">
                    <Field
                      label="Cleaning or Related Experience"
                      wide
                      helper="Professional cleaning experience is not required."
                    >
                      <textarea
                        name="experience"
                        value={form.experience}
                        onChange={handleChange}
                        placeholder="Tell us about any cleaning, housekeeping, hospitality, customer service, caregiving, maintenance, or other relevant experience..."
                        rows={5}
                      />
                    </Field>
                    <Field
                      label="Availability"
                      wide
                      required
                      helper="Include the days and approximate times you're normally available."
                    >
                      <textarea
                        name="availability"
                        value={form.availability}
                        onChange={handleChange}
                        placeholder="Example: Monday–Friday after 8 AM, Saturdays anytime..."
                        rows={5}
                        required
                      />
                    </Field>
                    <Field
                      label="Do you have reliable transportation?"
                      wide
                      required
                    >
                      <ChoiceCards
                        name="reliable_transportation"
                        value={
                          form.reliable_transportation
                        }
                        onChange={handleChange}
                        options={[
                          {
                            value: "yes",
                            label: "Yes",
                            icon: "✓",
                          },
                          {
                            value: "no",
                            label: "No",
                            icon: "—",
                          },
                        ]}
                      />
                    </Field>
                  </div>
                </FormSection>
                <FormSection
                  number="03"
                  eyebrow="Employment eligibility"
                  title="Additional Information"
                  description="Please answer the following employment-related questions."
                >
                  <div className="apply-grid">
                    <Field
                      label="Work Authorization Status"
                      helper="Select the option that best applies."
                    >
                      <select
                        name="work_authorization_status"
                        value={
                          form.work_authorization_status
                        }
                        onChange={handleChange}
                      >
                        <option value="">
                          Prefer not to answer
                        </option>
                        <option value="authorized">
                          Authorized to work in the U.S.
                        </option>
                        <option value="sponsorship_required">
                          Will require employment sponsorship
                        </option>
                        <option value="other">
                          Other
                        </option>
                      </select>
                    </Field>
                    <Field label="Citizenship Status">
                      <select
                        name="citizenship_status"
                        value={
                          form.citizenship_status
                        }
                        onChange={handleChange}
                      >
                        <option value="">
                          Prefer not to answer
                        </option>
                        <option value="us_citizen">
                          U.S. Citizen
                        </option>
                        <option value="permanent_resident">
                          Permanent Resident
                        </option>
                        <option value="other_authorized">
                          Other work-authorized status
                        </option>
                        <option value="other">
                          Other
                        </option>
                      </select>
                    </Field>
                    <Field
                      label="Prior Convictions"
                      wide
                      helper="Optional. You may provide any information you believe is relevant."
                    >
                      <textarea
                        name="prior_convictions"
                        value={
                          form.prior_convictions
                        }
                        onChange={handleChange}
                        placeholder="Optional"
                        rows={4}
                      />
                    </Field>
                  </div>
                </FormSection>
                <FormSection
                  number="04"
                  eyebrow="Optional"
                  title="Voluntary Self-Identification"
                  description="These questions are optional. You may choose not to answer."
                  optional
                >
                  <div className="apply-grid">
                    <Field label="Veteran Status">
                      <select
                        name="veteran_status"
                        value={
                          form.veteran_status
                        }
                        onChange={handleChange}
                      >
                        <option value="">
                          Prefer not to answer
                        </option>
                        <option value="veteran">
                          I am a veteran
                        </option>
                        <option value="not_veteran">
                          I am not a veteran
                        </option>
                      </select>
                    </Field>
                    <Field label="Disability Status">
                      <select
                        name="disability_status"
                        value={
                          form.disability_status
                        }
                        onChange={handleChange}
                      >
                        <option value="">
                          Prefer not to answer
                        </option>
                        <option value="yes">
                          Yes
                        </option>
                        <option value="no">
                          No
                        </option>
                      </select>
                    </Field>
                  </div>
                </FormSection>
                {error && (
                  <div
                    className="apply-alert apply-alert-error"
                    role="alert"
                  >
                    <span className="apply-alert-icon">
                      !
                    </span>
                    <div>
                      <strong>
                        Please check your application.
                      </strong>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                <div className="apply-submit-card">
                  <div>
                    <span className="ct-eyebrow">
                      Ready?
                    </span>
                    <h3>
                      Send us your application.
                    </h3>
                    <p>
                      Review your information before
                      submitting. Our team can contact you
                      using your preferred method.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="ct-btn apply-submit"
                    disabled={
                      submitting ||
                      !requiredComplete
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="apply-spinner" />
                        Sending application...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <span aria-hidden="true">
                          →
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </CleaningTheme>
  );
}
function SoapBottle({ ready }) {
  const [pumpCount, setPumpCount] = useState(0);

  useEffect(() => {
    if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Let the page's four-second intro finish before the first little pump.
    const timer = window.setTimeout(() => setPumpCount(count => count || 1), 4300);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div className="apply-window apply-soap-card">
      <span className="apply-soap-badge">✦ A little fresh-start magic</span>
      <button
        type="button"
        className="apply-soap-button"
        onClick={() => setPumpCount(count => count + 1)}
        aria-label="Pump the soap bottle and replay the bubbles"
      >
        <svg key={pumpCount} className={`apply-soap-scene${pumpCount ? " is-pumping" : ""}`} viewBox="0 0 280 245" aria-hidden="true" focusable="false">
          <circle cx="141" cy="130" r="98" fill="#173f52" />
          <circle cx="141" cy="130" r="84" fill="none" stroke="#83e8dd" strokeOpacity=".14" strokeDasharray="3 9" />
          <ellipse cx="142" cy="220" rx="85" ry="10" fill="#051e31" opacity=".6" />
          <g fill="#b8f5eb" opacity=".8">
            <path d="m57 87 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" />
            <path d="m207 38 2-6 2 6 6 2-6 2-2 6-2-6-6-2Z" />
            <circle cx="69" cy="162" r="4" fill="none" stroke="#b8f5eb" strokeWidth="2" />
          </g>
          <g className="apply-soap-body">
            <rect x="118" y="77" width="32" height="32" rx="8" fill="#a2ded9" />
            <rect x="108" y="94" width="51" height="14" rx="6" fill="#e2fff4" />
            <rect x="84" y="103" width="99" height="112" rx="31" fill="#63cbb2" stroke="#b6ffe1" strokeWidth="2" />
            <path d="M99 128q0-13 14-16h30" fill="none" stroke="#e2fff4" strokeWidth="8" strokeLinecap="round" opacity=".6" />
            <path d="M171 135v46q0 23-27 23h-29" fill="none" stroke="#329d99" strokeWidth="8" strokeLinecap="round" opacity=".4" />
            <rect x="100" y="135" width="67" height="62" rx="21" fill="#f2fff6" />
            <ellipse cx="112" cy="167" rx="7" ry="4" fill="#f7afb9" />
            <ellipse cx="155" cy="167" rx="7" ry="4" fill="#f7afb9" />
            <g className="apply-soap-eyes" fill="#225461">
              <ellipse cx="119" cy="158" rx="3.3" ry="4.3" />
              <ellipse cx="148" cy="158" rx="3.3" ry="4.3" />
            </g>
            <path d="M126 169q8 9 16 0" fill="none" stroke="#225461" strokeWidth="2.5" strokeLinecap="round" />
            <text x="133.5" y="187" textAnchor="middle" fill="#397968" fontSize="8" fontFamily="system-ui,sans-serif" fontWeight="800" letterSpacing="2">FRESH</text>
          </g>
          <g className="apply-soap-pump">
            <rect x="126" y="68" width="15" height="28" rx="5" fill="#d3efec" />
            <path d="M115 55h81q18 0 18 16v5h-16v-4h-83a8 8 0 0 1 0-17Z" fill="#f5dbed" stroke="#fff0fa" strokeWidth="2" />
            <path d="M119 60h73" stroke="#fff7ff" strokeWidth="3" strokeLinecap="round" />
            <path d="M199 76h14" stroke="#b88cb2" strokeWidth="3" strokeLinecap="round" />
          </g>
          <path className="apply-soap-stream" d="M207 84C219 110 205 129 213 149S209 179 212 194" pathLength="1" fill="none" stroke="#e3fff4" strokeWidth="6" strokeLinecap="round" />
          <g className="apply-soap-foam" fill="#e3fff4" stroke="#a5e6d6" strokeWidth="1.2">
            <ellipse cx="213" cy="211" rx="24" ry="7" />
            <circle cx="199" cy="203" r="9" />
            <circle cx="211" cy="198" r="12" />
            <circle cx="225" cy="204" r="9" />
            <circle cx="215" cy="193" r="5" fill="#fff" stroke="none" />
          </g>
          {[{ x: 207, y: 180, r: 8, dx: "20px", dy: "-58px", delay: "0ms" }, { x: 225, y: 193, r: 6, dx: "19px", dy: "-86px", delay: "140ms" }, { x: 199, y: 187, r: 5, dx: "-12px", dy: "-45px", delay: "270ms" }].map((bubble, index) => (
            <g key={index} className="apply-soap-bubble" style={{ "--bubble-x": bubble.dx, "--bubble-y": bubble.dy, "--bubble-delay": bubble.delay }}>
              <circle cx={bubble.x} cy={bubble.y} r={bubble.r} fill="#b2f9ee" fillOpacity=".25" stroke="#d9fff6" strokeWidth="1.5" />
              <circle cx={bubble.x - 2} cy={bubble.y - 2} r="1.6" fill="#fff" />
            </g>
          ))}
        </svg>
        <span className="apply-soap-hint">Tap for a little bubbly joy <span aria-hidden="true">↻</span></span>
      </button>
      <div className="apply-art-copy">
        <small>Now hiring</small>
        <strong>Fresh starts begin here.</strong>
      </div>
    </div>
  );
}

function FormSection({
  number,
  eyebrow,
  title,
  description,
  optional = false,
  children,
}) {
  return (
    <section className="ct-card apply-section-card">
      <div className="apply-section-header">
        <div className="apply-section-number">
          {number}
        </div>
        <div>
          <div className="apply-section-kicker">
            <span>{eyebrow}</span>
            {optional && (
              <span className="apply-optional">
                Optional
              </span>
            )}
          </div>
          <h3>{title}</h3>
          {description && (
            <p>{description}</p>
          )}
        </div>
      </div>
      <div className="apply-section-body">
        {children}
      </div>
    </section>
  );
}
function Field({
  label,
  helper,
  required,
  wide,
  children,
}) {
  return (
    <label
      className={`apply-field ${
        wide ? "apply-field-wide" : ""
      }`}
    >
      <span className="apply-label">
        {label}
        {required && (
          <span
            className="apply-required"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </span>
      {helper && (
        <span className="apply-helper">
          {helper}
        </span>
      )}
      {children}
    </label>
  );
}
function ChoiceCards({
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div className="apply-choice-grid">
      {options.map((option) => (
        <label
          key={option.value}
          className={`apply-choice ${
            value === option.value
              ? "is-selected"
              : ""
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            required
          />
          <span className="apply-choice-icon">
            {option.icon}
          </span>
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
function ClosedApplications({ message }) {
  return (
    <div className="apply-state-card ct-card">
      <div className="apply-state-icon">
        <CleaningSparkle />
      </div>
      <span className="ct-eyebrow">
        Careers
      </span>
      <h2>
        Applications are currently closed.
      </h2>
      <p>
        {message ||
          "We're not accepting applications at this time, but we appreciate your interest in joining A Breath of Fresh Air Cleaning Services."}
      </p>
      <div className="apply-state-line" />
      <small>
        Please check back again for future
        opportunities.
      </small>
    </div>
  );
}
function SuccessCard({ onReset }) {
  return (
    <div className="apply-state-card apply-success-card ct-card">
      <div className="apply-success-check">
        ✓
      </div>
      <span className="ct-eyebrow">
        Application received
      </span>
      <h2>
        Thank you for applying!
      </h2>
      <p>
        Your application has been sent to A
        Breath of Fresh Air Cleaning Services.
        If we'd like to move forward, we'll
        reach out using the contact information
        you provided.
      </p>
      <button
        type="button"
        className="ct-btn"
        onClick={onReset}
      >
        Submit Another Application
      </button>
    </div>
  );
}
const applyStyles = `
.apply-page{
  min-height:100vh;
  padding-bottom:80px;
}
.apply-hero{
  position:relative;
  overflow:hidden;
  border-bottom:1px solid var(--ct-line);
  background:
    radial-gradient(circle at 78% 45%,#67e8f91a,transparent 27%),
    radial-gradient(circle at 20% 30%,#6ee7b710,transparent 30%),
    linear-gradient(180deg,#08152a 0%,#06101f 100%);
}
.apply-hero::after{
  content:"";
  position:absolute;
  inset:auto 0 0;
  height:1px;
  background:linear-gradient(
    90deg,
    transparent,
    #67e8f980,
    transparent
  );
}
.apply-hero-inner{
  min-height:410px;
  display:grid;
  grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);
  align-items:center;
  gap:55px;
  padding:72px 0 58px;
}
.apply-hero-copy{
  position:relative;
  z-index:2;
  max-width:720px;
}
.apply-inline-sparkle{
  width:13px;
  height:13px;
}
.apply-hero h1{
  max-width:760px;
  margin:15px 0 19px;
  font-size:clamp(42px,6vw,72px);
  line-height:.98;
}
.apply-hero h1 em{
  display:inline;
  font-style:italic;
}
.apply-hero-copy > p{
  max-width:660px;
  color:var(--ct-muted);
  font-size:15px;
  line-height:1.8;
}
.apply-hero-tags{
  display:flex;
  flex-wrap:wrap;
  gap:9px;
  margin-top:28px;
}
.apply-hero-tags span{
  display:inline-flex;
  align-items:center;
  min-height:34px;
  padding:7px 13px;
  border:1px solid #7dd3fc2d;
  border-radius:99px;
  background:#0f2340aa;
  color:#d5f6ff;
  font-size:11px;
  font-weight:650;
}
.apply-hero-art{
  display:flex;
  justify-content:flex-end;
}
.apply-window{
  width:min(100%,330px);
  aspect-ratio:1 / .96;
  position:relative;
  overflow:hidden;
  border:1px solid #7dd3fc42;
  border-radius:32px;
  background:
    linear-gradient(145deg,#123457,#06101e);
  box-shadow:
    inset 0 0 40px #8cefff0a,
    0 25px 80px #0007;
}
.apply-window::before{
  content:"";
  position:absolute;
  inset:20px;
  border-radius:22px;
  border:1px solid #c5f8ff1a;
  background:
    linear-gradient(110deg,#ffffff0d,transparent 35%);
}
.apply-window-shine{
  position:absolute;
  width:200px;
  height:500px;
  top:-120px;
  left:30px;
  transform:rotate(28deg);
  background:linear-gradient(
    90deg,
    transparent,
    #c4ffff0c,
    transparent
  );
}
.apply-art-copy{
  position:absolute;
  left:31px;
  bottom:27px;
  z-index:4;
}
.apply-art-copy small{
  display:block;
  color:var(--ct-teal);
  font-size:9px;
  text-transform:uppercase;
  letter-spacing:.19em;
  font-weight:800;
  margin-bottom:6px;
}
.apply-art-copy strong{
  display:block;
  font:400 25px/1.05 Georgia,serif;
}
.apply-content{
  position:relative;
  z-index:3;
  padding-top:52px;
}
.apply-heading{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:25px;
  margin-bottom:23px;
}
.apply-heading h2{
  margin:5px 0 8px;
  font-size:clamp(34px,4vw,48px);
}
.apply-heading p{
  color:var(--ct-muted);
  font-size:13px;
}
.apply-required{
  color:#67e8f9;
}
.apply-open-pill{
  display:inline-flex;
  align-items:center;
  gap:9px;
  flex-shrink:0;
  padding:9px 14px;
  border:1px solid #6ee7b745;
  background:#0d2d2a88;
  border-radius:99px;
  color:#b7f7d9;
  font-size:11px;
  font-weight:700;
}
.apply-open-pill span{
  width:7px;
  height:7px;
  border-radius:50%;
  background:#6ee7b7;
  box-shadow:0 0 11px #6ee7b7;
}
.apply-form{
  display:grid;
  gap:18px;
}
.apply-section-card{
  overflow:hidden;
}
.apply-section-header{
  display:grid;
  grid-template-columns:auto minmax(0,1fr);
  gap:19px;
  padding:23px 25px 19px;
  border-bottom:1px solid var(--ct-line);
  background:linear-gradient(
    90deg,
    #12305070,
    transparent
  );
}
.apply-section-number{
  width:42px;
  height:42px;
  display:grid;
  place-items:center;
  flex-shrink:0;
  border:1px solid #67e8f944;
  border-radius:13px;
  background:#0b2039;
  color:#8cecf5;
  font-size:10px;
  font-weight:850;
  letter-spacing:.08em;
}
.apply-section-kicker{
  display:flex;
  align-items:center;
  gap:9px;
  color:var(--ct-teal);
  font-size:9px;
  letter-spacing:.14em;
  text-transform:uppercase;
  font-weight:800;
}
.apply-optional{
  padding:3px 7px;
  border:1px solid #7dd3fc32;
  border-radius:99px;
  color:#bdd5e5;
  font-size:8px;
}
.apply-section-header h3{
  margin:3px 0 4px;
  font-family:Georgia,"Times New Roman",serif;
  font-size:24px;
  font-weight:400;
}
.apply-section-header p{
  max-width:760px;
  color:var(--ct-muted);
  font-size:12px;
  line-height:1.55;
}
.apply-section-body{
  padding:24px 25px 27px;
}
.apply-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:19px;
}
.apply-field{
  display:flex;
  flex-direction:column;
  gap:7px;
  min-width:0;
}
.apply-field-wide{
  grid-column:1 / -1;
}
.apply-label{
  color:#ecfbff;
  font-size:11px;
  font-weight:700;
}
.apply-helper{
  color:#839eb2;
  font-size:10px;
  line-height:1.45;
  margin-top:-3px;
}
.apply-field input,
.apply-field select,
.apply-field textarea{
  width:100%;
  border:1px solid #75cce52c;
  border-radius:13px;
  background:#061328d9;
  color:#effcff;
  outline:none;
  padding:12px 13px;
  font:500 13px/1.4 Inter,system-ui,sans-serif;
  transition:
    border-color .2s,
    box-shadow .2s,
    background .2s;
}
.apply-field input,
.apply-field select{
  min-height:46px;
}
.apply-field textarea{
  resize:vertical;
  min-height:108px;
}
.apply-field input::placeholder,
.apply-field textarea::placeholder{
  color:#66839a;
}
.apply-field input:focus,
.apply-field select:focus,
.apply-field textarea:focus{
  border-color:#67e8f980;
  background:#081a31;
  box-shadow:
    0 0 0 3px #67e8f912,
    0 0 22px #67e8f90d;
}
.apply-field select{
  appearance:auto;
}
.apply-choice-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
}
.apply-choice{
  position:relative;
  min-height:62px;
  display:flex;
  align-items:center;
  gap:12px;
  padding:12px 15px;
  border:1px solid #74cde52b;
  border-radius:15px;
  background:#07162b;
  color:#bcd2df;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
  transition:.2s;
}
.apply-choice input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}
.apply-choice:hover{
  border-color:#67e8f955;
  background:#0b1e35;
}
.apply-choice.is-selected{
  border-color:#6ee7b777;
  background:
    linear-gradient(
      135deg,
      #123d416e,
      #0b2135
    );
  color:#e8ffff;
  box-shadow:inset 0 0 20px #6ee7b70b;
}
.apply-choice-icon{
  width:28px;
  height:28px;
  display:grid;
  place-items:center;
  border-radius:9px;
  background:#15334d;
  color:#8bf3de;
  font-size:13px;
}
.apply-choice.is-selected
.apply-choice-icon{
  background:#17493f;
  color:#8ff4cf;
}
.apply-alert{
  display:flex;
  align-items:flex-start;
  gap:14px;
  padding:16px 18px;
  border-radius:17px;
}
.apply-alert-error{
  border:1px solid #fb71854f;
  background:#4815224d;
}
.apply-alert-icon{
  width:30px;
  height:30px;
  display:grid;
  place-items:center;
  flex-shrink:0;
  border-radius:50%;
  background:#fb718526;
  color:#fda4af;
  font-weight:900;
}
.apply-alert strong{
  display:block;
  margin-bottom:3px;
  color:#ffe7ec;
  font-size:12px;
}
.apply-alert p{
  color:#f5b7c2;
  font-size:11px;
  line-height:1.5;
}
.apply-submit-card{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:28px;
  margin-top:5px;
  padding:25px 27px;
  border:1px solid #67e8f936;
  border-radius:22px;
  background:
    radial-gradient(
      circle at 85% 40%,
      #6ee7b70e,
      transparent 25%
    ),
    linear-gradient(
      135deg,
      #102b49,
      #071224
    );
}
.apply-submit-card h3{
  margin:4px 0 4px;
  font:400 24px Georgia,serif;
}
.apply-submit-card p{
  max-width:600px;
  color:var(--ct-muted);
  font-size:11px;
  line-height:1.6;
}
.apply-submit{
  min-width:210px;
  flex-shrink:0;
}
.apply-submit:disabled{
  opacity:.45;
  cursor:not-allowed;
  transform:none;
}
.apply-spinner{
  width:15px;
  height:15px;
  border:2px solid #06202f55;
  border-top-color:#06202f;
  border-radius:50%;
  animation:applySpin .8s linear infinite;
}
@keyframes applySpin{
  to{transform:rotate(360deg)}
}
.apply-state-card{
  position:relative;
  overflow:hidden;
  max-width:720px;
  margin:30px auto;
  padding:54px 42px;
  text-align:center;
}
.apply-state-card::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(
      circle at 50% 0,
      #67e8f916,
      transparent 40%
    );
}
.apply-state-card > *{
  position:relative;
}
.apply-state-icon{
  width:72px;
  height:72px;
  display:grid;
  place-items:center;
  margin:0 auto 20px;
  border:1px solid #67e8f93d;
  border-radius:22px;
  background:#102e4b;
  color:#8cecf5;
}
.apply-state-icon svg{
  width:31px;
}
.apply-state-card h2{
  margin:10px 0 13px;
  font-size:clamp(34px,5vw,48px);
}
.apply-state-card > p{
  max-width:580px;
  margin:0 auto;
  color:var(--ct-muted);
  font-size:13px;
  line-height:1.75;
}
.apply-state-line{
  width:70px;
  height:1px;
  margin:27px auto 17px;
  background:#67e8f94a;
}
.apply-state-card small{
  color:#819daf;
  font-size:10px;
}
.apply-success-card{
  border-color:#6ee7b74d;
}
.apply-success-check{
  width:74px;
  height:74px;
  display:grid;
  place-items:center;
  margin:0 auto 20px;
  border:1px solid #6ee7b766;
  border-radius:50%;
  background:#123d35;
  color:#89f4c9;
  box-shadow:0 0 35px #6ee7b718;
  font-size:31px;
  font-weight:800;
}
.apply-success-card .ct-btn{
  margin-top:27px;
}
@media(max-width:800px){
  .apply-hero-inner{
    grid-template-columns:1fr;
    min-height:auto;
    gap:33px;
    padding:58px 0 42px;
  }
  .apply-hero-art{
    justify-content:flex-start;
  }
  .apply-window{
    width:100%;
    max-width:none;
    height:210px;
    aspect-ratio:auto;
  }
  .apply-art-copy{
    left:24px;
    bottom:22px;
  }
  .apply-heading{
    align-items:flex-start;
    flex-direction:column;
  }
}
@media(max-width:640px){
  .apply-page{
    padding-bottom:45px;
  }
  .apply-hero-inner{
    padding:44px 0 33px;
  }
  .apply-hero h1{
    font-size:42px;
  }
  .apply-hero-tags{
    gap:6px;
    margin-top:20px;
  }
  .apply-hero-tags span{
    min-height:30px;
    padding:5px 10px;
    font-size:9px;
  }
  .apply-window{
    height:180px;
    border-radius:22px;
  }
  .apply-content{
    padding-top:32px;
  }
  .apply-heading{
    margin-bottom:17px;
  }
  .apply-heading h2{
    font-size:34px;
  }
  .apply-section-header{
    gap:12px;
    padding:18px 16px 16px;
  }
  .apply-section-number{
    width:35px;
    height:35px;
    border-radius:10px;
    font-size:9px;
  }
  .apply-section-header h3{
    font-size:21px;
  }
  .apply-section-header p{
    font-size:10px;
  }
  .apply-section-body{
    padding:18px 16px 20px;
  }
  .apply-grid{
    grid-template-columns:1fr;
    gap:15px;
  }
  .apply-field-wide{
    grid-column:auto;
  }
  .apply-field input,
  .apply-field select{
    min-height:45px;
  }
  .apply-choice-grid{
    gap:8px;
  }
  .apply-choice{
    min-height:54px;
    padding:10px 12px;
  }
  .apply-submit-card{
    align-items:stretch;
    flex-direction:column;
    padding:20px 18px;
  }
  .apply-submit{
    width:100%;
    min-width:0;
  }
  .apply-state-card{
    margin:12px auto;
    padding:38px 20px;
  }
}
@media(max-width:390px){
  .apply-choice-grid{
    grid-template-columns:1fr;
  }
  .apply-hero h1{
    font-size:37px;
  }
}
@media(prefers-reduced-motion:reduce){
  .apply-spinner{
    animation:none;
  }
}

/* Keep the hero clear of the fixed navbar; override this variable for a taller nav. */
.apply-page-theme .apply-hero-inner {
  padding-top:calc(var(--apply-nav-offset, 88px) + 32px + env(safe-area-inset-top, 0px));
}
.apply-page-theme .apply-hero-art {min-width:0; padding-top:12px;}
.apply-page-theme .apply-soap-card {
  box-sizing:border-box; display:flex; flex-direction:column; align-items:center;
  width:100%; max-width:330px; height:auto; aspect-ratio:auto; padding:18px 12px 20px;
  border-radius:32px; background:linear-gradient(150deg,#173f58,#102739);
  border-color:#77d9cf55; box-shadow:0 18px 50px #0004, inset 0 1px 0 #d5fff31c;
}
.apply-page-theme .apply-soap-card::before {inset:9px; border-radius:24px; pointer-events:none;}
.apply-page-theme .apply-soap-badge {position:relative; font:700 10px/1.5 system-ui,sans-serif; letter-spacing:.04em; color:#c9f7ec; padding:5px 10px; border-radius:99px; background:#ffffff09;}
.apply-page-theme .apply-soap-button {
  position:relative; display:flex; flex-direction:column; align-items:center; width:100%; min-width:0;
  border:0; padding:0 0 8px; margin:0; border-radius:22px; background:transparent; color:#c5e7ed;
  box-shadow:none; cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
}
.apply-page-theme .apply-soap-button:hover {background:#ffffff04; transform:none;}
.apply-page-theme .apply-soap-button:focus-visible {outline:3px solid #9ef1da; outline-offset:2px;}
.apply-page-theme .apply-soap-scene {display:block; width:100%; max-width:265px; height:auto; overflow:visible;}
.apply-page-theme .apply-soap-hint {font:500 11px/1.5 system-ui,sans-serif; color:#c5e7ed;}
.apply-page-theme .apply-soap-hint > span {display:inline-block; margin-left:3px; font-size:15px; color:#a7f3d0;}
.apply-page-theme .apply-soap-card .apply-art-copy {position:relative; left:auto; bottom:auto; text-align:center; padding-top:10px; pointer-events:none;}
.apply-page-theme .apply-soap-card .apply-art-copy small {color:#9be9d4; margin-bottom:5px; font-size:9px;}
.apply-page-theme .apply-soap-card .apply-art-copy strong {font:400 22px/1.2 Georgia,serif; color:#f0fff9;}
.apply-page-theme .apply-soap-stream {stroke-dasharray:1; stroke-dashoffset:1; opacity:0;}
.apply-page-theme :is(.apply-soap-foam,.apply-soap-bubble) {opacity:0;}
.apply-page-theme .apply-soap-foam {transform-box:fill-box; transform-origin:center bottom;}
.apply-page-theme .apply-soap-body {transform-origin:134px 215px;}
.apply-page-theme .is-pumping .apply-soap-pump {animation:applySoapPump 2.4s ease-in-out both;}
.apply-page-theme .is-pumping .apply-soap-body {animation:applySoapSquish 2.4s ease-in-out both;}
.apply-page-theme .is-pumping .apply-soap-stream {animation:applySoapPour 2.4s ease-out both;}
.apply-page-theme .is-pumping .apply-soap-foam {animation:applySoapFoam 2.4s ease-out both;}
.apply-page-theme .is-pumping .apply-soap-bubble {animation:applySoapBubble 2.4s ease-out var(--bubble-delay) both;}
@keyframes applySoapPump {0%,8%,58%,100%{transform:translateY(0)} 22%,40%{transform:translateY(8px)}}
@keyframes applySoapSquish {0%,12%,55%,100%{transform:scale(1)} 26%,38%{transform:scale(1.025,.975)}}
@keyframes applySoapPour {0%,20%{stroke-dashoffset:1;opacity:0} 24%{opacity:1} 48%,52%{stroke-dashoffset:0;opacity:1} 65%,100%{stroke-dashoffset:-1;opacity:0}}
@keyframes applySoapFoam {0%,43%{opacity:0;transform:scale(.25)} 57%,80%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(.95)}}
@keyframes applySoapBubble {0%,43%{opacity:0;transform:translate(0,0)} 53%{opacity:.9} 95%,100%{opacity:0;transform:translate(var(--bubble-x),var(--bubble-y))}}
@media(max-width:800px) {
  .apply-page-theme .apply-hero-art {justify-content:center; padding-top:4px;}
  .apply-page-theme .apply-soap-card {max-width:330px; padding:14px 12px 16px; border-radius:26px;}
  .apply-page-theme .apply-soap-scene {max-width:220px;}
  .apply-page-theme .apply-hero-inner {gap:20px;}
}
@media(prefers-reduced-motion:reduce) {
  .apply-page-theme .is-pumping :is(.apply-soap-pump,.apply-soap-body,.apply-soap-stream,.apply-soap-bubble) {animation:none;}
  .apply-page-theme .is-pumping .apply-soap-foam {animation:applySoapGentle 1.2s ease-out both; transform:none;}
}
@keyframes applySoapGentle {0%,100%{opacity:0} 20%,80%{opacity:1}}
`;
