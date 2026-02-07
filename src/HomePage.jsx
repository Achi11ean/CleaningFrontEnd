import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Tailwind CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import ServiceArea from "./ServiceArea";

const HomePage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Static images
  const galleryImages = [
    { id: 1, image_url: "/slider1.jpeg", caption: "Fresh Start", category: "Residential", photo_type: "Before/After" },
    { id: 2, image_url: "/slider2.jpeg", caption: "Sparkling Kitchen", category: "Kitchen", photo_type: "After" },
    { id: 3, image_url: "/slider3.jpeg", caption: "Relaxed Living", category: "Living Room", photo_type: "Clean" },
    { id: 4, image_url: "/slider4.jpeg", caption: "Eco-Friendly", category: "Green Clean", photo_type: "Non-Toxic"  },
    { id: 5, image_url: "/slider5.jpeg", caption: "Shiny Floors", category: "Floors", photo_type: "Polished" },
    { id: 6, image_url: "/slider6.jpeg", caption: "Fridgerator", category: "Home Care", photo_type: "Weekly" },
    { id: 7, image_url: "/slider7.jpeg", caption: "Faucet Care", category: "Sinks", photo_type: "Shiny" },
    { id: 8, image_url: "/slider8.jpeg", caption: "Fresh Bathroom", category: "Bathroom", photo_type: "Sanitized" },
  ];

  const sections = [
    {
      title: "Residential Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          Residential cleaning is our specialty! From cozy kitchens to serene bedrooms, we ensure your home feels fresh and inviting.
        </p>
      ),
    },
    {
      title: "Office Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          A tidy workspace promotes productivity. We’ll keep your office spotless so you can focus on success.
        </p>
      ),
    },
    {
      title: "Eco-Friendly Solutions",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          We use only non-toxic, eco-friendly products that are safe for your family, pets, and the planet.
        </p>
      ),
    },
    {
      title: "Moving Day Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          Moving? Let us take care of the cleaning so you can focus on settling in.
        </p>
      ),
    },
  ];

  // Cycle info sections every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sections.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [sections.length]);

  return (
   <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black border-t-8 border-blue-600 pt-16 lg-pt:24 shadow-2xl min-h-screen mx-auto text-gray-100">
  {/* Hero Section */}
<section className="relative h-[420px] md:h-[520px] lg:h-[620px] w-full overflow-hidden">
  {/* Background Image */}
  <img
    src="/banner3.png"
    alt="Fresh, clean home"
    className="absolute inset-0 h-full w-full object-cover"
  />

  {/* Base dark gradient */}
  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/60" />

  {/* EXTRA bottom darkness for paragraph readability */}
  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/85 via-black/60 to-transparent" />

  {/* Soft glow accent (kept subtle) */}
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.30),transparent_60%)] pointer-events-none" />

  {/* Content */}
  <div className="relative z-10 flex h-full items-center  justify-center ">
    <div className="max-w-4xl text-center">
      <h1 className="font-poppins text-2xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-xl">
        Transform Your Space with:
      </h1>

      <div className="mt-4">
        <span className="inline-block w-full border-white border py-2 rounded-full bg-black/70 font-[serif] text-4xl md:text-6xl lg:text-7xl text-cyan-300 tracking-wide drop-shadow-2xl">
          A Breath of Fresh Air 🫧
        </span>
      </div>

      <p className="mt-6 text-sm md:text-base lg:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
        Thoughtful, detailed cleaning that leaves your home refreshed, calm,
        and beautifully maintained.
      </p>
    </div>
  </div>
</section>



  {/* About Section */}
