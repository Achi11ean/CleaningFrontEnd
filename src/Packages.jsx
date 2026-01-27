import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://cleaningback.onrender.com"; // adjust if needed

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleViewPackage = (pkg) => setSelectedPackage(pkg);
  const closeModal = () => setSelectedPackage(null);

  // 🔹 Fetch from backend
  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/services/public`);
        setPackages(res.data || []);
      } catch (err) {
        setError("Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <div className="w-full min-h-screen pt-6 bg-gradient-to-b from-black via-gray-900 to-black text-gray-100">
      {/* Header */}
      <br /><br />
    {/* Hero Header */}
<header className="relative text-center mt-10 mb-10 px-6 py-14 overflow-hidden">

  {/* Soft glowing background accents */}
  <div className="absolute inset-0">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] 
                    bg-blue-600/20 blur-3xl rounded-full" />
    <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] 
                    bg-cyan-500/10 blur-3xl rounded-full" />
  </div>

  {/* Content */}
  <div className="relative z-10 max-w-5xl mx-auto">

    {/* Small badge */}
    <div className="inline-block mb-4 px-5 py-1 rounded-full 
                    bg-gradient-to-r from-blue-600/20 to-blue-900/30 
                    border border-blue-500/40 text-blue-300 text-sm font-semibold tracking-wider uppercase">
      Premium Cleaning Services
    </div>

    {/* Main Title */}
    <h1
      className="text-5xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-widest 
                 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 
                 drop-shadow-[0_4px_20px_rgba(59,130,246,0.6)]"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      Cleaning Packages
    </h1>

    {/* Decorative line */}
    <div className="flex items-center justify-center mt-6 mb-6">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      <div className="mx-3 text-blue-400">✦</div>
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
    </div>

    {/* Subtitle */}
    <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl 
                  font-medium leading-relaxed text-gray-200 
                  bg-gradient-to-r from-blue-600/20 to-black/40 
                  px-8 py-6 rounded-xl border border-blue-700/40 
                  shadow-[0_0_40px_rgba(59,130,246,0.15)]">
      Premium Eco-Friendly Home & Business Cleaning  
      <br /><br />
      Using only <span className="text-blue-300 font-semibold">EWG-rated A or higher</span>, non-toxic products  
      safe for your family, pets, and the planet.  
      Our expert team delivers <span className="text-blue-300 font-semibold">detailed, reliable cleaning</span>  
      tailored to your needs.
    </p>
  </div>
</header>


      {/* States */}
      {loading && (
        <div className="text-center py-20 text-gray-400 font-semibold">
          Loading services...
        </div>
      )}

      {error && (
        <div className="text-center py-10 text-red-500 font-semibold">
          {error}
        </div>
      )}

      {/* Package Grid */}
      {!loading && !error && (
        <section className="px-6 mt-10 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => handleViewPackage(pkg)}
                className="relative bg-gradient-to-b from-gray-800 to-black border border-blue-600 
                           rounded-lg shadow-xl transition-all transform hover:scale-105 
                           hover:shadow-blue-500/30 text-left group overflow-hidden"
              >
                {/* 🖼️ Image Header */}
                {pkg.image_url ? (
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={pkg.image_url}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-gray-400 text-sm">
                    No Image
                  </div>
                )}

                {/* Card Body */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-blue-400 uppercase tracking-wide mb-2 group-hover:text-white transition">
                    {pkg.title}
                  </h2>
                  <p className="text-gray-300 line-clamp-4 text-sm whitespace-pre-line">
                    {pkg.description}
                  </p>
                  <span className="block mt-4 text-sm font-semibold text-blue-400 underline group-hover:text-white transition">
                    View Details
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-2 sm:px-4">
          <div
            className="relative bg-gradient-to-b from-gray-900 to-black border border-blue-600 shadow-2xl 
                       w-full max-w-lg sm:max-w-2xl p-6 sm:p-10 max-h-[90vh] overflow-y-auto rounded-lg"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-400 text-3xl font-bold transition"
            >
              ×
            </button>

            {/* Optional Modal Image */}
            {selectedPackage.image_url && (
              <img
                src={selectedPackage.image_url}
                alt={selectedPackage.title}
                className="w-full h-64 object-cover rounded mb-6 border border-blue-700/40"
              />
            )}

            {/* Modal Content */}
            <h2 className="text-3xl font-bold border-b-2 text-blue-400 mb-6 uppercase tracking-wider drop-shadow">
              {selectedPackage.title}
            </h2>

            <p className="text-gray-200 whitespace-pre-line leading-relaxed text-base">
              {selectedPackage.description}
            </p>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                to="/contact"
                className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold 
                           text-lg px-8 py-3 rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-700 
                           hover:shadow-blue-500/40 transform hover:scale-105 transition-all"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
