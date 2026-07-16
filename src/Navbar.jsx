import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";

/* ------------------------------------------------------------------ */
/*  A Breath of Fresh Air — Navbar (side drawer redesign)              */
/*  Matches HomePage / ServiceArea / ClientInquiry: slate-blue night,  */
/*  sky→cyan accents, serif display, eyebrows, hairline rules, glass.  */
/*  Desktop: inline nav. Below lg: elegant right-side drawer.          */
/* ------------------------------------------------------------------ */

const PUBLIC_LINKS = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/packages" },
  { label: "Gallery", to: "/gallery" },
  { label: "Reviews", to: "/reviews" },
  { label: "Contact", to: "/contact" },
];

const FACEBOOK_URL =
  "https://www.facebook.com/people/A-Breath-of-Fresh-Air-Cleaning-Service/61558246240604";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { admin, logout: adminLogout } = useAdmin();
  const { staff, logout: staffLogout } = useStaff();
  const navigate = useNavigate();
  const location = useLocation();

  const accountRef = useRef(null);
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  const isLoggedIn = !!admin || !!staff;
  const dashboardPath = admin ? "/admin-dashboard" : "/staff-dashboard";

  /* --------------------------- Behaviour --------------------------- */

  // Solidify the bar once the hero scrolls away
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Escape closes drawer / dropdown
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setAccountOpen(false);
      if (menuOpen) {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Click outside closes the account dropdown
  useEffect(() => {
    if (!accountOpen) return;
    const onClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [accountOpen]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Move focus into the drawer when it opens
  useEffect(() => {
    if (menuOpen) drawerRef.current?.focus();
  }, [menuOpen]);

  const handleUniversalLogout = () => {
    if (admin) adminLogout();
    if (staff) staffLogout();
    setAccountOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  const isActive = (to) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  /* ----------------------------- Render ---------------------------- */

  return (
    <>
      <style>{`
        @keyframes nb-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes nb-drop-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.98) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        @keyframes nb-item-in {
          from { opacity: 0; transform: translateX(24px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        .nb-drop { animation: nb-drop-in 0.22s ease-out both; }
        .nb-scrim { animation: nb-fade-in 0.35s ease-out both; }
        .nb-item { animation: nb-item-in 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .nb-scroll { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.3) transparent; }
        .nb-scroll::-webkit-scrollbar { width: 4px; }
        .nb-scroll::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 9999px; }
        @media (prefers-reduced-motion: reduce) {
          .nb-drop, .nb-scrim, .nb-item { animation: none !important; }
          .nb-drawer { transition: none !important; }
        }
      `}</style>

      {/* ============================== BAR ============================== */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen
            ? "border-b border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-slate-950/50"
            : "border-b border-transparent bg-gradient-to-b from-slate-950/70 to-transparent backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3.5" aria-label="A Breath of Fresh Air — home">
            <span className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] p-1 backdrop-blur-md transition-all duration-300 group-hover:border-sky-300/40 group-hover:bg-white/[0.1]">
              <img
                src="/logo2.jpg"
                alt=""
                className="h-11 w-auto rounded-lg object-contain sm:h-12"
              />
            </span>
            <span className="hidden font-serif text-lg leading-tight text-white sm:block">
              A Breath of{" "}
              <span className="italic text-cyan-300">Fresh Air</span>
            </span>
          </Link>

          {/* ---------------------- Desktop nav ---------------------- */}
          <div className="hidden items-center gap-8 lg:flex">
            <ul className="flex items-center gap-7">
              {PUBLIC_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={`relative text-[11px] uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isActive(l.to)
                        ? "text-cyan-300"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {l.label}
                    <span
                      className={`absolute -bottom-1.5 left-0 h-px bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-300 ${
                        isActive(l.to) ? "w-full" : "w-0"
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <span className="h-5 w-px bg-white/10" />

            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-slate-400 transition-colors duration-300 hover:text-sky-300"
            >
              <FaFacebook size={18} />
            </a>

            {/* Account area */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardPath}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-sky-100 backdrop-blur-md transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleUniversalLogout}
                  className="rounded-full border border-rose-400/25 bg-rose-400/[0.07] px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-rose-200 backdrop-blur-md transition-all duration-300 hover:border-rose-400/50 hover:bg-rose-400/15"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-400 transition-colors duration-300 hover:text-white"
                >
                  Staff Portal
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${accountOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {accountOpen && (
                  <div className="nb-drop absolute right-0 top-full mt-4 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl shadow-sky-500/10 backdrop-blur-xl">
                    <p className="px-3 pb-2 pt-2 text-[10px] uppercase tracking-[0.25em] text-sky-300">
                      Staff
                    </p>
                    <Link
                      to="/staff-login"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Staff login
                    </Link>
                    <Link
                      to="/staff-signup"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Staff signup
                    </Link>

                    <div className="my-2 h-px bg-white/10" />

                    <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.25em] text-sky-300">
                      Admin
                    </p>
                    <Link
                      to="/admin-login"
                      onClick={() => setAccountOpen(false)}
                      className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      Admin login
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Link to="/contact">
              <button className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-lg shadow-sky-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-400/40">
                Get a quote
              </button>
            </Link>
          </div>

          {/* ---------------------- Drawer trigger ---------------------- */}
          <button
            ref={triggerRef}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[10px] uppercase tracking-[0.25em] text-sky-100 backdrop-blur-md transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 lg:hidden"
          >
            Menu
            <Menu size={16} />
          </button>
        </div>
      </nav>

      {/* ============================ SCRIM ============================ */}
      {menuOpen && (
        <div
          className="nb-scrim fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-md lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================ DRAWER =========================== */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`nb-drawer fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col border-l border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950 backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none lg:hidden ${
          menuOpen ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        {/* Drawer atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.16),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.1),transparent_60%)]" />

        {/* Drawer header */}
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-5">
          <p className="font-serif text-xl leading-tight text-white">
            A Breath of <span className="italic text-cyan-300">Fresh Air</span>
          </p>
          <button
            onClick={() => {
              setMenuOpen(false);
              triggerRef.current?.focus();
            }}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="nb-scroll relative flex-1 overflow-y-auto px-6 py-8">
          {/* Primary links — large serif, hairline ruled */}
          <nav aria-label="Primary">
            <ul>
              {PUBLIC_LINKS.map((l, i) => (
                <li key={l.to} className="border-b border-white/[0.08]">
                  <Link
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={`nb-item group flex items-center justify-between py-4 font-serif text-2xl transition-colors duration-300 ${
                      isActive(l.to) ? "text-cyan-300" : "text-white hover:text-cyan-300"
                    }`}
                    style={{ animationDelay: menuOpen ? `${80 + i * 55}ms` : "0ms" }}
                  >
                    {l.label}
                    <ArrowUpRight
                      size={18}
                      className="text-sky-500/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Account section */}
          <div className="nb-item mt-10" style={{ animationDelay: menuOpen ? "380ms" : "0ms" }}>
            {isLoggedIn ? (
              <>
                <div className="mb-5 flex items-center gap-4">
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.3em] text-sky-300">
                    Signed in as {admin ? "Admin" : "Staff"}
                  </span>
                  <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
                </div>
                <Link to={dashboardPath} onClick={() => setMenuOpen(false)}>
                  <button className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-3.5 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5">
                    Go to dashboard
                  </button>
                </Link>
                <button
                  onClick={handleUniversalLogout}
                  className="mt-3 w-full rounded-full border border-rose-400/25 bg-rose-400/[0.07] px-6 py-3.5 text-sm font-semibold tracking-wide text-rose-200 transition-all duration-300 hover:border-rose-400/50 hover:bg-rose-400/15"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-4">
                  <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.3em] text-sky-300">
                    Staff portal
                  </span>
                  <span className="h-px w-full bg-gradient-to-r from-sky-500/40 to-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Staff login", "/staff-login"],
                    ["Staff signup", "/staff-signup"],
                  ].map(([label, to]) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)}>
                      <button className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.15em] text-slate-300 transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white">
                        {label}
                      </button>
                    </Link>
                  ))}
                </div>
                <Link to="/admin-login" onClick={() => setMenuOpen(false)}>
                  <button className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.15em] text-slate-300 transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-white">
                    Admin login
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Drawer footer — the one loud action */}
        <div
          className="nb-item relative border-t border-white/10 px-6 py-6"
          style={{ animationDelay: menuOpen ? "440ms" : "0ms" }}
        >
          <Link to="/contact" onClick={() => setMenuOpen(false)}>
            <button className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-6 py-4 text-sm font-semibold tracking-wide text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-300 hover:-translate-y-0.5">
              Get a free quote
            </button>
          </Link>

          <div className="mt-5 flex items-center justify-between">
            <a
              href="mailto:abofacs.inquiries@gmail.com"
              className="text-xs text-slate-500 underline decoration-sky-500/30 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              abofacs.inquiries@gmail.com
            </a>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-sky-300/40 hover:bg-sky-400/10 hover:text-sky-300"
            >
              <FaFacebook size={16} />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;