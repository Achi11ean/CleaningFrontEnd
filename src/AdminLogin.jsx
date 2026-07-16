import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Lock } from "lucide-react";
import { useAdmin } from "./AdminContext";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — AdminLogin (redesigned to match)           */
/*  Twin of StaffLogin, with the restricted framing admin deserves.    */
/*  Same tokens: slate-blue night, sky→cyan→emerald accents, serif     */
/*  with italic gradient, eyebrows, hairline rules, glass, bubbles.    */
/* ------------------------------------------------------------------ */

/* Deterministic ambient bubbles */
const BUBBLES = Array.from({ length: 10 }, (_, i) => ({
  left: `${(((i * 137.508) % 100) * 0.95 + 2).toFixed(2)}%`,
  size: 6 + ((i * 47) % 20),
  duration: 18 + ((i * 61) % 16),
  delay: -((i * 37) % 28),
  drift: (i % 2 === 0 ? 1 : -1) * (10 + ((i * 31) % 26)),
  opacity: 0.1 + ((i * 13) % 16) / 100,
}));

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdmin();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(form.username, form.password);
      navigate("/admin-dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const fieldBase =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white " +
    "placeholder:text-slate-600 backdrop-blur-md transition-all duration-300 " +
    "hover:border-white/20 focus:border-sky-300/50 focus:bg-white/[0.07] focus:outline-none " +
    "focus:ring-2 focus:ring-cyan-300/30";

  const labelBase = "mb-2 block text-[11px] uppercase tracking-[0.2em] text-slate-400";

  const reveal = (delay = 0) => ({
    className: `transition-all duration-1000 ease-out ${
      shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`,
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-gray-100 antialiased selection:bg-cyan-400/30">
      <style>{`
        .al-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation: al-rise linear infinite;
          will-change: transform, opacity;
        }
        @keyframes al-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        .al-shine { position: relative; overflow: hidden; }
        .al-shine::after {
          content: "";
          position: absolute; top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(186,230,253,0.16), transparent);
          transform: skewX(-20deg);
          transition: left 0.9s ease;
          pointer-events: none;
        }
        .al-shine:hover::after { left: 130%; }
        @media (prefers-reduced-motion: reduce) {
          .al-bubble { animation: none !important; opacity: 0 !important; }
        }
      `}</style>

      {/* --------------------------- Atmosphere --------------------------- */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent_55%)]" />
      <img
        src="/cleaning2.webp"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-full w-full object-cover opacity-[0.05] mix-blend-luminosity"
      />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="al-bubble"
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

      {/* ------------------------------ Body ------------------------------ */}
      <main className="relative flex flex-1 items-center px-6 pb-20 pt-28 md:pt-32">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Left — brand side, desktop only */}
          <div {...reveal()} className="hidden lg:block">
            <span className="inline-block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-2 backdrop-blur-md">
              <img
                src="/logo2.jpg"
                alt="A Breath of Fresh Air"
                className="h-24 w-auto rounded-xl object-contain"
              />
            </span>

            <h1 className="mt-8 font-serif text-4xl leading-tight text-white">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
                Amanda
              </span>
            </h1>

            <p className="mt-5 max-w-sm leading-relaxed text-slate-400">
              Sign in to manage inquiries, staff, services, and everything behind the
              scenes.
            </p>

            <div className="mt-10 border-t border-white/10 pt-6">
              <p className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.3em] text-amber-300/90">
                <Lock size={13} />
                Restricted access
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                This area is for authorized administrators only. Staff should use the{" "}
                <Link
                  to="/staff-login"
                  className="underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
                >
                  staff login
                </Link>{" "}
                instead.
              </p>
            </div>
          </div>

          {/* Right — the form */}
          <div {...reveal(120)} className="mx-auto w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-8 text-center lg:hidden">
              <span className="inline-block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 backdrop-blur-md">
                <img
                  src="/logo2.jpg"
                  alt="A Breath of Fresh Air"
                  className="h-16 w-auto rounded-xl object-contain"
                />
              </span>
              <h1 className="mt-5 font-serif text-3xl leading-tight text-white">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text italic text-transparent">
                  Amanda
                </span>
              </h1>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-7 shadow-2xl shadow-sky-500/10 backdrop-blur-xl md:p-10">
              {/* Card header */}
              <div className="mb-8 flex items-center gap-4">
                <h2 className="flex items-center gap-2.5 whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300">
                  <Lock size={13} className="text-amber-300/90" />
                  Admin login
                </h2>
                <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
              </div>

              <form onSubmit={submit}>
                <div className="space-y-5">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className={labelBase}>
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      required
                      autoComplete="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="adminusername"
                      className={fieldBase}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor="password" className={labelBase}>
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="mb-2 text-[11px] text-slate-500 underline decoration-sky-500/30 underline-offset-4 transition-colors hover:text-cyan-300"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`${fieldBase} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error */}
                <div aria-live="polite">
                  {error && (
                    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/[0.07] p-4 backdrop-blur-md">
                      <span className="mt-0.5 text-rose-300">!</span>
                      <p className="text-sm leading-relaxed text-rose-200">{error}</p>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`al-shine mt-7 w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    loading
                      ? "cursor-not-allowed opacity-50"
                      : "hover:-translate-y-0.5 hover:shadow-cyan-400/40"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>

              {/* Card footer — restricted note, mobile-visible */}
              <div className="mt-8 border-t border-white/10 pt-6 text-center lg:hidden">
                <p className="text-xs leading-relaxed text-slate-500">
                  Authorized administrators only. Staff should use the{" "}
                  <Link
                    to="/staff-login"
                    className="underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
                  >
                    staff login
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Back home */}
            <div className="mt-7 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-cyan-300"
              >
                <ArrowLeft size={14} />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* ----------------------------- Footer ----------------------------- */}
      <footer className="relative border-t border-white/[0.06] py-6 text-center text-[11px] tracking-wide text-slate-600">
        © {new Date().getFullYear()} A Breath of Fresh Air — Admin System
      </footer>
    </div>
  );
}