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
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null); // Tracks the clicked image
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks the active tab

  const sections = [
    {
      title: "Residential Cleaning",
      content: (
        <p className="text-lg  leading-relaxed mb-4">
          Residential cleaning is our specialty! From cozy kitchens to serene bedrooms, we ensure your home feels fresh and inviting. Trust us to bring comfort and cleanliness to every corner of your living space.
        </p>
      ),
    },
    {
      title: "Office Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          A tidy workspace promotes productivity. Let us help you maintain a clean, professional office environment, perfect for achieving your goals while impressing clients and colleagues.
        </p>
      ),
    },
    {
      title: "Eco-Friendly Solutions",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          Committed to a healthier planet, we use non-toxic, eco-friendly products that are safe for your family, pets, and the environment. Experience sustainable cleaning with us.
        </p>
      ),
    },
    {
      title: "Moving Day Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
          Moving can be overwhelming — let us handle the cleaning! We’ll leave your old home spotless and prepare your new space for a fresh, stress-free start.
        </p>
      ),
    },
  ];
  
  const openModal = (photo) => {
    console.log("Opening Modal with Photo Data:", photo); // Debug
    setSelectedImage(photo); // Pass the entire photo object
  };

  const closeModal = () => setSelectedImage(null); // Close modal

  // Fetch gallery images
  useEffect(() => {
    fetch("https://cleaningbackend.onrender.com/api/gallery")
      .then((response) => response.json())
      .then((data) => {
        setGalleryImages(data);
      })
      .catch((error) => console.error("Error fetching gallery:", error))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % sections.length);
    }, 30000);
    return () => clearInterval(interval); 
  }, [sections.length]);
  return (
<div className="bg-gradient-to-br from-white via-teal-50 to-teal-100 border-t-8 border-blue-400 pt-24  shadow-2xl min-h-screen  mx-auto">
      {/* Hero Section */}
      <section className="py-2  text-gray-800 ">
        <div className=" text-center">   
           <h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-3xl font-bold font-poppins text-blue-600  leading-snug hover:text-blue-500 transition duration-500">
      Transform Your Space with:<br />
      <span className="text-black sm:text-2xl md:text-6xl font-serif">
        🌬️ A Breath of Fresh Air 🫧
      </span>
    </h1>
</div>

<div className=" text-center p-3 md:p-12 my-1 max-w-5xl mx-auto">
  <h2 className="text-2xl md:text-4xl font-extrabold text-blue-700  border-b-2 border-blue-500 drop-shadow-sm">
    About Us 
  </h2>
  <p className="text-lg md:text-xl text-gray-800 leading-relaxed space-y-6">
    <span>
      At <strong>A Breath of Fresh Air Cleaning Services</strong>, we go beyond surface cleaning to create healthier, more peaceful homes. Using high-quality, non-toxic products and tools, we ensure your space is clean, safe, and free of harmful chemicals—leaving the air you breathe truly fresh.
    </span>
    <br />
    <span>
      We understand the connection between your home and mental health. That’s why we offer customized cleaning plans to fit your needs, helping to reduce stress and bring clarity to your life.
    </span>
    <br />
    <span>
      Choose us to transform your home into a sanctuary—for your health, your family, and your peace of mind.
    </span>
  </p>
    <div className="grid grid-cols-2 mb-2 sm:grid-cols-2 gap-4">
      <Link to="/contact">
        <button className="w-full px-6 py-1 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
          Contact Us!
        </button>
      </Link>
      <Link to="/gallery">
        <button className="w-full px-6 py-1 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
          View Gallery
        </button>
      </Link>
      <Link to="/packages">
        <button className="w-full px-6 py-1 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
          Services
        </button>
      </Link>
      <Link to="/reviews">
        <button className="w-full px-6 py-1 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
          Reviews
        </button>
      </Link>
    </div> 
</div>
</section>

      <div className="relative z-10  text-center">
        <div className="w-full  h-1 bg-black mx-auto "></div>
        
      </div>

      {/* Gallery Section */}
      <section className="py-12 bubble-container   bg-gradient-to-t from-blue-600  via-black to-blue-600">
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="max-w-7xl mx-auto px-2">
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
                                              <div className="bubble"></div>
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
                                                <div className="bubble"></div>
                                                <div className="bubble"></div>
                                  <div className="bubble"></div>
                                  <div className="bubble"></div>
              {galleryImages.slice(0, 8).map((photo) => (
                <SwiperSlide key={photo.id}>
                  <div className="relative group rounded-xl overflow-hidden shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-2xl">

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
            <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                
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
<ServiceArea />


      {/* About Me Section */}
    </div>
  );
};

export default HomePage;
