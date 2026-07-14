import { Cog } from "lucide-react";

const Footer = () => {
  return (
    <>
      <footer className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-black py-3">

        {/* Top Accent */}
        <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-orange-600 via-amber-400 to-red-600" />

        {/* Background Gear */}
        <div className="gear-bg" aria-hidden="true">
          <Cog size={180} strokeWidth={1.2} />
        </div>

        {/* Soft Glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_70%)]" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">

          <a
            href="https://jwhitproductions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-link inline-flex items-center gap-2 text-amber-300 transition-all duration-300 hover:text-yellow-200"
          >
            <Cog size={14} strokeWidth={2.2} />

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs">
              © {new Date().getFullYear()} JWHIT Productions
            </span>
          </a>

          <div className="mx-auto my-2 h-px w-20 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <p className="mx-auto max-w-3xl text-[10px] leading-relaxed text-gray-400 sm:text-[11px]">
            All Rights Reserved • Patent Pending • Unauthorized reproduction
            or distribution of any portion of this website is strictly
            prohibited.
          </p>
        </div>

        {/* Bottom Accent */}
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-orange-600 via-amber-400 to-red-600" />
      </footer>

      <style>{`
        /* ==========================
           Background Gear
        ========================== */

        .gear-bg{
          position:absolute;
          inset:0;
          display:flex;
          align-items:center;
          justify-content:center;
          pointer-events:none;
          overflow:hidden;
          z-index:0;
        }

        .gear-bg svg{
          width:180px;
          height:180px;
          color:#f59e0b;
          opacity:.045;
          animation:gearSpin 30s linear infinite;
          transform-origin:center;
        }

        @media (max-width:640px){

          .gear-bg svg{
            width:105px;
            height:105px;
            opacity:.03;
          }

        }

        @keyframes gearSpin{
          from{
            transform:rotate(0deg);
          }
          to{
            transform:rotate(360deg);
          }
        }

        /* ==========================
           Brand Shimmer
        ========================== */

        .brand-link{
          position:relative;
          overflow:hidden;
        }

        .brand-link::before{
          content:"";
          position:absolute;
          inset:0;
          background:linear-gradient(
            115deg,
            transparent 25%,
            rgba(255,255,255,.35) 50%,
            transparent 75%
          );
          transform:translateX(-220%);
          animation:shine 4s linear infinite;
        }

        @keyframes shine{
          to{
            transform:translateX(220%);
          }
        }
      `}</style>
    </>
  );
};

export default Footer;