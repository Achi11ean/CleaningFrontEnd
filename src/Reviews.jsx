import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import CreateReview from "./CreateReview";

const API_BASE = "https://cleaningback.onrender.com";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — ReviewList (redesigned to match)           */
/*  Same tokens as the rest of the site: slate-blue night, sky→cyan→   */
/*  emerald accents, serif display with italic gradient, eyebrows,     */
/*  hairline rules, glass, quiet bubbles. Amber is reserved for stars  */
/*  alone — the one place it carries meaning.                          */
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

const Stars = ({ rating = 0, size = "text-base" }) => (
  <div
    className={`flex gap-1 ${size}`}
    role="img"
    aria-label={`${rating} out of 5 stars`}
  >
    {[...Array(5)].map((_, i) => (
      <span
        key={i}
        aria-hidden="true"
        className={
          i < rating
            ? "text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.35)]"
            : "text-white/15"
        }
      >
        ★
      </span>
    ))}
  </div>
);

const REVIEWS_PER_PAGE = 6;

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [shown, setShown] = useState(false);

  const listRef = useRef(null);

  /* ---------------------------- Data ---------------------------- */
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/reviews/public`);
        setReviews(res.data || []);
      } catch (err) {
        setError("Couldn't load reviews right now. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  /* -------------------------- Behaviour ------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Escape closes the review form
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowCreate(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll behind the form
  useEffect(() => {
    document.body.style.overflow = showCreate ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreate]);

  /* -------------------------- Derived --------------------------- */
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  const indexOfLastReview = currentPage * REVIEWS_PER_PAGE;
  const indexOfFirstReview = indexOfLastReview - REVIEWS_PER_PAGE;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const average = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const goToPage = (page) => {
    setCurrentPage(page);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNextPage = () => currentPage < totalPages && goToPage(currentPage + 1);
  const handlePreviousPage = () => currentPage > 1 && goToPage(currentPage - 1);

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
        .rv-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation: rv-rise linear infinite;
          will-change: transform, opacity;
        }
        @keyframes rv-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        .rv-shine { position: relative; overflow: hidden; }
        .rv-shine::after {
          content: "";
          position: absolute; top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(186,230,253,0.14), transparent);
          transform: skewX(-20deg);
          transition: left 0.9s ease;
          pointer-events: none;
        }
        .rv-shine:hover::after { left: 130%; }
        @keyframes rv-modal-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rv-fade-in { from { opacity: 0 } to { opacity: 1 } }
        .rv-modal { animation: rv-modal-in 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .rv-scrim { animation: rv-fade-in 0.3s ease-out both; }
        @keyframes rv-pulse { 0%,100% { opacity: 0.5 } 50% { opacity: 0.85 } }
        .rv-skeleton { animation: rv-pulse 2s ease-in-out infinite; }
        .rv-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.3) transparent; }
        .rv-scroll::-webkit-scrollbar { width: 5px; }
        .rv-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
        @media (prefers-reduced-motion: reduce) {
          .rv-bubble { animation: none !important; opacity: 0 !important; }
          .rv-skeleton, .rv-modal, .rv-scrim { animation: none !important; }
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
            className="rv-bubble"
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
            In their words
          </p>

          <h1 className="font-serif text-4xl leading-[1.1] text-white sm:text-5xl md:text-6xl">
            What our clients{" "}
            <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
              actually say
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Every review below is from someone who let us into their home. We
            publish them as they come.
          </p>
        </div>

        {/* The rating, stated plainly — the page's one real headline number */}
        {!loading && !error && reviews.length > 0 && (
          <div
            {...reveal(150)}
            className="mx-auto mt-12 flex max-w-2xl flex-col items-center gap-5 border-y border-white/10 py-7 sm:flex-row sm:justify-center sm:gap-8"
          >
            <div className="text-center sm:text-left">
              <p className="font-serif text-4xl text-white">
                {average.toFixed(1)}
                <span className="text-2xl text-slate-500"> / 5</span>
              </p>
              <div className="mt-2 flex justify-center sm:justify-start">
                <Stars rating={Math.round(average)} size="text-sm" />
              </div>
            </div>

            <span className="hidden h-12 w-px bg-white/10 sm:block" />

            <p className="max-w-xs text-center text-sm leading-relaxed text-slate-400 sm:text-left">
              Based on {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"} from homes and
              businesses across central Connecticut.
            </p>
          </div>
        )}

        {/* Leave a review */}
        <div {...reveal(220)} className="mt-10 flex justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="rv-shine rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-9 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Write a review
          </button>
        </div>
      </header>

      {/* ---------------------------- Reviews ----------------------------- */}
      <main ref={listRef} className="relative mx-auto max-w-6xl scroll-mt-28 px-6 pb-28">
        <div {...reveal(280)} className="mb-10 flex items-center gap-5">
          <h2 className="whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300">
            {loading || error
              ? "The reviews"
              : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}
          </h2>
          <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rv-skeleton rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl"
                style={{ animationDelay: `${i * 140}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-white/[0.06]" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 rounded-full bg-white/[0.06]" />
                    <div className="h-3 w-16 rounded-full bg-white/[0.04]" />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full rounded-full bg-white/[0.04]" />
                  <div className="h-3 w-5/6 rounded-full bg-white/[0.04]" />
                  <div className="h-3 w-2/3 rounded-full bg-white/[0.04]" />
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
        {!loading && !error && reviews.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-xl">
            <p className="font-serif text-2xl text-white">No reviews yet</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
              If we've cleaned for you, we'd love to hear how it went. Yours would
              be the first.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rv-shine mt-7 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-8 py-3.5 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5"
            >
              Write the first review
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && reviews.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentReviews.map((review, i) => (
              <figure
                key={review.id}
                style={{ transitionDelay: `${Math.min(i, 6) * 70}ms` }}
                className={`group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-300/30 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-sky-500/10 ${
                  shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {/* Attribution */}
                <figcaption className="flex items-center gap-4">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-sky-300/25 bg-sky-400/10 font-serif text-lg text-sky-200">
                    {(review.first_name || "?").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-white">
                      {review.first_name} {review.last_initial}.
                    </p>
                    <div className="mt-1">
                      <Stars rating={review.rating} size="text-xs" />
                    </div>
                  </div>
                </figcaption>

                <div className="my-5 h-px w-full bg-gradient-to-r from-sky-500/30 to-transparent" />

                {/* The words */}
                <blockquote className="rv-scroll max-h-52 flex-1 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-300">
                  <span className="mr-1 font-serif text-2xl leading-none text-sky-400/40">
                    “
                  </span>
                  {review.message}
                </blockquote>
              </figure>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <nav
            aria-label="Reviews pagination"
            className="mt-14 flex items-center justify-center gap-3"
          >
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                currentPage === 1
                  ? "cursor-not-allowed border-white/[0.06] text-slate-700"
                  : "border-white/15 text-sky-200 hover:border-cyan-300/50 hover:bg-cyan-400/10"
              }`}
            >
              ←
            </button>

            <div className="flex items-center gap-2 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`h-2 rounded-full transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    p === currentPage
                      ? "w-8 bg-gradient-to-r from-sky-400 to-cyan-300"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                currentPage === totalPages
                  ? "cursor-not-allowed border-white/[0.06] text-slate-700"
                  : "border-white/15 text-sky-200 hover:border-cyan-300/50 hover:bg-cyan-400/10"
              }`}
            >
              →
            </button>
          </nav>
        )}

        {!loading && !error && totalPages > 1 && (
          <p className="mt-5 text-center text-[11px] uppercase tracking-[0.25em] text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
        )}
      </main>

      {/* ------------------------ Create review modal --------------------- */}
      {showCreate && (
        <div
          className="rv-scrim fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md"
          onClick={() => setShowCreate(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Write a review"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="rv-modal rv-scroll relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-sky-500/10 backdrop-blur-2xl"
          >
            <button
              onClick={() => setShowCreate(false)}
              aria-label="Close"
              className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/70 text-lg text-white backdrop-blur-md transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              ×
            </button>

            <CreateReview />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;