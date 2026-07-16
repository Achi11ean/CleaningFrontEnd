import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://cleaningback.onrender.com";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — Gallery (redesigned to match)              */
/*  Same tokens as HomePage / ServiceArea / ClientInquiry / Navbar /   */
/*  Packages: slate-blue night, sky→cyan→emerald accents, serif with   */
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

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const Gallery = () => {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(null); // index of open photo, or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shown, setShown] = useState(false);

  const selectedPhoto = index === null ? null : photos[index];

  /* ---------------------------- Data ---------------------------- */
  useEffect(() => {
    axios
      .get(`${API_BASE}/gallery/public`)
      .then((res) => setPhotos(res.data || []))
      .catch((err) => {
        console.error("Failed to load gallery", err);
        setError("Couldn't load the gallery right now. Please refresh to try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  /* -------------------------- Behaviour ------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (dir) =>
      setIndex((i) =>
        i === null ? i : (i + dir + photos.length) % photos.length
      ),
    [photos.length]
  );

  // Escape closes, arrows navigate
  useEffect(() => {
    if (index === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, close, step]);

  // Lock body scroll behind the lightbox
  useEffect(() => {
    document.body.style.overflow = index !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

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
        .gl-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation: gl-rise linear infinite;
          will-change: transform, opacity;
        }
        @keyframes gl-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        /* Masonry — images keep their own proportions instead of being cropped square */
        .gl-masonry { column-gap: 1.5rem; column-count: 1; }
        @media (min-width: 640px)  { .gl-masonry { column-count: 2; } }
        @media (min-width: 1024px) { .gl-masonry { column-count: 3; } }
        .gl-tile { break-inside: avoid; margin-bottom: 1.5rem; width: 100%; }
        @keyframes gl-modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gl-fade-in { from { opacity: 0 } to { opacity: 1 } }
        .gl-modal { animation: gl-modal-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .gl-scrim { animation: gl-fade-in 0.3s ease-out both; }
        @keyframes gl-pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 0.85 } }
        .gl-skeleton { animation: gl-pulse 2s ease-in-out infinite; }
        .gl-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.3) transparent; }
        .gl-scroll::-webkit-scrollbar { width: 5px; }
        .gl-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
        @media (prefers-reduced-motion: reduce) {
          .gl-bubble { animation: none !important; opacity: 0 !important; }
          .gl-skeleton, .gl-modal, .gl-scrim { animation: none !important; }
        }
      `}</style>

      {/* --------------------------- Atmosphere --------------------------- */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.09),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="gl-bubble"
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
            Our work
          </p>

          <h1 className="font-serif text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl">
            Real rooms,{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
              really cleaned
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Every photo here is a space we've actually worked in — no stock rooms,
            no staging. This is what the difference looks like.
          </p>
        </div>
      </header>

      {/* ---------------------------- Gallery ----------------------------- */}
      <main className="relative mx-auto max-w-7xl px-6 pb-28">
        <div {...reveal(150)} className="mb-10 flex items-center gap-5">
          <h2 className="whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300">
            {loading || error
              ? "The collection"
              : `${photos.length} ${photos.length === 1 ? "space" : "spaces"}`}
          </h2>
          <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
        </div>

        {/* Loading — skeletons at varied heights, like the real masonry */}
        {loading && (
          <div className="gl-masonry">
            {[280, 380, 320, 420, 300, 360].map((h, i) => (
              <div
                key={i}
                className="gl-tile gl-skeleton overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                style={{ animationDelay: `${i * 160}ms` }}
              >
                <div className="w-full bg-white/[0.04]" style={{ height: h }} />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-2/3 rounded-full bg-white/[0.06]" />
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
        {!loading && !error && photos.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-xl">
            <p className="font-serif text-2xl text-white">The gallery is filling up</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              We're adding photos from recent work. Check back soon — or let us show
              you in person.
            </p>
            <Link to="/contact">
              <button className="mt-7 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5">
                Book a clean
              </button>
            </Link>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && !error && photos.length > 0 && (
          <div className="gl-masonry">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setIndex(i)}
                style={{ transitionDelay: `${Math.min(i, 8) * 70}ms` }}
                className={`gl-tile group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-300/30 hover:shadow-xl hover:shadow-sky-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <img
                  src={photo.image_url}
                  alt={photo.title || ""}
                  loading="lazy"
                  className="w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                />

                {/* Caption — always legible, lifts on hover */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-6 pt-16">
                  <h3 className="font-serif text-xl leading-snug text-white transition-colors duration-300 group-hover:text-cyan-300">
                    {photo.title}
                  </h3>
                  {photo.description && (
                    <p className="mt-1.5 max-h-0 overflow-hidden text-sm leading-relaxed text-slate-300 opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
                      {photo.description}
                    </p>
                  )}
                </div>

                {/* Expand affordance */}
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/50 text-sm text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100">
                  ⤢
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && photos.length > 0 && (
          <p className="mt-14 text-center text-sm italic text-slate-500">
            Want your space on this wall?{" "}
            <Link
              to="/contact"
              className="not-italic underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              Book a clean
            </Link>
            .
          </p>
        )}
      </main>

      {/* --------------------------- Lightbox ----------------------------- */}
      {selectedPhoto && (
        <div
          className="gl-scrim fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md md:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title || "Gallery photo"}
        >
          {/* Prev / next */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-sky-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/50 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:left-6"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-sky-200 backdrop-blur-md transition-all duration-300 hover:border-cyan-300/50 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 md:right-6"
              >
                →
              </button>
            </>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            className="gl-modal gl-scroll max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-sky-500/10 backdrop-blur-2xl"
          >
            <div className="relative flex flex-col lg:flex-row">
              {/* Close */}
              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-lg text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                ×
              </button>

              {/* Image */}
              <div className="flex items-center justify-center bg-slate-950 lg:w-2/3">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.title || ""}
                  className="max-h-[45vh] w-full object-contain lg:max-h-[85vh]"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col justify-center border-t border-white/10 p-8 lg:w-1/3 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">
                  {index + 1} of {photos.length}
                </p>

                <h2 className="mt-5 font-serif text-3xl leading-tight text-white">
                  {selectedPhoto.title}
                </h2>

                <div className="my-6 h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />

                {selectedPhoto.description && (
                  <p className="text-[15px] leading-relaxed text-slate-300">
                    {selectedPhoto.description}
                  </p>
                )}

                {formatDate(selectedPhoto.created_at) && (
                  <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-slate-500">
                    Added {formatDate(selectedPhoto.created_at)}
                  </p>
                )}

                <Link to="/contact" className="mt-8">
                  <button className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5">
                    Book a clean like this
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

export default Gallery;