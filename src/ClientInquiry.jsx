import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://cleaningback.onrender.com";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — ClientInquiry (redesigned to match)        */
/*  Same tokens as HomePage / ServiceArea: slate-blue night, serif     */
/*  display with italic gradient, eyebrows, hairline rules, glass,     */
/*  and the quiet rising-bubble ambience.                              */
/* ------------------------------------------------------------------ */

/* Deterministic ambient bubbles */
const BUBBLES = Array.from({ length: 11 }, (_, i) => ({
  left: `${(((i * 137.508) % 100) * 0.95 + 2).toFixed(2)}%`,
  size: 6 + ((i * 47) % 20),
  duration: 18 + ((i * 61) % 16),
  delay: -((i * 37) % 28),
  drift: (i % 2 === 0 ? 1 : -1) * (10 + ((i * 31) % 26)),
  opacity: 0.1 + ((i * 13) % 16) / 100,
}));

const REASSURANCE = [
  {
    title: "A real reply, from a real person",
    desc: "We read every inquiry ourselves and usually respond within one business day.",
  },
  {
    title: "No pressure, no obligation",
    desc: "A quote is just a quote. Take your time deciding what's right for your space.",
  },
  {
    title: "Your details stay yours",
    desc: "We only use what you share here to prepare your estimate and get in touch.",
  },
];

