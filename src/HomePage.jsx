import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Tailwind CSS
import ServiceArea from "./ServiceArea";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — HomePage (complete redesign)               */
/*  Theme kept: deep slate/blue night + sky/cyan/emerald accents       */
/*  Signature: ambient "fresh air field" — soft rising bubbles         */
/*  and gentle sparkles, tuned to stay quiet and elegant.              */
/* ------------------------------------------------------------------ */

/* ----------------------------- Data ------------------------------ */

const galleryImages = [
  { id: 1, image_url: "/slider1.jpeg", caption: "Fresh Start", category: "Residential", photo_type: "Before / After" },
  { id: 2, image_url: "/slider2.jpeg", caption: "Sparkling Kitchen", category: "Kitchen", photo_type: "After" },
  { id: 3, image_url: "/slider3.jpeg", caption: "Relaxed Living", category: "Living Room", photo_type: "Clean" },
  { id: 4, image_url: "/slider4.jpeg", caption: "Eco-Friendly", category: "Green Clean", photo_type: "Non-Toxic" },
  { id: 5, image_url: "/slider5.jpeg", caption: "Shiny Floors", category: "Floors", photo_type: "Polished" },
  { id: 6, image_url: "/slider6.jpeg", caption: "Fridge Refresh", category: "Home Care", photo_type: "Weekly" },
  { id: 7, image_url: "/slider7.jpeg", caption: "Faucet Care", category: "Sinks", photo_type: "Shiny" },
  { id: 8, image_url: "/slider8.jpeg", caption: "Fresh Bathroom", category: "Bathroom", photo_type: "Sanitized" },
];

const services = [
  {
    title: "Residential Cleaning",
    desc: "From cozy kitchens to serene bedrooms, we make your whole home feel fresh, calm, and inviting again.",
    tag: "Homes",
  },
  {
    title: "Office Cleaning",
    desc: "A tidy workspace promotes productivity. We keep your office spotless so your team can focus on success.",
    tag: "Business",
  },
  {
    title: "Eco-Friendly Solutions",
    desc: "Only non-toxic, eco-friendly products — safe for your family, your pets, and the planet.",
    tag: "Green",
  },
  {
    title: "Moving Day Cleaning",
    desc: "Moving in or out? We handle the deep clean so you can focus on settling into your next chapter.",
    tag: "Move In / Out",
  },
];

const pillars = [
  {
    title: "Wellness-focused",
    desc: "A mindful approach to cleaning that supports mental clarity, calm, and emotional balance.",
  },
  {
    title: "Customized care",
    desc: "Every home is different. Your cleaning plan is designed around your space and your lifestyle.",
  },
  {
    title: "Trusted & detail-oriented",
    desc: "We treat your space with the same respect and attention we'd want in our own homes.",
  },
];

/* ---------------------- Ambient atmosphere ----------------------- */
/*  Deterministic pseudo-random values so bubbles/sparkles are        */
/*  stable across renders, spread nicely, and never overwhelming.     */

const BUBBLES = Array.from({ length: 14 }, (_, i) => {
  const seed = (i * 137.508) % 100; // golden-angle spread
  return {
    left: `${(seed * 0.97 + 1.5).toFixed(2)}%`,
    size: 6 + ((i * 53) % 22), // 6–28px
    duration: 16 + ((i * 71) % 18), // 16–34s
    delay: -((i * 47) % 30), // negative = already mid-float on load
    drift: ((i % 2 === 0 ? 1 : -1) * (10 + ((i * 31) % 30))) | 0,
    opacity: 0.14 + ((i * 13) % 20) / 100, // 0.14–0.34
  };
});

const SPARKLES = Array.from({ length: 9 }, (_, i) => ({
  left: `${(((i * 199) % 92) + 4).toFixed(1)}%`,
  top: `${(((i * 83) % 78) + 8).toFixed(1)}%`,
  size: 8 + ((i * 29) % 10),
  duration: 4 + ((i * 17) % 5),
  delay: (i * 0.7).toFixed(1),
}));

