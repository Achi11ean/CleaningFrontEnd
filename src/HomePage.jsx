import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Tailwind CSS
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const HomePage = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // Tracks the clicked image

  const openModal = (photo) => {
    console.log("Opening Modal with Photo Data:", photo); // Debug
    setSelectedImage(photo); // Pass the entire photo object
  };

  const closeModal = () => setSelectedImage(null); // Close modal

  // Fetch gallery images
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/gallery")
      .then((response) => response.json())
      .then((data) => {
        setGalleryImages(data);
      })
      .catch((error) => console.error("Error fetching gallery:", error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full  text-gray-800">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 text-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:flex lg:items-center lg:space-x-12">
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <img
              src="sexyman.jpg"
              alt="About Me"
              className="rounded-3xl shadow-lg w-full h-96 object-cover"
            />
          </div>

          {/* Text Section */}
          <div className="lg:w-1/2">
          <h2
  className="text-4xl font-bold text-gray-900 mb-6 text-center lg:text-center font-serif"
  style={{
    fontFamily: "'Times New Roman', Times, serif", // Classic newspaper font
    letterSpacing: "0.05em", // Slight letter spacing
    lineHeight: "1.2", // Compact line height
    textTransform: "uppercase", // Uppercase for a traditional feel
  }}
>
  About Me
</h2>


            <div
  className="max-h-[200px] overflow-y-auto p-4 bg-gray-100 rounded-lg shadow-inner custom-scrollbar"
>
  <p className="text-lg leading-relaxed mb-4">
    Hi, I'm{" "}
    <span className="font-semibold text-blue-600">Arif Kycyku</span>, a passionate photographer dedicated to capturing life's most precious moments. With years of experience in portraits, events, and creative photography, I strive to turn fleeting memories into timeless keepsakes.
  </p>
  <p className="text-lg leading-relaxed mb-4">
    I believe every picture tells a story, and I'm here to tell yours. Whether it’s a serene golden hour portrait, a lively family event, or a unique creative project, I bring creativity, care, and professionalism to every shot.
  </p>
  <p className="text-lg leading-relaxed mb-4">
    My journey into photography started with a simple camera and a love for capturing beauty in everyday life. Over the years, I've honed my craft to deliver high-quality, stunning visuals that my clients cherish. From candid moments to meticulously planned shoots, I ensure every detail is perfect.
  </p>
  <p className="text-lg leading-relaxed mb-4">
    Let’s collaborate to create something special. Whether you're looking for a personal portrait session, coverage for a milestone event, or a creative project that pushes boundaries, I’m ready to bring your vision to life.
  </p>
</div>


          </div>
        </div>
      </section>

      <div className="relative z-10  text-center">
        <div className="w-full  h-2 bg-black mx-auto "></div>
      </div>

      {/* Gallery Section */}
      <section className="py-28 bg-gradient-to-t from-gray-100 via-gray-200 to-gray-300">
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="max-w-7xl mx-auto px-4">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true }}
              autoplay={{
                delay: 4000, // Delay between slides
                disableOnInteraction: false, // Keeps autoplay running after manual interaction
              }}
              speed={2000} // Smooth transition duration (2 seconds)
              loop={true} // Infinite seamless loop
              spaceBetween={30} // Spacing between slides
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 30 },
                1024: { slidesPerView: 5, spaceBetween: 40 }, // Show 5 slides at >= 1024px
              }}
            >
              {galleryImages.slice(0, 8).map((photo) => (
                <SwiperSlide key={photo.id}>
                  <div className="relative group rounded-xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-2xl">
                    {/* Image */}
                    <img
src={photo.image_url}
alt={photo.caption || "Gallery Image"}
                      className="w-full h-64 object-cover transition-transform duration-700 ease-in-out group-hover:scale-110 cursor-pointer"
                      onClick={() => openModal(photo)} // Pass the full photo object
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"></div>

                    <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <p className="text-xl font-semibold">
                        {photo.caption || "No Caption"}
                      </p>
                      <p className="text-sm text-gray-300">
                        {photo.category || "Uncategorized"}
                      </p>
                      <p className="text-sm text-yellow-400">
                        {photo.photo_type || "No Type"}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl w-full p-4 bg-white rounded-lg shadow-2xl transform transition-all duration-300 ease-in-out">
            {/* Close Button */}
            <button
  onClick={closeModal}
  className="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-600 text-lg font-extrabold w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 shadow-md"
  aria-label="Close Modal"
>
  &times;
</button>


            {/* Image and Details */}
            <div className="flex flex-col items-center justify-center">
              {/* Image */}
              <img
src={selectedImage.image_url}
alt={selectedImage.caption || "Expanded View"}
                className="w-full max-w-[90vw] max-h-[60vh] object-contain rounded-lg shadow-lg transition-transform duration-300 ease-in-out transform"
              />

              {/* Caption, Category, and Photo Type */}
              <div className="mt-4 text-center">
                <p className="text-xl font-bold text-gray-800">
                  {selectedImage.caption || "No Caption"}
                </p>
                <p className="text-sm text-gray-600">
                  Category: {selectedImage.category || "Uncategorized"}
                </p>
                <p className="text-sm text-yellow-500">
                  Photo Type: {selectedImage.photo_type || "No Type"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 -mt-12 text-center">
        <div className="w-full mt-5 h-2 bg-black mx-auto "></div>
      </div>

      {/* About Me Section */}

    </div>
  );
};

export default HomePage;
