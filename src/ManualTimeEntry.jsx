import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import toast from "react-hot-toast";
import CleaningTheme from "./CleaningTheme";

export default function ManualTimeEntry() {
  const { authAxios } = useAdmin();

  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({
    staff_id: "",
    clock_in_at: "",
    clock_out_at: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    const loadStaff = async () => {
      setLoadingStaff(true);

      try {
        const res = await authAxios.get("/staff/all");
        setStaffList(res.data || []);
      } catch (err) {
        toast.error("Failed to load staff list");
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, [authAxios]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.staff_id || !form.clock_in_at || !form.clock_out_at) {
      toast.error("Please complete all fields.");
      return;
    }

    if (new Date(form.clock_out_at) <= new Date(form.clock_in_at)) {
      toast.error("Clock out must be after clock in.");
      return;
    }

    setLoading(true);

    try {
      await authAxios.post("/admin/staff-time-entry", form);

      toast.success("Time entry added successfully!");

      setForm({
        staff_id: "",
        clock_in_at: "",
        clock_out_at: "",
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Failed to create time entry.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedStaff = staffList.find(
    (staff) => String(staff.id) === String(form.staff_id)
  );

  const selectedStaffName = selectedStaff
    ? selectedStaff.profile?.first_name &&
      selectedStaff.profile?.last_name
      ? `${selectedStaff.profile.first_name} ${selectedStaff.profile.last_name}`
      : selectedStaff.username
    : null;

  return (
    <CleaningTheme>
      <main className="mte-page">
        <section className="mte-shell">
          {/* Header */}
          <header className="mte-header">
            <div>
              <span className="ct-eyebrow">
                ✨ Administration · Timekeeping
              </span>

              <h1>
                Manual <em>Time Entry</em>
              </h1>

              <p>
                Add or correct an employee shift while keeping your
                time records clean, organized, and accurate.
              </p>
            </div>

            <div className="mte-header-icon" aria-hidden="true">
              <span>🕒</span>
              <i>✦</i>
            </div>
          </header>

          {/* Form card */}
          <section className="ct-card mte-card">
            <div className="mte-card-heading">
              <div className="mte-icon-box">
                <span aria-hidden="true">🧹</span>
              </div>

              <div>
                <span className="mte-kicker">
                  Shift Information
                </span>

                <h2>Create a Time Entry</h2>

                <p>
                  Select the staff member and enter their clock-in
                  and clock-out times.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mte-form"
            >
              {/* Staff */}
              <div className="mte-field">
                <label htmlFor="staff_id">
                  <span>Staff Member</span>
                  <small>Required</small>
                </label>

                <div className="mte-input-wrap">
                  <span
                    className="mte-field-icon"
                    aria-hidden="true"
                  >
                    👤
                  </span>

                  <select
                    id="staff_id"
                    name="staff_id"
                    value={form.staff_id}
                    onChange={handleChange}
                    disabled={loadingStaff || loading}
                  >
                    <option value="">
                      {loadingStaff
                        ? "Loading staff..."
                        : "Select a staff member"}
                    </option>

                    {staffList.map((staff) => {
                      const name =
                        staff.profile?.first_name &&
                        staff.profile?.last_name
                          ? `${staff.profile.first_name} ${staff.profile.last_name}`
                          : staff.username;

                      return (
                        <option
                          key={staff.id}
                          value={staff.id}
                        >
                          {name}
                        </option>
                      );
                    })}
                  </select>

                  <span
                    className="mte-select-arrow"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </div>
              </div>

              {/* Times */}
              <div className="mte-time-grid">
                <div className="mte-field">
                  <label htmlFor="clock_in_at">
                    <span>Clock In</span>
                    <small>Required</small>
                  </label>

                  <div className="mte-input-wrap">
                    <span
                      className="mte-field-icon"
                      aria-hidden="true"
                    >
                      ↪
                    </span>

                    <input
                      id="clock_in_at"
                      type="datetime-local"
                      name="clock_in_at"
                      value={form.clock_in_at}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="mte-field">
                  <label htmlFor="clock_out_at">
                    <span>Clock Out</span>
                    <small>Required</small>
                  </label>

                  <div className="mte-input-wrap">
                    <span
                      className="mte-field-icon"
                      aria-hidden="true"
                    >
                      ↩
                    </span>

                    <input
                      id="clock_out_at"
                      type="datetime-local"
                      name="clock_out_at"
                      value={form.clock_out_at}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              {(selectedStaffName ||
                form.clock_in_at ||
                form.clock_out_at) && (
                <div className="mte-summary">
                  <div className="mte-summary-sparkle">
                    ✦
                  </div>

                  <div className="mte-summary-copy">
                    <span>Entry Preview</span>

                    <strong>
                      {selectedStaffName ||
                        "Choose a staff member"}
                    </strong>

                    <p>
                      {form.clock_in_at
                        ? `Clock in: ${formatDateTime(
                            form.clock_in_at
                          )}`
                        : "Add a clock-in time"}

                      <span> · </span>

                      {form.clock_out_at
                        ? `Clock out: ${formatDateTime(
                            form.clock_out_at
                          )}`
                        : "Add a clock-out time"}
                    </p>
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="mte-actions">
                <button
                  type="submit"
                  className="ct-btn mte-submit"
                  disabled={
                    loading ||
                    loadingStaff ||
                    !form.staff_id ||
                    !form.clock_in_at ||
                    !form.clock_out_at
                  }
                >
                  {loading ? (
                    <>
                      <span className="mte-spinner" />
                      Saving Entry...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✨</span>
                      Create Time Entry
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <div className="mte-tip">
            <span aria-hidden="true">🫧</span>

            <p>
              Double-check the date and time before saving.
              Manual entries are added directly to the employee's
              time history.
            </p>
          </div>
        </section>

        <style>{`
          .mte-page {
            min-height: 100vh;
            padding: 58px 20px 80px;
          }

          .mte-shell {
            width: min(760px, 100%);
            margin: 0 auto;
          }

          /* -----------------------------
             Header
          ------------------------------ */

          .mte-header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 28px;
            margin-bottom: 28px;
          }

          .mte-header h1 {
            margin-top: 10px;
            font-size: clamp(36px, 6vw, 56px);
            line-height: 1.02;
            color: #f0fbff;
          }

          .mte-header h1 em {
            display: block;
          }

          .mte-header p {
            max-width: 590px;
            margin-top: 16px;
            color: var(--ct-muted);
            line-height: 1.7;
            font-size: 14px;
          }

          .mte-header-icon {
            position: relative;
            flex: 0 0 auto;
            width: 94px;
            height: 94px;
            display: grid;
            place-items: center;
            border-radius: 30px;
            border: 1px solid #7dd3fc3d;
            background:
              radial-gradient(
                circle at 30% 20%,
                #67e8f92a,
                transparent 58%
              ),
              #0b1930cc;
            box-shadow:
              inset 0 1px 0 #ffffff12,
              0 18px 50px #00000030;
            backdrop-filter: blur(16px);
          }

          .mte-header-icon > span {
            font-size: 38px;
            filter: drop-shadow(
              0 6px 12px #00000045
            );
          }

          .mte-header-icon i {
            position: absolute;
            top: -8px;
            right: -5px;
            color: #a7fff0;
            font-style: normal;
            font-size: 25px;
            animation: mteSparkle 2s ease-in-out infinite;
          }

          /* -----------------------------
             Main card
          ------------------------------ */

          .mte-card {
            position: relative;
            overflow: hidden;
            padding: clamp(22px, 4vw, 36px);
            border-radius: 30px;
            box-shadow:
              0 28px 70px #00000038,
              inset 0 1px 0 #ffffff0c;
          }

          .mte-card::before {
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
            opacity: 0.8;
          }

          .mte-card::after {
            content: "";
            position: absolute;
            width: 260px;
            height: 260px;
            top: -150px;
            right: -120px;
            border-radius: 50%;
            background: #67e8f90d;
            filter: blur(15px);
            pointer-events: none;
          }

          .mte-card-heading {
            position: relative;
            z-index: 1;
            display: flex;
            align-items: center;
            gap: 17px;
            padding-bottom: 25px;
            margin-bottom: 26px;
            border-bottom: 1px solid #74cde51f;
          }

          .mte-icon-box {
            flex: 0 0 auto;
            width: 52px;
            height: 52px;
            display: grid;
            place-items: center;
            border-radius: 17px;
            border: 1px solid #67e8f948;
            background:
              linear-gradient(
                145deg,
                #67e8f91e,
                #6ee7b710
              );
            font-size: 25px;
          }

          .mte-kicker {
            display: block;
            margin-bottom: 4px;
            color: #67e8f9;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .mte-card-heading h2 {
            color: #f1fbff;
            font-size: clamp(24px, 4vw, 32px);
            line-height: 1.1;
          }

          .mte-card-heading p {
            margin-top: 7px;
            color: var(--ct-muted);
            line-height: 1.6;
            font-size: 13px;
          }

          /* -----------------------------
             Form
          ------------------------------ */

          .mte-form {
            position: relative;
            z-index: 1;
            display: grid;
            gap: 22px;
          }

          .mte-field {
            min-width: 0;
          }

          .mte-field label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 8px;
            color: #e8f9ff;
            font-size: 12px;
            font-weight: 750;
            letter-spacing: 0.02em;
          }

          .mte-field label small {
            color: #7893aa;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .mte-input-wrap {
            position: relative;
          }

          .mte-input-wrap input,
          .mte-input-wrap select {
            width: 100%;
            min-height: 56px;
            appearance: none;
            border: 1px solid #74cde538;
            border-radius: 17px;
            outline: none;
            background: #081529d9;
            color: #effcff;
            padding:
              13px
              44px
              13px
              48px;
            font: inherit;
            font-size: 13px;
            transition:
              border-color 0.2s ease,
              background 0.2s ease,
              box-shadow 0.2s ease,
              transform 0.2s ease;
          }

          .mte-input-wrap input:hover,
          .mte-input-wrap select:hover {
            border-color: #67e8f96b;
          }

          .mte-input-wrap input:focus,
          .mte-input-wrap select:focus {
            border-color: #67e8f9;
            background: #0c1d34;
            box-shadow:
              0 0 0 4px #67e8f910,
              0 12px 30px #0000001f;
          }

          .mte-input-wrap input:disabled,
          .mte-input-wrap select:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .mte-input-wrap select option {
            background: #0b182a;
            color: #eafaff;
          }

          .mte-field-icon {
            position: absolute;
            top: 50%;
            left: 17px;
            z-index: 2;
            transform: translateY(-50%);
            color: #7dd3fc;
            font-size: 16px;
            pointer-events: none;
          }

          .mte-select-arrow {
            position: absolute;
            right: 17px;
            top: 50%;
            transform: translateY(-50%);
            color: #88a9bb;
            pointer-events: none;
          }

          .mte-time-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 16px;
          }

          input[type="datetime-local"]::-webkit-calendar-picker-indicator {
            filter:
              invert(88%)
              sepia(26%)
              saturate(652%)
              hue-rotate(156deg)
              brightness(99%);
            opacity: 0.85;
            cursor: pointer;
          }

          /* -----------------------------
             Preview
          ------------------------------ */

          .mte-summary {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            padding: 16px;
            border: 1px solid #6ee7b72b;
            border-radius: 19px;
            background:
              linear-gradient(
                120deg,
                #6ee7b70d,
                #67e8f90b
              );
          }

          .mte-summary-sparkle {
            flex: 0 0 auto;
            width: 35px;
            height: 35px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            background: #67e8f916;
            color: #acffef;
            animation:
              mteSparkle 2.4s ease-in-out infinite;
          }

          .mte-summary-copy {
            min-width: 0;
          }

          .mte-summary-copy > span {
            display: block;
            margin-bottom: 3px;
            color: #6ee7b7;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.13em;
            text-transform: uppercase;
          }

          .mte-summary-copy strong {
            display: block;
            color: #f2fcff;
            font-size: 13px;
          }

          .mte-summary-copy p {
            margin-top: 4px;
            color: #91aabd;
            font-size: 11px;
            line-height: 1.6;
          }

          /* -----------------------------
             Submit button
          ------------------------------ */

          .mte-actions {
            padding-top: 2px;
          }

          .mte-submit {
            width: 100%;
            min-height: 55px;
            border: 0;
            justify-content: center;
            font-size: 13px;
            letter-spacing: 0.01em;
          }

          .mte-submit:disabled {
            opacity: 0.48;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }

          .mte-spinner {
            width: 17px;
            height: 17px;
            border: 2px solid #07354142;
            border-top-color: #073541;
            border-radius: 50%;
            animation: mteSpin 0.7s linear infinite;
          }

          /* -----------------------------
             Tip
          ------------------------------ */

          .mte-tip {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            max-width: 560px;
            margin: 18px auto 0;
            color: #7995a9;
            text-align: center;
            font-size: 11px;
            line-height: 1.6;
          }

          .mte-tip > span {
            flex: 0 0 auto;
            font-size: 17px;
          }

          /* -----------------------------
             Animation
          ------------------------------ */

          @keyframes mteSpin {
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes mteSparkle {
            0%,
            100% {
              opacity: 0.45;
              transform: scale(0.8) rotate(0deg);
            }

            50% {
              opacity: 1;
              transform: scale(1.1) rotate(30deg);
            }
          }

          /* -----------------------------
             Mobile
          ------------------------------ */

          @media (max-width: 640px) {
            .mte-page {
              padding: 34px 15px 60px;
            }

            .mte-header {
              align-items: flex-start;
            }

            .mte-header-icon {
              width: 67px;
              height: 67px;
              border-radius: 22px;
            }

            .mte-header-icon > span {
              font-size: 29px;
            }

            .mte-header p {
              font-size: 13px;
            }

            .mte-card {
              padding: 21px 17px;
              border-radius: 24px;
            }

            .mte-card-heading {
              align-items: flex-start;
              margin-bottom: 22px;
              padding-bottom: 21px;
            }

            .mte-icon-box {
              width: 44px;
              height: 44px;
              border-radius: 14px;
              font-size: 20px;
            }

            .mte-time-grid {
              grid-template-columns: 1fr;
            }

            .mte-input-wrap input,
            .mte-input-wrap select {
              min-height: 53px;
              font-size: 12px;
            }

            .mte-summary {
              padding: 14px;
            }
          }

          @media (max-width: 430px) {
            .mte-header-icon {
              display: none;
            }

            .mte-header h1 {
              font-size: 38px;
            }

            .mte-card-heading h2 {
              font-size: 25px;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .mte-header-icon i,
            .mte-summary-sparkle,
            .mte-spinner {
              animation: none;
            }
          }
        `}</style>
      </main>
    </CleaningTheme>
  );
}

function formatDateTime(value) {
  if (!value) return "";

  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) return value;

  const [year, month, day] = datePart
    .split("-")
    .map(Number);

  const [hour, minute] = timePart
    .split(":")
    .map(Number);

  const date = new Date(
    year,
    month - 1,
    day,
    hour,
    minute
  );

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}