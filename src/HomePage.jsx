import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css";
import ServiceArea from "./ServiceArea";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";

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

function Photo({ src, alt, ...props }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className="ch-photo-fallback" role="img" aria-label={alt}><CleaningSparkle /><span>{alt}</span></div> : <img src={src} alt={alt} onError={() => setFailed(true)} {...props} />;
}

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const galleryRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!selectedImage || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [selectedImage]);
  const scrollGallery = (direction) => {
    const gallery = galleryRef.current;
    if (gallery) gallery.scrollBy({ left: direction * Math.min(gallery.clientWidth * .85, 640), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return <CleaningTheme showLoader minimumShowTime={4000}>
    <style>{homeStyles}</style>
    <main>
      <header className="ch-hero ct-shell">
        <div className="ch-hero-copy">
          <span className="ct-eyebrow"><span className="ch-dot"/> Bristol, CT · Eco-friendly cleaning</span>
          <p className="ch-brand">A Breath of Fresh Air Cleaning Services</p>
          <h1>A cleaner space.<br/>A lighter mind.<br/><em>A fresh start.</em></h1>
          <p className="ch-intro">Come home to calm. Thoughtful, detailed cleaning for a space that feels as good as it looks.</p>
          <div className="ch-actions"><Link className="ct-btn" to="/contact">Book a Consultation <span aria-hidden="true">↗</span></Link><Link className="ct-btn ct-btn-secondary" to="/packages">Explore Services</Link></div>
          <div className="ch-hero-note"><CleaningSparkle/><span>Thoughtful care. Beautifully clean.</span></div>
        </div>
        <div className="ch-hero-art">
          <div className="ch-photo-frame"><Photo src="/banner3.png" alt="A fresh, welcoming space"/><span className="ch-image-label">Room to breathe.</span></div>
          <div className="ch-fresh-seal"><CleaningSparkle/><span>A little care.<br/><strong>A lot of fresh.</strong></span></div>
          <div className="ch-float-note"><span className="ch-note-icon">✧</span><div><strong>Freshness, in every detail.</strong><span>For your home. For your peace of mind.</span></div></div>
        </div>
      </header>
      <div className="ch-ribbon"><div className="ct-shell">{["Residential", "Offices", "Eco-Friendly", "Move In / Out", "Deep Cleans"].map(label => <span key={label}><CleaningSparkle/>{label}</span>)}</div></div>

      <section className="ct-section ct-shell" aria-labelledby="services-title">
        <div className="ct-section-heading"><div><span className="ct-eyebrow">01 / A clean for every chapter</span><h2 id="services-title">Your space. <em>Our care.</em></h2></div><Link to="/packages" className="ch-text-link">Explore our services <span aria-hidden="true">↗</span></Link></div>
        <div className="ch-services">{services.map((service, i) => <article className="ct-card ch-service" key={service.title}>
          <div className="ch-service-top"><span className="ch-service-icon" aria-hidden="true">{["⌂", "▦", "❧", "↗"][i]}</span><span className="ct-eyebrow">{service.tag}</span></div>
          <h3>{service.title}</h3><p>{service.desc}</p><Link to="/packages" className="ch-text-link" aria-label={`Learn more about ${service.title}`}>Find your fresh start <span aria-hidden="true">→</span></Link>
        </article>)}</div>
      </section>

      <section className="ch-care-band"><div className="ct-shell ct-section ch-care">
        <div><span className="ct-eyebrow">02 / More than a clean home</span><h2>A little intention.<br/><em>A wonderful difference.</em></h2><p>At A Breath of Fresh Air Cleaning Services, we believe a clean home is the foundation of a clear mind.</p><p>Every visit is designed around your space, your lifestyle, and your well-being. We bring care to the corners and calm to your everyday.</p><Link to="/contact" className="ch-text-link">Let’s talk about your space <span aria-hidden="true">↗</span></Link></div>
        <div className="ch-pillars">{pillars.map((pillar,i) => <article key={pillar.title}><span className="ch-pillar-number">0{i+1}</span><div><h3>{pillar.title}</h3><p>{pillar.desc}</p></div><CleaningSparkle/></article>)}</div>
      </div></section>

      <section className="ct-section ct-shell" aria-labelledby="gallery-title">
        <div className="ct-section-heading"><div><span className="ct-eyebrow">03 / The finishing touches</span><h2 id="gallery-title">Fresh spaces. <em>Real care.</em></h2></div><div className="ch-gallery-controls"><Link to="/gallery" className="ch-text-link">Full gallery ↗</Link><button type="button" onClick={() => scrollGallery(-1)} aria-label="Scroll gallery left">←</button><button type="button" onClick={() => scrollGallery(1)} aria-label="Scroll gallery right">→</button></div></div>
        <div className="ch-gallery" ref={galleryRef}>{galleryImages.map(photo => <button type="button" className="ch-gallery-card" key={photo.id} onClick={() => setSelectedImage(photo)} aria-label={`Enlarge ${photo.caption}`}><div className="ch-gallery-image"><Photo src={photo.image_url} alt={photo.caption} loading="lazy"/><span className="ch-zoom" aria-hidden="true">↗</span></div><div className="ch-gallery-caption"><span className="ct-eyebrow">{photo.category} · {photo.photo_type}</span><h3>{photo.caption}</h3></div></button>)}</div>
        <p className="ch-gallery-hint">A closer look at the little details. Swipe or use the arrows to explore.</p>
      </section>

      <section className="ct-shell ch-cta"><div className="ch-cta-icon"><CleaningSparkle/></div><span className="ct-eyebrow">Make room for what matters</span><h2>Your fresh start<br/><em>is one conversation away.</em></h2><p>Tell us about your space. We’ll build a cleaning plan around you.</p><Link to="/contact" className="ct-btn">Get Your Free Quote <span aria-hidden="true">↗</span></Link></section>
      <div className="ch-service-area"><ServiceArea/></div>
    </main>
    <footer className="ch-footer"><div className="ct-shell ch-footer-grid"><div><p className="ch-footer-brand">A Breath of <em>Fresh Air</em></p><span className="ct-eyebrow">Cleaning Services</span><p>Eco-friendly home & business cleaning.<br/>Bristol, CT and nearby towns.</p></div><nav aria-label="Footer"><span className="ct-eyebrow">Make yourself at home</span><div className="ch-footer-links">{[["Home","/"],["Services","/packages"],["Gallery","/gallery"],["Reviews","/reviews"],["Contact","/contact"],["Privacy","/privacy"]].map(([label,to]) => <Link key={to} to={to}>{label}</Link>)}</div></nav><div><span className="ct-eyebrow">Let’s connect</span><p>Bristol, Connecticut</p><a className="ch-email" href="mailto:abofacs.inquiries@gmail.com">abofacs.inquiries@gmail.com</a></div></div><div className="ct-shell ch-copyright">© {new Date().getFullYear()} A Breath of Fresh Air Cleaning Services · All rights reserved</div></footer>
    {selectedImage && <dialog ref={dialogRef} className="ch-lightbox" aria-label={selectedImage.caption} onCancel={() => setSelectedImage(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedImage(null); }}><div className="ch-lightbox-inner"><button type="button" className="ch-close" aria-label="Close image" autoFocus onClick={() => setSelectedImage(null)}>×</button><Photo src={selectedImage.image_url} alt={selectedImage.caption}/><div className="ch-lightbox-caption"><h3>{selectedImage.caption}</h3><p>{selectedImage.category} · {selectedImage.photo_type}</p></div></div></dialog>}
  </CleaningTheme>;
}

const homeStyles = `
.ch-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:65px;align-items:center;padding-top:130px;padding-bottom:76px}.ch-dot{height:7px;width:7px;background:#6ee7b7;border-radius:50%;box-shadow:0 0 0 5px #6ee7b71a}.ch-brand{font-size:12px;font-weight:600;margin-top:25px!important;color:var(--ct-muted)}.ch-hero h1{font-size:clamp(46px,5.5vw,76px);line-height:1.05;margin-top:16px}.ch-intro{font-size:16px;line-height:1.8;max-width:420px;color:var(--ct-muted);margin-top:23px!important}.ch-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.ch-hero-note{display:flex;align-items:center;gap:10px;margin-top:25px;color:var(--ct-muted);font-size:11px}.ch-hero-note svg{width:17px;color:var(--ct-teal)}.ch-hero-art{position:relative;padding:15px 10px 25px}.ch-photo-frame{height:480px;border-radius:180px 180px 28px 28px;overflow:hidden;position:relative;background:#102c47;box-shadow:0 28px 60px #174e501a;border:6px solid #74cde52b}.ch-photo-frame:after{content:'';position:absolute;inset:45% 0 0;background:linear-gradient(transparent,#103e497a);pointer-events:none}.ch-photo-frame>img{width:100%;height:100%;object-fit:cover}.ch-image-label{position:absolute;bottom:38px;left:28px;color:white;font:italic 35px Georgia;z-index:1}.ch-fresh-seal{position:absolute;right:-14px;top:8px;width:111px;height:111px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border-radius:50%;background:#123e4c;border:5px solid #050c19;transform:rotate(9deg);font-size:11px;line-height:1.6;box-shadow:0 8px 24px #224f5014}.ch-fresh-seal svg{width:23px;height:23px;color:#6ee7b7;margin-bottom:6px}.ch-float-note{position:absolute;top:57%;bottom:auto;left:-16px;display:flex;align-items:center;gap:8px;background:#0a1b30ed;padding:9px 12px;border:1px solid var(--ct-line);border-radius:13px;box-shadow:0 14px 38px #174e501a;backdrop-filter:blur(12px)}.ch-float-note strong,.ch-float-note span:not(.ch-note-icon){display:block;font-size:10px}.ch-float-note div span{color:var(--ct-muted);margin-top:4px;font-size:9px!important}.ch-note-icon{font-size:26px;color:var(--ct-teal)}.ch-ribbon{border-block:1px solid var(--ct-line);background:#0d1e35cc;padding:21px 0}.ch-ribbon>div{display:flex;flex-wrap:wrap;justify-content:space-between;gap:18px}.ch-ribbon span{display:flex;align-items:center;gap:12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:650}.ch-ribbon svg{width:12px;height:12px;color:#67e8f9}.ch-text-link{display:inline-flex;align-items:center;gap:16px;font-size:12px;font-weight:700;color:var(--ct-teal)!important}.ch-text-link:hover{text-decoration:underline}.ch-services{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.ch-service{padding:24px;display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s}.ch-service:hover{transform:translateY(-5px);box-shadow:0 18px 40px #174e5020}.ch-service-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.ch-service-top .ct-eyebrow{font-size:8px;letter-spacing:.08em}.ch-service-icon{height:44px;width:44px;background:#17354b;border-radius:14px;color:var(--ct-teal);display:grid;place-items:center;font-size:28px;flex-shrink:0}.ch-service h3{font-size:18px;line-height:1.3;margin-top:23px}.ch-service p{font-size:12px;margin:12px 0 24px}.ch-service .ch-text-link{margin-top:auto;font-size:11px;gap:8px}.ch-care-band{background:#081528dd;border-block:1px solid var(--ct-line)}.ch-care{display:grid;grid-template-columns:1fr 1fr;gap:90px;align-items:center}.ch-care h2{margin:14px 0 24px}.ch-care p{font-size:14px;margin-top:12px;max-width:470px}.ch-care .ch-text-link{margin-top:22px}.ch-pillars article{display:flex;align-items:start;gap:18px;padding:25px 0;border-bottom:1px solid #7dd3fc26}.ch-pillars article:last-child{border:0}.ch-pillar-number{color:#7dd3fc;font:italic 22px Georgia}.ch-pillars h3{font-size:16px}.ch-pillars p{font-size:12px;margin-top:9px}.ch-pillars svg{width:17px;flex-shrink:0;color:#6ee7b7;margin-left:auto}.ch-gallery-controls{display:flex;align-items:center;gap:10px}.ch-gallery-controls .ch-text-link{margin-right:10px}.ch-gallery-controls button{border:1px solid var(--ct-line);background:#0c1c31;border-radius:50%;height:43px;width:43px;color:var(--ct-ink)}.ch-gallery{display:flex;gap:19px;overflow-x:auto;scroll-snap-type:x mandatory;padding:4px 2px 16px;scrollbar-width:thin;scrollbar-color:#91c6bc transparent}.ch-gallery-card{text-align:left;flex:0 0 270px;border:1px solid var(--ct-line);background:#0c1c31;border-radius:22px;overflow:hidden;scroll-snap-align:start;color:var(--ct-ink);padding:0}.ch-gallery-image{height:260px;position:relative;overflow:hidden;background:#10253d}.ch-gallery-image img{height:100%;width:100%;object-fit:cover;transition:transform .6s}.ch-gallery-card:hover img{transform:scale(1.045)}.ch-zoom{position:absolute;top:13px;right:13px;width:33px;height:33px;display:grid;place-items:center;border-radius:50%;background:#102941ed;color:var(--ct-teal)}.ch-gallery-caption{padding:19px}.ch-gallery-caption .ct-eyebrow{font-size:8px;letter-spacing:.1em}.ch-gallery-caption h3{font:23px Georgia;margin-top:7px}.ch-gallery-hint{font-size:11px;text-align:center;margin-top:12px!important}.ch-cta{text-align:center;padding:48px 22px 53px;border:1px solid #7dd3fc44;border-radius:32px;background:radial-gradient(ellipse at top,#28658a66,transparent 65%),linear-gradient(120deg,#101d39,#071629);position:relative;overflow:hidden}.ch-cta-icon{width:35px;margin:0 auto 18px;color:var(--ct-teal)}.ch-cta h2{font-size:clamp(32px,4.5vw,54px);line-height:1.08;margin:15px 0 20px}.ch-cta p{font-size:14px;line-height:1.8;color:var(--ct-muted);margin-bottom:23px}.ch-service-area{margin-top:60px}.ch-footer{border-top:1px solid var(--ct-line);background:#040b17;padding-top:48px}.ch-footer-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:40px;padding-bottom:40px}.ch-footer-brand{font:27px Georgia}.ch-footer p:not(.ch-footer-brand){font-size:12px;line-height:1.9;color:var(--ct-muted);margin-top:15px}.ch-footer-links{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:18px;font-size:12px}.ch-footer a:hover{color:var(--ct-teal);text-decoration:underline}.ch-email{font-size:12px;overflow-wrap:anywhere}.ch-copyright{padding-block:20px;border-top:1px solid var(--ct-line);font-size:10px;line-height:1.7;color:var(--ct-muted)}.ch-photo-fallback{width:100%;height:100%;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:15px;background:linear-gradient(145deg,#173b54,#08162b);color:#ccf6ff}.ch-photo-fallback svg{width:45px}.ch-photo-fallback span{font:22px Georgia}.ch-lightbox{position:fixed;inset:0;margin:auto;padding:0;max-width:min(900px,calc(100vw - 32px));max-height:90dvh;border:1px solid #7dd3fc33;border-radius:23px;background:#050c19;color:#edfaff;overflow:auto;box-shadow:0 25px 100px #0004}.ch-lightbox::backdrop{background:#103c48c9;backdrop-filter:blur(9px)}.ch-lightbox-inner{position:relative}.ch-lightbox img{display:block;max-height:72dvh;max-width:100%;margin:auto;object-fit:contain}.ch-close{position:absolute;right:14px;top:14px;z-index:2;width:42px;height:42px;border:1px solid #7dd3fc33;border-radius:50%;background:#0c1c31;font-size:28px!important;color:#edfaff}.ch-lightbox-caption{padding:20px 25px}.ch-lightbox-caption h3{font:26px Georgia}.ch-lightbox-caption p{font-size:12px;margin-top:7px}
@media(max-width:1000px){.ch-hero{gap:30px}.ch-photo-frame{height:440px}.ch-services{grid-template-columns:repeat(2,minmax(0,1fr))}.ch-care{gap:40px}.ch-footer-grid{grid-template-columns:1fr 1fr}.ch-float-note{left:-8px;padding:8px 10px}.ch-hero .ct-btn{padding:12px 17px;font-size:12px}}
@media(max-width:640px){.ch-hero{grid-template-columns:1fr;padding-top:105px;padding-bottom:38px;gap:25px}.ch-hero h1{font-size:clamp(42px,11.5vw,64px)}.ch-hero-copy>.ct-eyebrow{font-size:8px;letter-spacing:.1em}.ch-brand{margin-top:20px!important;font-size:11px}.ch-intro{font-size:14px}.ch-actions{gap:9px}.ch-actions .ct-btn{flex:1;white-space:nowrap;font-size:11px;padding-inline:12px;gap:10px}.ch-hero-art{width:min(100%,380px);margin:auto;padding-inline:15px}.ch-photo-frame{height:320px;border-radius:140px 140px 24px 24px}.ch-image-label{font-size:30px;bottom:28px}.ch-fresh-seal{right:0;width:95px;height:95px;font-size:10px}.ch-ribbon>div{justify-content:center;gap:14px 20px}.ch-ribbon span{font-size:8px;gap:7px;letter-spacing:.08em}.ch-service{padding:18px}.ch-service h3{font-size:17px;margin-top:17px}.ch-service-top{align-items:start;flex-direction:column}.ch-service p{font-size:12px}.ch-service .ch-text-link{font-size:10px}.ch-services{gap:10px}.ch-care{grid-template-columns:1fr;gap:15px}.ch-gallery-card{flex-basis:78vw;max-width:300px}.ch-gallery-image{height:260px}.ch-cta{padding:35px 19px;border-radius:25px}.ch-cta p{font-size:12px}.ch-footer-grid{grid-template-columns:1fr;gap:28px}.ch-service-area{margin-top:40px}.ch-gallery-hint{font-size:10px}.ch-hero-note{margin-top:18px}}
`;
