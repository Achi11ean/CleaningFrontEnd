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
  const [currentIndex, setCurrentIndex] = useState(0); // Tracks the active tab

  const sections = [
    {
      title: "Residential Cleaning",
      content: (
        <p className="text-lg leading-relaxed mb-4">
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
    <div className="w-full  text-gray-800">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-white to-blue-100 text-gray-800 ">
  <div className="max-w-7xl mx-auto px-6 lg:flex lg:items-center  lg:justify-between">
    {/* Left Section: Text */}
    <div className="lg:w-1/2 mb-12  lg:mb-0">
    <h1 className="text-3xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-3xl text-center  rounded-2xl font-poppins font-bold leading-snug text-blue-600 mb-6 text-shadow-md transition duration-500 hover:text-blue-500">
  Transform Your Space with:<br/> 
  <span className="text-black text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-5xl shimmer-text">
  🌬️ A Breath of Fresh Air 🫧
</span>

</h1>



      <p className="text-lg leading-relaxed text-center mb-8">
      At A Breath of Fresh Air Cleaning Services, we go beyond surface cleaning to create healthier, more peaceful homes. Using high-quality, non-toxic products and tools, we ensure your space is clean, safe, and free of harmful chemicals, leaving the air you breathe truly fresh.

We understand the connection between your home and mental health. That’s why we offer customized cleaning plans to fit your needs, helping to reduce stress and bring clarity to your life.

Choose us to transform your home into a sanctuary—for your health, your family, and your peace of mind.
      </p>
      <div className="absolute top-0 left-1/4 w-12 h-12 bg-blue-200 rounded-full opacity-50 "></div>
      <div className="absolute bottom-0 right-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-40 "></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 bg-blue-100 rounded-full opacity-60"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
  <Link to="/contact">
    <button className="w-full px-6 py-3 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      Contact Us!
    </button>
  </Link>
  <Link to="/gallery">
    <button className="w-full px-6 py-3 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      View Gallery
    </button>
  </Link>
  <Link to="/packages">
    <button className="w-full px-6 py-3 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      Cleaning Packages
    </button>
  </Link>
  <Link to="/reviews">
    <button className="w-full px-6 py-3 bg-gradient-to-t from-blue-400 to-blue-800 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
      Reviews
    </button>
  </Link>
</div>




    </div>
    <div className="absolute top-0 left-1/4 w-12 h-12 bg-blue-200 rounded-full opacity-50 "></div>
      <div className="absolute bottom-0 right-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-40 "></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 bg-blue-100 rounded-full opacity-60"></div>
      
    {/* Right Section: Image */}
    <div className="lg:w-1/2 relative">
      <img
        src="logo.jpeg"
        alt="Amanda Cleaning"
        className="rounded-3xl lg:ml-10 mt-5 shadow-lg w-auto max-w-full sm:w-[80%] md:w-[60%] lg:w-[100%] object-cover h-auto max-h-[500px] object-top"
        />
      {/* Floating Bubbles */}
      <div className="absolute top-0 left-1/4 w-12 h-12 bg-blue-200 rounded-full opacity-50 "></div>
      <div className="absolute bottom-0 right-1/4 w-16 h-16 bg-blue-400 rounded-full opacity-40 "></div>
      <div className="absolute bottom-10 left-10 w-8 h-8 bg-blue-100 rounded-full opacity-60"></div>
      
    </div>
  </div>

  <div className="grid mt-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 sm:px-8">
  {/* Feature Card */}
  <div className="relative bg-white p-4 sm:p-6 rounded-lg border-blue-700  shadow-lg text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group border border-transparent hover:border-blue-400">
    <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-1 transition-all duration-300 group-hover:text-yellow-500">
      Residential Cleaning
    </h3>
    <p className="text-gray-600 text-sm sm:text-base group-hover:opacity-0 transition-opacity duration-300">
      From kitchens to bedrooms, we ensure every corner of your home is spotless and welcoming.
    </p>
    
    {/* Hover/Tap Detail */}
    <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-r from-blue-200 via-yellow-100 to-blue-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6">
      <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">Residential Cleaning</h3>
      <p className="text-gray-700 text-sm sm:text-base">
        We offer tailored residential cleaning to create a cozy, spotless home.
      </p>
    </div>
  </div>

  {/* Feature Card 2 */}
  <div className="relative bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center border-blue-700 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group border border-transparent hover:border-blue-400">
  <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-3 transition-all duration-300 group-hover:text-yellow-500">
    Office Cleaning
  </h3>
  <p className="text-gray-600 text-sm sm:text-base group-hover:opacity-0 transition-opacity duration-300">
    Keep your workspace tidy and professional with our thorough office cleaning services.
  </p>
  
  {/* Hover/Tap Detail */}
  <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-r from-blue-200 via-yellow-100 to-blue-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6">
    <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">Office Cleaning</h3>
    <p className="text-gray-700 text-sm sm:text-base">
      A clean office boosts productivity and professionalism. Let us handle it!
    </p>
  </div>
</div>


  {/* Feature Card 3 */}
  <div className="relative bg-white p-4 sm:p-6 rounded-lg shadow-lg text-center border-blue-700 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group border border-transparent hover:border-blue-400">
  <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-3 transition-all duration-300 group-hover:text-yellow-500">
    Eco-Friendly Solutions
  </h3>
  <p className="text-gray-600 text-sm sm:text-base group-hover:opacity-0 transition-opacity duration-300">
    Using non-toxic, eco-friendly products, we create a safe and healthy environment for you and the planet.
  </p>
  
  {/* Hover/Tap Detail */}
  <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-r from-blue-200 via-yellow-100 to-blue-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6">
    <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">Eco-Friendly Solutions</h3>
    <p className="text-gray-700 text-sm sm:text-base">
      Safe, sustainable cleaning methods for a better planet and healthier home.
    </p>
  </div>
</div>


  {/* Feature Card 4: Moving Day Cleaning */}
  <div className="relative bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-blue-700 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group border border-transparent hover:border-blue-400">
  <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-3 transition-all duration-300 group-hover:text-yellow-500">
    Moving Day Cleaning
  </h3>
  <p className="text-gray-600 text-sm sm:text-base group-hover:opacity-0 transition-opacity duration-300">
    Make your move stress-free with our comprehensive cleaning services for both old and new homes.
  </p>
  
  {/* Hover/Tap Detail */}
  <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-r from-blue-200 via-yellow-100 to-blue-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6">
    <h3 className="text-lg sm:text-xl font-semibold text-blue-600 mb-2">Moving Day Cleaning</h3>
    <p className="text-gray-700 text-sm sm:text-base">
      Ensure a spotless start in your new space or leave your old one sparkling clean.
    </p>
  </div>
</div>





  </div>
</section>


      <div className="relative z-10  text-center">
        <div className="w-full  h-1 bg-black mx-auto "></div>
        
      </div>

      {/* Gallery Section */}
      <section className="py-10 bubble-container  bg-gradient-to-t from-blue-600  via-black to-blue-600">
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="max-w-7xl mx-auto px-4">
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

      <div className="relative z-10 -mt-12 text-center">
        <div className="w-full mt-5 h-2 bg-black mx-auto "></div>
      </div>

      {/* About Me Section */}
    </div>
  );
};

export default HomePage;
