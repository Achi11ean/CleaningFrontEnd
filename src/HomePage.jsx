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
    { id: 4, image_url: "/slider4.jpeg", caption: "Fresh Bathroom", category: "Bathroom", photo_type: "Sanitized" },
    { id: 5, image_url: "/slider5.jpeg", caption: "Shiny Floors", category: "Floors", photo_type: "Polished" },
    { id: 6, image_url: "/slider6.jpeg", caption: "Office Care", category: "Commercial", photo_type: "Daily" },
    { id: 7, image_url: "/slider7.jpeg", caption: "Window Bright", category: "Windows", photo_type: "Detailed" },
    { id: 8, image_url: "/slider8.jpeg", caption: "Eco-Friendly", category: "Green Clean", photo_type: "Non-Toxic" },
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
   <div className="bg-gradient-to-b from-slate-900 via-blue-950 to-black border-t-8 border-blue-600 pt-24 shadow-2xl min-h-screen mx-auto text-gray-100">
  {/* Hero Section */}
  <section className="py-12 text-center relative overflow-hidden">
    {/* Decorative glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.25),transparent)] pointer-events-none"></div>

    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-poppins text-blue-400 leading-snug drop-shadow-md">
      Transform Your Space with:
      <br />
      <span className="block text-4xl md:text-7xl font-serif text-white mt-2 tracking-wide">
        🌬️ A Breath of Fresh Air 🫧
      </span>
    </h1>
  </section>

  {/* About Section */}
  <section className="text-center px-4 md:px-12 my-8 max-w-6xl mx-auto">
    <h2 className="text-2xl md:text-4xl font-extrabold text-blue-400 border-b-4 border-blue-600 inline-block pb-2 drop-shadow-lg">
      About Us
    </h2>
    <p className="mt-6 text-lg md:text-xl text-gray-300 leading-relaxed">
      At <strong className="text-white">A Breath of Fresh Air Cleaning Services</strong>, we go beyond
      surface cleaning to create healthier, more peaceful homes. <br className="hidden sm:block" />
      We understand the connection between your home and mental health, offering customized cleaning
      plans to fit your needs. <br className="hidden sm:block" />
      Choose us to transform your home into a sanctuary—for your health, your family, and your peace of mind.
    </p>

    {/* Quick Links */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
      <Link to="/contact">
        <button className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
          Contact Us!
        </button>
      </Link>
      <Link to="/gallery">
        <button className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
          View Gallery
        </button>
      </Link>
      <Link to="/packages">
        <button className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
          Services
        </button>
      </Link>
      <Link to="/reviews">
        <button className="w-full px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
          Reviews
        </button>
      </Link>
    </div>
  </section>

      {/* Divider */}
      <div className="w-full h-1 bg-black mx-auto"></div>

      {/* Gallery Section */}
      <section className="py-12 bubble-container bg-gradient-to-t from-blue-600 via-black to-blue-600">
        <div className="max-w-7xl mx-auto px-2">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            speed={2000}
            loop={true}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              768: { slidesPerView: 3, spaceBetween: 30 },
              1024: { slidesPerView: 5, spaceBetween: 40 },
            }}
          >
            {galleryImages.map((photo) => (
              <SwiperSlide key={photo.id}>
                <div className="relative group rounded-xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-2xl">
                  <img
                    src={photo.image_url}
                    alt={photo.caption}
                    className="w-full h-64 object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 cursor-pointer"
                    onClick={() => setSelectedImage(photo)}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-500"></div>
                  {/* Caption */}
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-xl font-semibold">{photo.caption}</p>
                    <p className="text-sm text-gray-300">{photo.category}</p>
                    <p className="text-sm text-yellow-400">{photo.photo_type}</p>
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
        <li><Link to="/contact">Contact</Link></li>
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
