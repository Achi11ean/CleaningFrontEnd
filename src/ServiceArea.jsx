import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — ServiceArea (redesigned to match HomePage) */
/*  Same tokens: slate/blue night, sky→cyan→emerald accents, serif     */
/*  display with italic gradient, hairline rules, glass, soft bubbles. */
/* ------------------------------------------------------------------ */

const HOME_BASE = "Bristol";

const CITIES = [
  "Avon",
  "Berlin",
  "Bristol",
  "Canton",
  "Farmington",
  "Harwinton",
  "Middlebury",
  "New Britain",
  "Plainville",
  "Simsbury",
  "Southington",
  "Terryville",
  "Thomaston",
  "Waterbury",
  "Watertown",
  "West Hartford",
  "Wolcott",
];

/* Deterministic ambient bubbles — quiet, never overwhelming */
const BUBBLES = Array.from({ length: 10 }, (_, i) => ({
  left: `${(((i * 137.508) % 100) * 0.95 + 2).toFixed(2)}%`,
  size: 6 + ((i * 43) % 18),
  duration: 18 + ((i * 67) % 16),
  delay: -((i * 41) % 28),
  drift: (i % 2 === 0 ? 1 : -1) * (10 + ((i * 29) % 26)),
  opacity: 0.12 + ((i * 11) % 18) / 100,
}));

const ServiceArea = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = document.getElementById("bofa-service-area");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const reveal = (extra = "", delay = 0) => ({
    className: `transition-all duration-1000 ease-out ${extra} ${
      shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
    }`,
    style: { transitionDelay: `${delay}ms` },
  });

  return (
    <section
      id="bofa-service-area"
      className="relative overflow-hidden bg-slate-950 py-24 text-gray-100 md:py-32"
    >
      {/* --------------------------- Atmosphere --------------------------- */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/70 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.13),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.09),transparent_55%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="sa-bubble"
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

      <style>{`
        .sa-bubble {
          position: absolute;
          bottom: -40px;
          border-radius: 9999px;
          background: radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.25) 42%, rgba(56,189,248,0.06) 75%);
          box-shadow: inset 0 0 6px rgba(186,230,253,0.35), 0 0 10px rgba(56,189,248,0.12);
          opacity: 0;
          animation-name: sa-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes sa-rise {
          0%   { transform: translate(0,0) scale(0.9); opacity: 0; }
          8%   { opacity: var(--maxo, 0.2); }
          50%  { transform: translate(var(--drift, 16px), -55vh) scale(1); }
          92%  { opacity: var(--maxo, 0.2); }
          100% { transform: translate(calc(var(--drift, 16px) * -0.6), -110vh) scale(1.05); opacity: 0; }
        }
        /* Dark-tinted Google map so it belongs to the night palette.
           Remove .sa-map-tint from the iframe for the standard light map. */
        .sa-map-tint {
          filter: invert(92%) hue-rotate(180deg) brightness(0.92) contrast(0.92) saturate(0.85);
        }
        @media (prefers-reduced-motion: reduce) {
          .sa-bubble { animation: none !important; opacity: 0 !important; }
          #bofa-service-area [style*="transition-delay"] { transition: none !important; }
        }
      `}</style>

      {/* ---------------------------- Content ----------------------------- */}
      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header + map, side by side on desktop */}
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Left — statement */}
          <div {...reveal()}>
            <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-sky-300">
              Where we work
            </p>

            <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
              Rooted in Bristol,{" "}
              <span className="bg-gradient-to-r from-sky-300 via-cyan-300 to-emerald-300 bg-clip-text italic text-transparent">
                fresh air for 30 miles
              </span>
            </h2>

            <p className="mt-7 max-w-md text-lg leading-relaxed text-slate-300">
              We proudly serve homes and businesses within a 30-mile radius of{" "}
              <span className="font-medium text-white">Bristol, Connecticut</span> —
              from the Farmington Valley down through the Naugatuck hills.
            </p>

            {/* Two honest facts, set as a hairline stat pair */}
            <div className="mt-9 flex divide-x divide-white/10 border-y border-white/10">
              <div className="py-5 pr-8">
                <p className="font-serif text-3xl text-cyan-300">30 mi</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  Radius
                </p>
              </div>
              <div className="py-5 pl-8">
                <p className="font-serif text-3xl text-emerald-300">{CITIES.length}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                  Towns served
                </p>
              </div>
            </div>

            <p className="mt-8 max-w-md text-sm leading-relaxed text-slate-400">
              Just outside the circle? Reach out anyway — we can often make it work.
            </p>

            <Link to="/contact">
              <button className="mt-6 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold tracking-wide text-sky-100 backdrop-blur-md transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
                Ask about your address
              </button>
            </Link>
          </div>

          {/* Right — map in a glass frame */}
          <div {...reveal("relative", 150)}>
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)] blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
              <iframe
                title="Service area map — Bristol, CT"
                src="https://www.google.com/maps?q=41.6718,-72.9493&z=10&output=embed"
                className="sa-map-tint h-[340px] w-full rounded-[1.5rem] border-0 md:h-[460px]"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.25em] text-slate-500">
              Bristol, CT · 41.67° N, 72.95° W
            </p>
          </div>
        </div>

        {/* ------------------------- Town directory ------------------------ */}
        <div {...reveal("mt-20 md:mt-28", 250)}>
          <div className="mb-8 flex items-center gap-5">
            <h3 className="whitespace-nowrap text-[11px] uppercase tracking-[0.35em] text-sky-300">
              Towns we serve
            </h3>
            <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
          </div>

          <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-4">
            {CITIES.map((city) => {
              const isHome = city === HOME_BASE;
              return (
                <li
                  key={city}
                  className="group flex items-baseline justify-between gap-3 border-b border-white/[0.08] py-4"
                >
                  <span
                    className={`text-base transition-colors duration-300 md:text-lg ${
                      isHome
                        ? "font-semibold text-white"
                        : "text-slate-300 group-hover:text-cyan-300"
                    }`}
                  >
                    {city}
                  </span>
                  {isHome ? (
                    <span className="whitespace-nowrap text-[9px] uppercase tracking-[0.2em] text-emerald-300">
                      Home base
                    </span>
                  ) : (
                    <span className="text-sky-500/50 opacity-0 transition-all duration-500 group-hover:rotate-90 group-hover:opacity-100">
                      ✦
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;