const AmbientField = ({ sparkles = true, className = "" }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
    {BUBBLES.map((b, i) => (
      <span
        key={`b-${i}`}
        className="bofa-bubble"
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
    {sparkles &&
      SPARKLES.map((s, i) => (
        <svg
          key={`s-${i}`}
          className="bofa-sparkle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 0C12.9 6.6 17.4 11.1 24 12c-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0Z"
            fill="url(#bofa-sparkle-grad)"
          />
          <defs>
            <linearGradient id="bofa-sparkle-grad" x1="0" y1="0" x2="24" y2="24">
              <stop stopColor="#7dd3fc" />
              <stop offset="1" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
      ))}
  </div>
);

/* --------------------------- Component --------------------------- */

const HomePage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [visible, setVisible] = useState({});
  const galleryRef = useRef(null);

  /* Gentle scroll-reveal for sections */
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((v) => ({ ...v, [e.target.dataset.reveal]: true }));
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* Close lightbox on Escape */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelectedImage(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scrollGallery = (dir) => {
    const el = galleryRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 640), behavior: "smooth" });
  };

  const reveal = (key, extra = "") =>
    `transition-all duration-1000 ease-out ${extra} ${
      visible[key] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`;

  return (
    <div className="relative min-h-screen bg-slate-950 text-gray-100 antialiased overflow-x-hidden selection:bg-cyan-400/30">
      {/* ------------------------ Keyframes ------------------------ */}
      <style>{`
        .bofa-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation-name: bofa-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes bofa-rise {
          0%   { transform: translate(0, 0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.25); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.25); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        .bofa-sparkle {
          position: absolute;
          opacity: 0;
          animation-name: bofa-twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: drop-shadow(0 0 6px rgba(103,232,249,0.55));
          will-change: transform, opacity;
        }
        @keyframes bofa-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          50%      { opacity: 0.9; transform: scale(1) rotate(90deg); }
        }
        .bofa-shine { position: relative; overflow: hidden; }
        .bofa-shine::after {
          content: "";
          position: absolute;
          top: 0; left: -80%;
          width: 50%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(186,230,253,0.14), transparent);
          transform: skewX(-20deg);
          transition: left 0.9s ease;
          pointer-events: none;
        }
        .bofa-shine:hover::after { left: 130%; }
        .bofa-scroll { scrollbar-width: none; }
        .bofa-scroll::-webkit-scrollbar { display: none; }
        @keyframes bofa-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(8px); }
        }
        .bofa-bob { animation: bofa-bob 2.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .bofa-bubble, .bofa-sparkle, .bofa-bob { animation: none !important; opacity: 0 !important; }
          [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
        }
      `}</style>

      {/* ========================== HERO ========================== */}
      <header className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6">
        {/* Atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.10),transparent_55%)]" />
        {/* Optional photo whisper behind everything */}
        <img
          src="/banner3.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-[0.08] mix-blend-luminosity"
        />
        <AmbientField />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-6 inline-flex items-center gap-3 rounded-full border border-sky-400/25 bg-white/[0.04] px-5 py-2 text-[11px] uppercase tracking-[0.35em] text-sky-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
            Eco-friendly cleaning · Bristol, CT
          </p>

          <h1 className="font-serif text-5xl leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-8xl">
            A Breath of
            <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
              Fresh Air
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Thoughtful, detailed cleaning that leaves your home refreshed, calm,
            and beautifully maintained — because a clean space is a clear mind.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/contact" className="w-full sm:w-auto">
              <button className="bofa-shine w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-9 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-auto">
                Book a Consultation
              </button>
            </Link>
            <Link to="/packages" className="w-full sm:w-auto">
              <button className="w-full rounded-full border border-white/15 bg-white/[0.04] px-9 py-4 text-sm font-semibold tracking-wide text-sky-100 backdrop-blur-md transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-auto">
                Explore Services
              </button>
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="bofa-bob flex h-10 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
            <span className="h-2 w-1 rounded-full bg-cyan-300" />
          </div>
        </div>
      </header>

      {/* ======================= WORD RIBBON ====================== */}
      <div className="relative border-y border-white/[0.06] bg-blue-950/40 py-5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {["Residential", "Offices", "Eco-Friendly", "Move In / Out", "Deep Cleans"].map((w, i, arr) => (
            <React.Fragment key={w}>
              <span className="transition-colors duration-300 hover:text-cyan-300">{w}</span>
              {i < arr.length - 1 && <span className="text-sky-500/60">✦</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ======================= PHILOSOPHY ======================= */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/60 to-slate-950" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-6 md:grid-cols-[1.1fr_1fr] md:gap-20">
          {/* Left — statement */}
          <div data-reveal="phil-left" className={reveal("phil-left", "md:sticky md:top-28 md:self-start")}>
            <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-sky-300">Who we are</p>
            <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
              More than cleaning —{" "}
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text italic text-transparent">
                it's care, intention, and peace of mind.
              </span>
            </h2>
            <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-300">
              At <span className="font-medium text-white">A Breath of Fresh Air Cleaning Services</span>,
              we believe a clean home is the foundation of a clear mind. We don't rush,
              cut corners, or apply one-size-fits-all solutions.
            </p>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-300">
              Every visit is designed around your space, your lifestyle, and your
              well-being — leaving homes that feel lighter, calmer, and genuinely restorative.
            </p>
          </div>

          {/* Right — pillars with hairline rules */}
          <div className="flex flex-col justify-center">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                data-reveal={`pillar-${i}`}
                style={{ transitionDelay: `${i * 120}ms` }}
                className={reveal(
                  `pillar-${i}`,
                  "group border-t border-white/10 py-8 first:border-t-0 md:first:border-t"
                )}
              >
                <div className="flex items-baseline justify-between gap-6">
                  <h3 className="text-xl font-semibold text-white transition-colors duration-300 group-hover:text-cyan-300 md:text-2xl">
                    {p.title}
                  </h3>
                  <span className="text-sky-500/70 transition-transform duration-500 group-hover:rotate-90">✦</span>
                </div>
                <p className="mt-3 max-w-sm leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== SERVICES ======================== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-emerald-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
        <AmbientField sparkles={false} className="opacity-60" />

        <div className="relative mx-auto max-w-6xl px-6">
          <div data-reveal="svc-head" className={reveal("svc-head", "mb-16 max-w-2xl")}>
            <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-sky-300">What we do</p>
            <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
              Quietly transforming spaces,{" "}
              <span className="italic text-cyan-300">one room at a time</span>
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {services.map((s, i) => (
              <div
                key={s.title}
                data-reveal={`svc-${i}`}
                style={{ transitionDelay: `${i * 100}ms` }}
                className={reveal(
                  `svc-${i}`,
                  "bofa-shine group rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-sky-300/30 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-sky-500/10 md:p-10"
                )}
              >
                <span className="inline-block rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                  {s.tag}
                </span>
                <h3 className="mt-5 text-2xl font-semibold text-white">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-300">{s.desc}</p>
                <Link
                  to="/packages"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-300 transition-colors hover:text-cyan-200"
                >
                  Learn more
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================= GALLERY ======================== */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/70 to-slate-950" />

        <div className="relative mx-auto max-w-7xl">
          <div
            data-reveal="gal-head"
            className={reveal("gal-head", "mb-12 flex flex-wrap items-end justify-between gap-6 px-6")}
          >
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-sky-300">Our work</p>
              <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
                Spaces that feel{" "}
                <span className="bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text italic text-transparent">
                  lighter & cleaner
                </span>
              </h2>
            </div>
            <div className="hidden gap-3 md:flex">
              <button
                onClick={() => scrollGallery(-1)}
                aria-label="Scroll gallery left"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-sky-200 transition-all hover:border-cyan-300/50 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                ←
              </button>
              <button
                onClick={() => scrollGallery(1)}
                aria-label="Scroll gallery right"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-sky-200 transition-all hover:border-cyan-300/50 hover:bg-cyan-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                →
              </button>
            </div>
          </div>

          {/* Film-strip: horizontal scroll-snap, alternating heights */}
          <div
            ref={galleryRef}
            className="bofa-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4"
          >
            {galleryImages.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setSelectedImage(photo)}
                className={`group relative w-[78vw] flex-shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 sm:w-[340px] ${
                  i % 2 === 0 ? "h-[380px] md:h-[440px]" : "h-[380px] md:h-[380px] md:mt-14"
                }`}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                    {photo.category} · {photo.photo_type}
                  </p>
                  <p className="mt-1.5 font-serif text-2xl text-white">{photo.caption}</p>
                </div>
                <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover:opacity-100">
                  ⤢
                </span>
              </button>
            ))}
          </div>

          <p className="mt-6 px-6 text-center text-xs uppercase tracking-[0.3em] text-slate-500 md:hidden">
            Swipe to explore
          </p>
        </div>
      </section>

      {/* ======================== LIGHTBOX ======================== */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.caption}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-blue-950/60 shadow-2xl shadow-sky-500/10 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-lg text-white backdrop-blur-md transition-colors hover:bg-slate-950/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              ×
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5">
              <p className="font-serif text-2xl text-white">{selectedImage.caption}</p>
              <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {selectedImage.category} · <span className="text-emerald-300">{selectedImage.photo_type}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================== CTA BAND ======================== */}
      <section className="relative px-6 py-20 md:py-28">
        <div
          data-reveal="cta"
          className={reveal(
            "cta",
            "relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-sky-300/20 bg-gradient-to-br from-blue-950 via-slate-900 to-emerald-950 px-8 py-16 text-center shadow-2xl shadow-sky-500/10 md:px-16"
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.15),transparent_60%)]" />
          <AmbientField className="opacity-80" />
          <div className="relative">
            <h2 className="font-serif text-3xl leading-tight text-white md:text-5xl">
              Ready for a home that feels like{" "}
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text italic text-transparent">
                a breath of fresh air?
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-slate-300">
              Tell us about your space and we'll design a cleaning plan around it.
            </p>
            <Link to="/contact">
              <button className="bofa-shine mt-9 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-10 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/30 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                Get Your Free Quote
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================= SERVICE AREA ===================== */}
      <ServiceArea />

      {/* ========================= FOOTER ========================= */}
      <footer className="relative border-t border-white/[0.08] bg-slate-950">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-serif text-2xl text-white">
              A Breath of <span className="italic text-cyan-300">Fresh Air</span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Premium eco-friendly home & business cleaning, serving Bristol, CT and
              nearby towns. 🌿
            </p>
          </div>

          <nav aria-label="Footer">
            <h4 className="text-[11px] uppercase tracking-[0.3em] text-sky-300">Explore</h4>
            <ul className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-400">
              {[
                ["Home", "/"],
                ["Services", "/packages"],
                ["Gallery", "/gallery"],
                ["Reviews", "/reviews"],
                ["Contact", "/contact"],
                ["Privacy", "/privacy"],
              ].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="transition-colors hover:text-cyan-300">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] text-sky-300">Get in touch</h4>
            <p className="mt-5 text-sm text-slate-400">📍 Bristol, CT</p>
            <a
              href="mailto:abofacs.inquiries@gmail.com"
              className="mt-2 inline-block text-sm text-slate-400 underline decoration-sky-500/40 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              abofacs.inquiries@gmail.com
            </a>
            <div className="mt-5 flex gap-3">
              {["🌐", "📘", "📸"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/10"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] py-6 text-center text-xs tracking-wide text-slate-500">
          © {new Date().getFullYear()} A Breath of Fresh Air Cleaning Services · All rights reserved
        </div>
      </footer>
    </div>
  );
};

export default HomePage;