export default function ClientInquiry() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    message: "",

    // Additional info
    preferred_contact: "",
    property_type: "",
    square_footage: "",
    service_type: "",
    heard_about_us: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  /* ------------------------------ Styles ------------------------------ */

  const fieldBase =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white " +
    "placeholder:text-slate-500 backdrop-blur-md transition-all duration-300 " +
    "hover:border-white/20 focus:border-sky-300/50 focus:bg-white/[0.07] focus:outline-none " +
    "focus:ring-2 focus:ring-cyan-300/30";

  const selectBase = fieldBase + " appearance-none cursor-pointer pr-10";
  const textareaBase = fieldBase + " resize-none";
  const labelBase =
    "mb-2 block text-[11px] uppercase tracking-[0.2em] text-slate-400";
  const eyebrow =
    "whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300";

  const Legend = ({ children }) => (
    <div className="mb-7 flex items-center gap-5">
      <h3 className={eyebrow}>{children}</h3>
      <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
    </div>
  );

  /* ------------------------------ Logic ------------------------------- */

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const len = digits.length;
    if (len === 0) return "";
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) => {
    setForm({ ...form, phone: formatPhone(e.target.value) });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitInquiry = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    // Address must include at least a city
    if (!form.address || form.address.trim().length < 3) {
      setError("Enter at least a city in the address field.");
      setLoading(false);
      return;
    }

    // Square footage, if given, must be a number
    if (form.square_footage && isNaN(Number(form.square_footage))) {
      setError("Square footage must be a number.");
      setLoading(false);
      return;
    }

    // Build appended notes block
    const additionalInfoLines = [];

    if (form.preferred_contact)
      additionalInfoLines.push(`Preferred Contact Method: ${form.preferred_contact}`);

    if (form.property_type)
      additionalInfoLines.push(`Property Type: ${form.property_type}`);

    if (form.square_footage)
      additionalInfoLines.push(`Approx. Square Footage: ${form.square_footage}`);

    if (form.service_type)
      additionalInfoLines.push(`Service Type: ${form.service_type}`);

    if (form.heard_about_us)
      additionalInfoLines.push(`Heard About Us From: ${form.heard_about_us}`);

    const appendedNotes =
      additionalInfoLines.length > 0
        ? `\n\n--- Additional Information ---\n${additionalInfoLines.join("\n")}`
        : "";

    const finalMessage = `${form.message}${appendedNotes}`;

    try {
      const res = await axios.post(`${API_BASE_URL}/clients/inquiry`, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address || null,
        message: finalMessage,
      });

      setStatus(res.data.message);

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        message: "",
        preferred_contact: "",
        property_type: "",
        square_footage: "",
        service_type: "",
        heard_about_us: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.error || "Couldn't send your inquiry. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------ Render ------------------------------ */

  const reveal = (delay = 0) => ({
    className: `transition-all duration-1000 ease-out ${
      shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`,
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-gray-100 antialiased selection:bg-cyan-400/30">
      {/* ---------------------------- Keyframes ---------------------------- */}
      <style>{`
        .ci-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation-name: ci-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes ci-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        .ci-shine { position: relative; overflow: hidden; }
        .ci-shine::after {
          content: "";
          position: absolute; top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(186,230,253,0.16), transparent);
          transform: skewX(-20deg);
          transition: left 0.9s ease;
          pointer-events: none;
        }
        .ci-shine:hover::after { left: 130%; }
        /* Native dropdown options readable on dark backgrounds */
        .ci-select option { background-color: #0f172a; color: #e2e8f0; }
        /* Trim number-input spinners for a calmer field */
        .ci-num::-webkit-outer-spin-button,
        .ci-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .ci-num { -moz-appearance: textfield; }
        @media (prefers-reduced-motion: reduce) {
          .ci-bubble { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {/* --------------------------- Atmosphere ---------------------------- */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.09),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="ci-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
              "--drift": `${b.drift}px`,
              "--maxo": b.opacity,
            }}
          />
        ))}
      </div>

      {/* ------------------------------ Hero ------------------------------- */}
      <header className="relative overflow-hidden px-6 pb-16 pt-32 md:pb-20 md:pt-40">
        <img
          src="/banner3.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-luminosity"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />

        <div {...reveal()} className="relative mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-3 rounded-full border border-sky-400/25 bg-white/[0.04] px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-sky-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            Free quote · No obligation
          </p>

          <h1 className="font-serif text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl">
            Tell us about{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
              your space
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Share a few details and we'll design a cleaning plan around your home,
            your schedule, and how you actually live.
          </p>
        </div>
      </header>

      {/* ------------------------ Form + reassurance ----------------------- */}
      <main className="relative mx-auto max-w-6xl px-2 pb-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          {/* Left — quiet reassurance, sticky on desktop */}
          <aside {...reveal(100)} className="lg:sticky lg:top-28 lg:self-start">
            <p className={eyebrow}>What happens next</p>
            <div className="mt-6">
              {REASSURANCE.map((r) => (
                <div
                  key={r.title}
                  className="group border-t border-white/10 py-6 first:border-t-0"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h4 className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-cyan-300">
                      {r.title}
                    </h4>
                    <span className="text-sky-500/60 transition-transform duration-500 group-hover:rotate-90">
                      ✦
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{r.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300">
                Prefer email?
              </p>
              <a
                href="mailto:abofacs.inquiries@gmail.com"
                className="mt-3 inline-block text-sm text-slate-300 underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
              >
                abofacs.inquiries@gmail.com
              </a>
              <p className="mt-3 text-sm text-slate-500">📍 Bristol, CT</p>
            </div>
          </aside>

          {/* Right — the form, in one glass panel */}
          <div {...reveal(200)}>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-3.5 shadow-2xl shadow-sky-500/10 backdrop-blur-xl md:p-12">
              <form onSubmit={submitInquiry} noValidate={false}>
                {/* ---- About you ---- */}
                <Legend>About you</Legend>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className={labelBase}>
                      First name *
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      autoComplete="given-name"
                      className={fieldBase}
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className={labelBase}>
                      Last name *
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      autoComplete="family-name"
                      className={fieldBase}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelBase}>
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={fieldBase}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className={labelBase}>
                      Phone *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      required
                      maxLength={14}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="(123) 456-7890"
                      className={fieldBase}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className={labelBase}>
                      Address * <span className="text-slate-500">— city required</span>
                    </label>
                    <input
                      id="address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      autoComplete="street-address"
                      placeholder="123 Main St, Bristol, CT"
                      className={fieldBase}
                    />
                  </div>
                </div>

                {/* ---- Your space ---- */}
                <div className="mt-12">
                  <Legend>Your space</Legend>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label htmlFor="property_type" className={labelBase}>
                        Property type
                      </label>
                      <div className="relative">
                        <select
                          id="property_type"
                          name="property_type"
                          value={form.property_type}
                          onChange={handleChange}
                          className={`ci-select ${selectBase}`}
                        >
                          <option value="">Select one…</option>
                          <option value="House">House</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Condo">Condo</option>
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400/70">
                          ▾
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="square_footage" className={labelBase}>
                        Approx. square footage
                      </label>
                      <input
                        id="square_footage"
                        type="number"
                        name="square_footage"
                        value={form.square_footage}
                        onChange={handleChange}
                        placeholder="e.g. 1800"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        className={`ci-num ${fieldBase}`}
                      />
                    </div>

                    <div>
                      <label htmlFor="service_type" className={labelBase}>
                        Service type
                      </label>
                      <div className="relative">
                        <select
                          id="service_type"
                          name="service_type"
                          value={form.service_type}
                          onChange={handleChange}
                          className={`ci-select ${selectBase}`}
                        >
                          <option value="">Select one…</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Deep Clean">Deep Clean</option>
                          <option value="Move In / Move Out">Move In / Move Out</option>
                          <option value="Post Construction">Post Construction</option>
                          <option value="Recurring Maintenance">Recurring Maintenance</option>
                          <option value="Other">Other</option>
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400/70">
                          ▾
                        </span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="preferred_contact" className={labelBase}>
                        Preferred contact method
                      </label>
                      <div className="relative">
                        <select
                          id="preferred_contact"
                          name="preferred_contact"
                          value={form.preferred_contact}
                          onChange={handleChange}
                          className={`ci-select ${selectBase}`}
                        >
                          <option value="">Select one…</option>
                          <option value="Call">Call</option>
                          <option value="Text">Text</option>
                          <option value="Email">Email</option>
                        </select>
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400/70">
                          ▾
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ---- Details ---- */}
                <div className="mt-12">
                  <Legend>Details</Legend>

                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label htmlFor="message" className={labelBase}>
                        How can we help? *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={6}
                        required
                        placeholder="Tell us about your cleaning needs — rooms, frequency, anything that needs extra care…"
                        className={textareaBase}
                      />
                    </div>

                    <div>
                      <label htmlFor="heard_about_us" className={labelBase}>
                        How did you hear about us?
                      </label>
                      <input
                        id="heard_about_us"
                        name="heard_about_us"
                        value={form.heard_about_us}
                        onChange={handleChange}
                        placeholder="Google, Facebook, a friend…"
                        className={fieldBase}
                      />
                    </div>
                  </div>
                </div>

                {/* ---- Feedback ---- */}
                <div aria-live="polite">
                  {status && (
                    <div className="mt-10 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-5 text-emerald-200 backdrop-blur-md">
                      <span className="mt-0.5 text-emerald-300">✦</span>
                      <p className="text-sm leading-relaxed">{status}</p>
                    </div>
                  )}

                  {error && (
                    <div className="mt-10 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] p-5 text-rose-200 backdrop-blur-md">
                      <span className="mt-0.5 text-rose-300">!</span>
                      <p className="text-sm leading-relaxed">{error}</p>
                    </div>
                  )}
                </div>

                {/* ---- Submit ---- */}
                <div className="mt-10 flex flex-col-reverse items-center gap-5 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
                  <p className="text-center text-xs text-slate-500 sm:text-left">
                    Fields marked * are required.
                  </p>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`ci-shine w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-10 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-auto ${
                      loading
                        ? "cursor-not-allowed opacity-50"
                        : "hover:-translate-y-0.5 hover:shadow-cyan-400/40"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                        Sending…
                      </span>
                    ) : (
                      "Send my request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}