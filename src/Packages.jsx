import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://cleaningback.onrender.com";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — Packages (redesigned to match)             */
/*  Same tokens as HomePage / ServiceArea / ClientInquiry / Navbar:    */
/*  slate-blue night, sky→cyan→emerald accents, serif display with     */
/*  italic gradient, eyebrows, hairline rules, glass, quiet bubbles.   */
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

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shown, setShown] = useState(false);

  const handleViewPackage = (pkg) => setSelectedPackage(pkg);
  const closeModal = () => setSelectedPackage(null);

  /* ---------------------------- Data ---------------------------- */
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/services/public`);
        setPackages(res.data || []);
      } catch (err) {
        setError("Couldn't load our services right now. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  /* -------------------------- Behaviour ------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Escape closes the modal
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelectedPackage(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll behind the modal
  useEffect(() => {
    document.body.style.overflow = selectedPackage ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPackage]);

  const reveal = (delay = 0) => ({
    className: `transition-all duration-1000 ease-out ${
      shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`,
    style: { transitionDelay: `${delay}ms` },
  });

  /* ---------------------------- Render -------------------------- */
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-gray-100 antialiased selection:bg-cyan-400/30">
      <style>{`
        .pk-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation-name: pk-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes pk-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        .pk-shine { position: relative; overflow: hidden; }
        .pk-shine::after {
          content: "";
          position: absolute; top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(186,230,253,0.14), transparent);
          transform: skewX(-20deg);
          transition: left 0.9s ease;
          pointer-events: none;
        }
        .pk-shine:hover::after { left: 130%; }
        @keyframes pk-modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pk-fade-in { from { opacity: 0 } to { opacity: 1 } }
        .pk-modal { animation: pk-modal-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .pk-scrim { animation: pk-fade-in 0.3s ease-out both; }
        .pk-clamp {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pk-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.3) transparent; }
        .pk-scroll::-webkit-scrollbar { width: 5px; }
        .pk-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
        @keyframes pk-pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 0.85 } }
        .pk-skeleton { animation: pk-pulse 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pk-bubble, .pk-skeleton { animation: none !important; }
          .pk-bubble { opacity: 0 !important; }
          .pk-modal, .pk-scrim { animation: none !important; }
        }
      `}</style>

      {/* --------------------------- Atmosphere --------------------------- */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.09),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="pk-bubble"
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

      {/* ------------------------------ Hero ------------------------------ */}
      <header className="relative px-6 pb-14 pt-32 md:pb-16 md:pt-40">
        <div {...reveal()} className="mx-auto max-w-3xl text-center">
          <p className="mb-6 inline-flex items-center gap-3 rounded-full border border-sky-400/25 bg-white/[0.04] px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-sky-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            What we offer
          </p>

          <h1 className="font-serif text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl">
            Cleaning, shaped{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
              around your home
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Every package below is a starting point, not a box to fit into. Tell us
            what your space needs and we'll adjust from there.
          </p>
        </div>

        {/* The one promise worth its own line */}
        <div
          {...reveal(150)}
          className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-4 border-y border-white/10 py-6 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left"
        >
          <span className="font-serif text-3xl text-emerald-300">EWG A+</span>
          <span className="hidden h-8 w-px bg-white/10 sm:block" />
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            We clean with non-toxic products rated A or higher by the Environmental
            Working Group — safe for your family, your pets, and the planet.
          </p>
        </div>
      </header>

      {/* ---------------------------- Packages ---------------------------- */}
      <main className="relative mx-auto max-w-6xl px-6 pb-28">
        <div {...reveal(220)} className="mb-10 flex items-center gap-5">
          <h2 className="whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300">
            Our packages
          </h2>
          <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
        </div>

        {/* Loading — quiet skeletons in the shape of the real cards */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="pk-skeleton overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
                style={{ animationDelay: `${i * 200}ms` }}
              >
                <div className="h-52 w-full bg-white/[0.04]" />
                <div className="space-y-3 p-7">
                  <div className="h-5 w-2/3 rounded-full bg-white/[0.06]" />
                  <div className="h-3 w-full rounded-full bg-white/[0.04]" />
                  <div className="h-3 w-5/6 rounded-full bg-white/[0.04]" />
                  <div className="h-3 w-1/2 rounded-full bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-rose-400/25 bg-rose-400/[0.07] p-8 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-rose-300">!</span>
              <p className="text-sm leading-relaxed text-rose-200">{error}</p>
            </div>
            <Link to="/contact">
              <button className="whitespace-nowrap rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-xs uppercase tracking-[0.2em] text-sky-100 transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10">
                Ask us directly
              </button>
            </Link>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && packages.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-xl">
            <p className="font-serif text-2xl text-white">
              Packages are on their way
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              We're putting the finishing touches on our service list. In the
              meantime, tell us what you need and we'll quote it directly.
            </p>
            <Link to="/contact">
              <button className="pk-shine mt-7 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5">
                Request a quote
              </button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <button
                key={pkg.id}
                onClick={() => handleViewPackage(pkg)}
                style={{ transitionDelay: `${Math.min(i, 6) * 80}ms` }}
                className={`pk-shine group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-300/30 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-sky-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {/* Image */}
                <div className="relative h-52 w-full overflow-hidden">
                  {pkg.image_url ? (
                    <img
                      src={pkg.image_url}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-950 to-slate-950">
                      <span className="font-serif text-3xl italic text-sky-300/40">
                        Fresh Air
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-7">
                  <h3 className="font-serif text-2xl leading-snug text-white transition-colors duration-300 group-hover:text-cyan-300">
                    {pkg.title}
                  </h3>

                  <p className="pk-clamp mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-400">
                    {pkg.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 border-t border-white/[0.08] pt-5 text-[11px] uppercase tracking-[0.2em] text-sky-300">
                    View details
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Closing note */}
        {!loading && !error && packages.length > 0 && (
          <p className="mt-14 text-center text-sm italic text-slate-500">
            Don't see quite what you need? We build custom plans too —{" "}
            <Link
              to="/contact"
              className="not-italic underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              just ask
            </Link>
            .
          </p>
        )}
      </main>

      {/* ----------------------------- Modal ------------------------------ */}
      {selectedPackage && (
        <div
          className="pk-scrim fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={selectedPackage.title}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="pk-modal pk-scroll relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-sky-500/10 backdrop-blur-2xl"
          >
            {/* Close */}
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-lg text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              ×
            </button>

            {/* Image */}
            {selectedPackage.image_url && (
              <div className="relative h-64 w-full overflow-hidden md:h-72">
                <img
                  src={selectedPackage.image_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className={`px-7 pb-9 md:px-12 ${selectedPackage.image_url ? "-mt-12 pt-0" : "pt-14"}`}>
              <p className="relative mb-4 text-[11px] uppercase tracking-[0.35em] text-sky-300">
                Package
              </p>

              <h2 className="relative font-serif text-3xl leading-tight text-white md:text-4xl">
                {selectedPackage.title}
              </h2>

              <div className="my-7 h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />

              <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-300">
                {selectedPackage.description}
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
                <p className="text-center text-xs text-slate-500 sm:text-left">
                  Every plan is adjustable to your space.
                </p>
                <Link to="/contact" className="w-full sm:w-auto">
                  <button className="pk-shine w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-9 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-cyan-400/40 sm:w-auto">
                    Book this package
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;