<section className="relative overflow-hidden border-t py-4 px-6 md:px-16">
  {/* Ambient background */}
  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-950 via-blue-950 to-emerald-950" />
  <div className="absolute inset-0 -z-10 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_60%)]" />

  {/* Content container */}
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
    
    {/* LEFT — Copy */}
    <div className="text-left">
      <h2 className="text-sm uppercase tracking-widest text-sky-300 mb-4">
        Who We Are
      </h2>

      <h3 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
        More than cleaning.  
        <span className="block bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
          A breath of fresh air.
        </span>
      </h3>

      <p className="mt-6 text-lg text-gray-300 leading-relaxed">
        At <span className="font-semibold text-white">A Breath of Fresh Air Cleaning Services</span>,
        we believe a clean home is the foundation of a clear mind.
        We don’t rush, cut corners, or apply one-size-fits-all solutions.
      </p>

      <p className="mt-4 text-lg text-gray-300 leading-relaxed">
        Every service is thoughtfully designed around your space, your lifestyle,
        and your well-being — creating homes that feel lighter, calmer,
        and genuinely restorative.
      </p>

      <p className="mt-4 text-lg text-gray-300 leading-relaxed">
        This isn’t just cleaning.  
        <span className="text-white font-medium"> It’s care, intention, and peace of mind.</span>
      </p>

      {/* Primary CTA */}
      <div className="mt-10 flex flex-wrap gap-4">
        <Link to="/contact">
          <button className="
            px-8 py-4
            rounded-full
            font-bold
            text-white
            bg-gradient-to-r from-sky-500 to-cyan-400
            shadow-xl shadow-sky-500/30
            hover:scale-105
            hover:shadow-emerald-400/40
            transition-all duration-300
          ">
            Book a Consultation
          </button>
        </Link>

        <Link to="/packages">
          <button className="
            px-8 py-4
            rounded-full
            font-semibold
            text-sky-200
            border border-sky-400/40
            backdrop-blur
            hover:bg-sky-400/10
            hover:text-white
            transition-all duration-300
          ">
            View Services
          </button>
        </Link>
      </div>
    </div>

    {/* RIGHT — Feature cards */}
    <div className="grid gap-6">
      {[
        {
          title: "Wellness-Focused Cleaning",
          desc: "A mindful approach that supports mental clarity and emotional balance."
        },
        {
          title: "Customized Care",
          desc: "Every home is different — your cleaning plan should be too."
        },
        {
          title: "Trusted & Detail-Oriented",
          desc: "We treat your space with the same respect we’d want in our own homes."
        }
      ].map((item, i) => (
        <div
          key={i}
          className="
            p-6 rounded-2xl
            bg-white/5
            border border-white/10
            backdrop-blur-xl
            shadow-lg
            hover:bg-white/10
            transition
          "
        >
          <h4 className="text-xl font-semibold text-white mb-2">
            {item.title}
          </h4>
          <p className="text-gray-300">
            {item.desc}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Divider */}

      {/* Gallery Section */}
     <section className="relative py-6 overflow-hidden">
  {/* Atmospheric background */}
  <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950 via-blue-950 to-emerald-950" />
  <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),transparent_65%)]" />

  {/* Section header */}
  <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
    <h2 className="text-sm uppercase tracking-[0.3em] text-sky-300 mb-4">
      Our Work
    </h2>

    <h3 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
      Spaces that feel  
      <span className="block bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
        lighter, calmer, cleaner
      </span>
    </h3>

    <p className="mt-6 max-w-3xl mx-auto text-lg text-gray-300">
      Every space tells a story.  
      Here’s what thoughtful, intentional cleaning looks like.
    </p>
  </div>

  {/* Carousel */}
  <div className="max-w-[90rem] mx-auto px-4">
    <Swiper
      modules={[Navigation, Pagination, Autoplay]}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      speed={2500}
      loop
      spaceBetween={40}
      slidesPerView={1}
      breakpoints={{
        640: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
      }}
    >
      {galleryImages.map((photo) => (
        <SwiperSlide key={photo.id}>
          <div
            className="
              group relative h-[340px] rounded-3xl overflow-hidden
              bg-black/20
              backdrop-blur-xl
              shadow-xl shadow-black/40
              transition-all duration-700
              hover:-translate-y-2
              hover:shadow-sky-500/30
            "
          >
            {/* Image */}
            <img
              src={photo.image_url}
              alt={photo.caption}
              onClick={() => setSelectedImage(photo)}
              className="
                absolute inset-0 w-full h-full object-cover
                transition-transform duration-[2000ms] ease-out
                group-hover:scale-110
                cursor-pointer
              "
            />

            {/* Soft vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

            {/* Floating caption card */}
            <div
              className="
                absolute bottom-6 left-6 right-6
                p-4 rounded-2xl
                bg-white/10
                backdrop-blur-xl
                border border-white/20
                text-white
                opacity-0
                translate-y-6
                group-hover:opacity-100
                group-hover:translate-y-0
                transition-all duration-700
              "
            >
              <p className="text-lg font-semibold leading-tight">
                {photo.caption}
              </p>
              <div className="mt-1 flex justify-between text-sm text-gray-300">
                <span>{photo.category}</span>
                <span className="text-emerald-300">{photo.photo_type}</span>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl w-full p-4 bg-white rounded-lg shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-gray-800">
                {selectedImage.caption}
              </p>
              <p className="text-sm text-gray-600">
                Category: {selectedImage.category}
              </p>
              <p className="text-sm text-yellow-500">
                Type: {selectedImage.photo_type}
              </p>
            </div>
          </div>
        </div>
      )}

      <ServiceArea />
     <div className="bg-gradient-to-b from-black via-gray-900 to-black text-gray-300 py-10 border-t border-blue-600">
  <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 divide-y divide-gray-700 lg:divide-y-0 lg:divide-x lg:divide-gray-700">
    {/* Company Info */}
    <div className="pr-0 lg:pr-6">
      <h3 className="text-xl font-bold text-blue-400 mb-4">A Breath of Fresh Air</h3>
      <p className="text-sm">
        Premium eco-friendly home & business cleaning.  
        Serving Bristol, CT and nearby towns. 🌿✨
      </p>
    </div>

    {/* Quick Links */}
    <div className="pt-6 sm:pt-0 lg:px-6">
      <h4 className="text-lg font-semibold text-white mb-3">Quick Links</h4>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/packages">Services</Link></li>
        <li><Link to="/gallery">Gallery</Link></li>
        <li><Link to="/reviews">Reviews</Link></li>
<li>
  <a href="https://www.honeybook.com/widget/_294956/cf_id/690ceb0d1a673a002c963efb">
    Contact
  </a>
</li>
      </ul>
    </div>

    {/* Contact Info */}
    <div className="pt-6 sm:pt-0 lg:pl-6">
      <h4 className="text-lg font-semibold text-white mb-3">Get in Touch</h4>
      <p className="text-sm">📍 Bristol, CT</p>
      <p className="text-sm">
        📧{" "}
        <a
          href="mailto:Abofacs.inquiries@gmail.com"
          className="hover:text-blue-400 underline"
        >
          abofacs.inquiries@gmail.com
        </a>
      </p>
      <div className="flex space-x-4 mt-3">
        <a href="#" className="hover:text-blue-400">🌐</a>
        <a href="#" className="hover:text-blue-400">📘</a>
        <a href="#" className="hover:text-blue-400">📸</a>
      </div>
    </div>
  </div>

  {/* Bottom Bar */}
  <div className="mt-8 text-center text-xs text-gray-500">
    © 2025 A Breath of Fresh Air Cleaning Services. All rights reserved. |{" "}
    <Link to="/privacy" className="hover:text-blue-400">Privacy Policy</Link>
  </div>
</div>

    </div>
  );
};

export default HomePage;
