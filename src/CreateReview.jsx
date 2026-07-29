// src/CreateReview.jsx
import { useState } from "react";

const API_BASE = "https://cleaningback.onrender.com"; // adjust

// A gentle field of rising soap bubbles for a calm, clean vibe.
const BUBBLES = [
  { left: "6%", size: 46, duration: 15, delay: 0, drift: 24 },
  { left: "16%", size: 22, duration: 12, delay: 2.5, drift: -18 },
  { left: "27%", size: 60, duration: 18, delay: 1, drift: 30 },
  { left: "38%", size: 30, duration: 13, delay: 4, drift: -22 },
  { left: "49%", size: 18, duration: 11, delay: 0.8, drift: 16 },
  { left: "58%", size: 52, duration: 17, delay: 3, drift: -28 },
  { left: "68%", size: 26, duration: 14, delay: 5, drift: 20 },
  { left: "78%", size: 40, duration: 16, delay: 2, drift: -20 },
  { left: "88%", size: 20, duration: 12, delay: 6, drift: 14 },
  { left: "94%", size: 34, duration: 19, delay: 1.5, drift: -24 },
];

const RATING_LABELS = {
  5: "Excellent",
  4: "Good",
  3: "Okay",
  2: "Not great",
  1: "Poor",
};

// Progressively formats US phone input as (555) 123-4567 while typing.
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function StarIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <path
        d="M12 2.5l2.7 5.85 6.3.72-4.7 4.28 1.26 6.15L12 16.9 6.14 19.5l1.26-6.15-4.7-4.28 6.3-.72L12 2.5z"
        fill={active ? "url(#reviewStarGrad)" : "#e2e8f0"}
        stroke={active ? "#f59e0b" : "#cbd5e1"}
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CreateReview() {
  const [form, setForm] = useState({
    first_name: "",
    last_initial: "",
    last_name: "",
    phone: "",
    email: "",
    rating: 5,
    message: "",
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const needsFollowUp = form.rating < 5;
  const shownRating = hoverRating || form.rating;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "rating"
          ? Number(value)
          : name === "phone"
          ? formatPhoneNumber(value)
          : value,
    }));
  };

  const setRating = (value) => {
    setError(null);
    setForm((prev) => ({ ...prev, rating: value }));
  };

  // Everything the follow-up flow requires, in one place.
  const validate = () => {
    if (!form.first_name.trim()) return "Please enter your first name.";

    if (needsFollowUp) {
      if (!form.last_name.trim())
        return "Please enter your last name so we can follow up.";

      const hasPhone = form.phone.trim().length > 0;
      const hasEmail = form.email.trim().length > 0;
      if (!hasPhone && !hasEmail)
        return "Please add a phone number or email so we can reach you and make it right.";
      if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        return "That email doesn't look quite right — mind double-checking it?";
      if (hasPhone && form.phone.replace(/\D/g, "").length < 7)
        return "That phone number looks a little short — mind double-checking it?";

      if (!form.message.trim())
        return "For ratings under 5 stars, please tell us how we can do better.";
    } else if (!form.last_initial.trim()) {
      return "Please enter your last initial.";
    }
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    // Build the payload in the shape the backend already expects.
    // For follow-up reviews we fold the contact details into the message
    // and derive the public last initial from the full last name.
    let message = form.message.trim();
    let last_initial = form.last_initial.trim().toUpperCase();

    if (needsFollowUp) {
      last_initial = form.last_name.trim().charAt(0).toUpperCase();

      const details = [
        "――― Follow-up details ―――",
        `Name: ${form.first_name.trim()} ${form.last_name.trim()}`,
        form.phone.trim() && `Phone: ${form.phone.trim()}`,
        form.email.trim() && `Email: ${form.email.trim()}`,
      ]
        .filter(Boolean)
        .join("\n");

      message = `${message}\n\n${details}`;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_initial,
      rating: form.rating,
      message,
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Failed to submit review. Please try again.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          /* response had no JSON body */
        }
        throw new Error(msg);
      }

      setStatus(
        needsFollowUp
          ? "Thank you for the honest feedback. We'll reach out personally to make things right. 💙"
          : "Thank you! Your review is pending approval. 💙"
      );
      setForm({
        first_name: "",
        last_initial: "",
        last_name: "",
        phone: "",
        email: "",
        rating: 5,
        message: "",
      });
      setHoverRating(0);
    } catch (err) {
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-card relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-b from-white via-sky-50 to-cyan-50 p-8">
      <style>{styles}</style>

      {/* Ambient soap bubbles */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              "--drift": `${b.drift}px`,
            }}
          />
        ))}
      </div>

      {/* Gradient used to fill selected stars */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="reviewStarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 shadow-lg">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-white"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
              <path d="M19 13l.8 2.4L22 16l-2.2.6L19 19l-.8-2.4L16 16l2.2-.6L19 13z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Leave a review
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            We truly value your feedback. Reviews are published after approval.
          </p>
        </div>

        {status && (
          <div className="reveal mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <span className="mt-0.5 text-lg">✅</span>
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}

        {error && (
          <div className="reveal mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            <span className="mt-0.5 text-lg">💬</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {/* Rating */}
          <div className="rounded-2xl border border-sky-100 bg-white/70 p-4 text-center backdrop-blur-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              How was your experience?
            </label>
            <div
              className="flex items-center justify-center gap-1.5"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className="star-btn h-9 w-9"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={form.rating === star}
                >
                  <StarIcon active={star <= shownRating} />
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {RATING_LABELS[shownRating]}
            </p>
          </div>

          {/* Names */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                First name
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First name"
                className="review-input"
                required
              />
            </div>

            {needsFollowUp ? (
              <div className="flex-1">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Last name
                </label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="review-input"
                  required
                />
              </div>
            ) : (
              <div className="w-full sm:w-28">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Last initial
                </label>
                <input
                  name="last_initial"
                  value={form.last_initial}
                  onChange={handleChange}
                  placeholder="A"
                  maxLength={1}
                  className="review-input text-center uppercase"
                  required
                />
              </div>
            )}
          </div>

          {/* Follow-up contact panel — only for ratings under 5 */}
          {needsFollowUp && (
            <div className="reveal rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-4">
              <div className="mb-3 flex items-start gap-2">
                <span className="text-lg">🤍</span>
                <p className="text-sm text-amber-800">
                  We're sorry we missed the mark. Leave your contact info and
                  we'll personally reach out to make it right.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={14}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="review-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="review-input"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-700">
                Add at least one — a phone number or email — so we can follow up
                with you.
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Your review
              {needsFollowUp && (
                <span className="ml-2 text-xs font-semibold text-rose-600">
                  (Required for ratings under 5 ⭐)
                </span>
              )}
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={
                needsFollowUp
                  ? "Please tell us what we could do better..."
                  : "Share your experience (optional for 5-star reviews)"
              }
              rows={5}
              className={`review-input resize-none ${
                needsFollowUp ? "review-input--warm" : ""
              }`}
              required={needsFollowUp}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`submit-btn flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white shadow-lg transition ${
              loading
                ? "cursor-not-allowed bg-slate-300"
                : "bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
            }`}
          >
            {loading ? (
              <>
                <span className="spinner" /> Sending…
              </>
            ) : (
              "Submit review"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = `
  .review-card {
    box-shadow: 0 20px 60px -18px rgba(14, 165, 233, 0.4);
  }

  .review-input {
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    padding: 0.6rem 0.75rem;
    color: #0f172a;
    font-size: 0.95rem;
    line-height: 1.4;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    outline: none;
  }
  .review-input::placeholder { color: #94a3b8; }
  .review-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
  }
  .review-input--warm { box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.4); }
  .review-input--warm:focus {
    border-color: #fbbf24;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
  }

  .star-btn {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.15s ease;
  }
  .star-btn:hover { transform: scale(1.18); }
  .star-btn:active { transform: scale(0.94); }
  .star-btn:focus-visible {
    outline: 2px solid #38bdf8;
    outline-offset: 3px;
    border-radius: 6px;
  }

  .submit-btn:not(:disabled) { box-shadow: 0 10px 24px -8px rgba(6, 182, 212, 0.55); }
  .submit-btn:not(:disabled):active { transform: scale(0.99); }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-top-color: #ffffff;
    border-radius: 9999px;
    animation: reviewSpin 0.7s linear infinite;
  }
  @keyframes reviewSpin { to { transform: rotate(360deg); } }

  .bubble {
    position: absolute;
    bottom: -90px;
    border-radius: 9999px;
    background: radial-gradient(circle at 32% 28%,
      rgba(255, 255, 255, 0.95),
      rgba(186, 230, 253, 0.4) 45%,
      rgba(103, 232, 249, 0.18) 72%);
    box-shadow:
      inset 0 0 14px rgba(255, 255, 255, 0.7),
      inset -3px -3px 10px rgba(56, 189, 248, 0.15),
      0 4px 16px rgba(56, 189, 248, 0.12);
    animation-name: reviewFloatUp;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  @keyframes reviewFloatUp {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    8%   { opacity: 0.6; }
    50%  { transform: translateY(-320px) translateX(calc(var(--drift, 20px) * -0.6)); }
    92%  { opacity: 0.5; }
    100% { transform: translateY(-700px) translateX(var(--drift, 20px)); opacity: 0; }
  }

  .reveal { animation: reviewFadeSlideIn 0.4s ease-out; }
  @keyframes reviewFadeSlideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble { animation: none; opacity: 0.18; }
    .reveal { animation: none; }
    .star-btn:hover, .star-btn:active, .submit-btn:not(:disabled):active { transform: none; }
  }
`;