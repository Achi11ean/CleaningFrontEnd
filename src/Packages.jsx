import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./index.css"; // Tailwind CSS
import { useAuth } from "./AuthContext";

const Packages = () => {
  const [packages, setPackages] = useState([]); // State to store packages from the backend
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [selectedPackage, setSelectedPackage] = useState(null); // Holds the package details for the modal
  const handleViewPackage = (pkg) => {
    setSelectedPackage(pkg); // Set the clicked package
  };

  const closeModal = () => {
    setSelectedPackage(null); // Clear the modal state
  };

  const [editMode, setEditMode] = useState(false); // Determines if editing
  const [currentPackageId, setCurrentPackageId] = useState(null); // Package being edited
  const handleEditPackage = (pkg) => {
    setTitle(pkg.title);
    setAmount(pkg.amount);
    setImageUrl(pkg.image_url);
    setDescription(pkg.description);
    setCurrentPackageId(pkg.id);
    setEditMode(true);
    setShowForm(true); // Show form
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm("Are you sure you want to delete this package?"))
      return; // Confirm deletion

    try {
      const response = await fetch(
        `https://cleaningbackend.onrender.com/api/packages/${packageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Include token
          },
        }
      );

      if (response.ok) {
        setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId)); // Remove package from state
      } else {
        console.error("Failed to delete package");
      }
    } catch (err) {
      console.error("Error deleting package:", err);
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.username === "admin";
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  const gradientClasses = [
    "from-blue-200 via-blue-300 to-blue-400", // Light ocean
    "from-blue-300 via-blue-400 to-blue-500", // Serene skies
    "from-blue-400 via-blue-500 to-blue-600", // Calm waters
    "from-cyan-200 via-blue-300 to-blue-500", // Icy breeze
    "from-indigo-300 via-blue-400 to-blue-600", // Twilight blues
    "from-teal-300 via-blue-400 to-blue-500", // Aqua vibes
    "from-blue-500 via-blue-600 to-blue-700", // Deep ocean
    "from-sky-300 via-blue-400 to-indigo-500", // Midnight glow
    "from-blue-100 via-blue-200 to-blue-300", // Misty morning
    "from-cyan-100 via-blue-200 to-blue-300", // Frosty chill
    "from-teal-200 via-blue-300 to-indigo-400", // Tropical dusk
    "from-blue-600 via-indigo-500 to-blue-700", // Royal blue
    "from-blue-400 via-cyan-300 to-blue-500", // Aqua shimmer
    "from-blue-200 via-sky-300 to-blue-400", // Gentle wave
    "from-indigo-500 via-blue-500 to-blue-700", // Bold night
    "from-sky-200 via-blue-300 to-blue-500", // Clear horizon
    "from-cyan-300 via-blue-400 to-indigo-500", // Arctic glow
    "from-indigo-400 via-blue-500 to-blue-600", // Sapphire gradient
    "from-teal-300 via-blue-500 to-indigo-600", // Crystal lagoon
    "from-sky-400 via-blue-500 to-indigo-600", // Dreamy cascade
  ];
  
  
  // Fetch packages from the backend
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("https://cleaningbackend.onrender.com/api/packages");
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        setPackages(data);
      } catch (err) {
        console.error("Error fetching packages:", err.message);
        setError("Failed to load packages. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const updatedPackage = {
      title,
      amount: parseFloat(amount),
      image_url: imageUrl,
      description,
    };

    try {
      const url = editMode
        ? `https://cleaningbackend.onrender.com/api/packages/${currentPackageId}` // Update endpoint
        : "https://cleaningbackend.onrender.com/api/packages"; // Create endpoint

      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedPackage),
      });

      const data = await response.json();

      if (response.ok) {
        if (editMode) {
          setPackages((prev) =>
            prev.map((pkg) =>
              pkg.id === currentPackageId ? data.package : pkg
            )
          );
        } else {
          setPackages((prev) => [...prev, data.package]);
        }
        // Reset form and mode
        setShowForm(false);
        setEditMode(false);
        setCurrentPackageId(null);
        setTitle("");
        setAmount("");
        setImageUrl("");
        setDescription("");
      } else {
        console.error("Failed to submit package:", data.error);
      }
    } catch (err) {
      console.error("Error submitting package:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-300 via-gray-300 to-gray-800 text-gray-800">


      {/* Header */}
      <header className="relative bg-transparent text-gray-900 text-center py-10">
      <div>
  <h1 className="">Cleaning Packages</h1>
</div>
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('banner3.webp')",
          }}
        ></div>

        {/* Fun Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/50 via-white/10 to-blue-500/50"></div>
        <div className="relative z-10 text-gray-800 px-12 max-w-3xl mx-auto">
          <h1
            className="text-5xl sm:text-6xl lg:text-5xl font-extrabold leading-tight animate-fade-in"
            style={{
              fontFamily: "'playfair'",
              color: "black",
              textShadow: `
      0 0 5px white, 
      0 0 10px white, 
      0 0 20px white, 
      0 0 30px white, 
      0 0 40px white, 
      0 0 50px white
    `,
              animation: "fade-in 2s ease-out",
            }}
          >
            Cleaning Packages
          </h1> </div>
        {/* Content */}
        <div className="relative z-10 text-gray-800 px-12 max-w-4xl mx-auto">



          <p className="mt-6 text-base sm:text-lg lg:text-2xl font-medium tracking-wide leading-relaxed bg-white/90 p-4 rounded-xl shadow-md">
            Every package comes with our signature eco-friendly cleaning
            services, because we care about you and the planet! 🌿✨                  <p className="text-black font-semibold text-lg flex items-center justify-center gap-2 animate-pulse">
                    <span className="material-icons mb-5 text-blue-800 text-2xl">
                      touch_app
                    </span>
                    Select a package for Details
                  </p></p>
            
        </div> 

      </header>
      <div className="w-full h-2 bg-black mx-auto"></div>
            
            <h1 
              className="text-3xl md:text-3xl  text-center text-black bg-red-600
                py-4 px-6  shadow-lg pulse-animation" 
              style={{ fontFamily: "'aspire', '" }}
            >
              🧼 All services <span className="underline font-extrabold">REQUIRE</span> an in-home consultation to ensure a shared understanding and deliver the highest quality service tailored to your needs.🧹
            </h1>
            <div className="w-full h-2 bg-black mx-auto"></div>

            {isAdmin && (
  <div className="max-w-lg mx-auto bg-gradient-to-b from-gray-900 to-gray-800 bg-opacity-90 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-gray-700 mt-6">
    
    {/* Toggle Button */}
    <button
      onClick={() => setShowForm((prev) => !prev)}
      className="w-full py-4 px-6 text-xl sm:text-2xl font-bold text-white uppercase 
                 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 
                 hover:scale-105 hover:shadow-lg transform transition-all duration-300 rounded-2xl"
    >
      {showForm ? "❌ Close Package Form" : "➕ Add New Package"}
    </button>

    {/* Form */}
    {showForm && (
      <form 
        onSubmit={(e) => handleFormSubmit(e)}
        className="space-y-6 mt-6"
      >
        {/* Title Input */}
        <div>
          <label className="block text-gray-300 font-semibold mb-2">📦 Package Title</label>
          <input
            type="text"
            placeholder="Enter title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 text-lg bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
            required
          />
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-gray-300 font-semibold mb-2">💰 Package Amount</label>
          <input
            type="number"
            placeholder="Enter amount..."
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 text-lg bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400"
            required
          />
        </div>

        {/* Image Upload */}
        <div className="relative group">
          <label className="block text-gray-300 font-semibold mb-2">📸 Upload Image</label>
          <a
            href="https://imgur.com/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-lg font-bold text-white text-center py-3 uppercase rounded-lg 
                     bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg transition-all 
                     hover:scale-105 hover:from-green-500 hover:via-green-600 hover:to-green-700"
          >
            🚀 Upload Photo to Imgur
          </a>

          <input
            type="url"
            placeholder="Paste image URL here..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full p-3 text-lg bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400 mt-2"
            required
          />

          {/* Tooltip */}
          <div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            Don't have a URL? Click the link above, upload an image, then **right-click on the image and "Copy Image Address"**.
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-300 font-semibold mb-2">📝 Description</label>
          <textarea
            placeholder="Enter package details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-lg bg-gray-800 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none placeholder-gray-400 resize-none h-32"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 text-lg font-bold text-white uppercase 
                   bg-blue-500 hover:bg-blue-600 rounded-xl shadow-md transform transition-all 
                   hover:scale-105 hover:shadow-lg active:scale-95"
        >
          🚀 Upload Package
        </button>
      </form>
    )}
  </div>
)}


      {/* Package Cards */}
      <section className="px-6 mt-6 pb-12">
  {loading ? (
    <p className="text-center text-gray-400 text-xl font-semibold animate-pulse">
      ⏳ Loading packages...
    </p>
  ) : error ? (
    <p className="text-center text-red-500 text-xl font-bold">{error}</p>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {packages.map((pkg, index) => (
        <button
          key={pkg.id}
          onClick={() => handleViewPackage(pkg)}
          className={`relative bg-gray-900 bg-opacity-90 backdrop-blur-lg p-5 rounded-2xl shadow-xl 
                      overflow-hidden transition-all transform duration-300 hover:scale-105 
                      hover:shadow-2xl border-2 ${gradientClasses[index % gradientClasses.length]} border-opacity-40`}
        >
          {/* Package Image */}
          {pkg.image_url && (
            <div className="relative w-full h-40 rounded-xl overflow-hidden">
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-40"></div>
            </div>
          )}

          {/* Package Details */}
          <div className="text-center mt-4">
            <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider">
              {pkg.title}
            </h2>
            <p className="text-gray-300 mt-2 text-lg">Prices Starting at:</p>
            <p className="text-2xl font-bold text-yellow-400">${pkg.amount}</p>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div
              className="absolute bottom-3 right-3 flex gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleEditPackage(pkg)}
                className="px-4 py-2 text-sm font-bold text-black bg-yellow-400 hover:bg-yellow-500 rounded-lg shadow-md transition-all transform hover:scale-105"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDeletePackage(pkg.id)}
                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-md transition-all transform hover:scale-105"
              >
                ❌ Delete
              </button>
            </div>
          )}
        </button>
      ))}
    </div>
  )}
</section>

      {selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg font-extrabold w-8 h-8 flex items-center justify-center rounded-full bg-white hover:bg-gray-300 transition-all duration-300 shadow-md"
              aria-label="Close Modal"
            >
              &times;
            </button>

            {/* Modal Content */}
            <div className="text-center">
              {selectedPackage.image_url && (
                <img
                  src={selectedPackage.image_url}
                  alt={selectedPackage.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-3xl font-bold mb-2">
                {selectedPackage.title}
              </h2>
              <p className="text-xl font-semibold text-gray-700 mb-4">
                Prices starting at: <br/>${selectedPackage.amount}
              </p>
              <p className="text-gray-800 text-md leading-relaxed">
                {selectedPackage.description}
              </p>
              <div className="mt-2">
            <Link
              to="/contact"
              className="inline-block bg-gradient-to-r from-lime-400 via-green-500 to-teal-500 
          text-white font-bold text-lg sm:text-xl px-8 sm:px-10 py-3 rounded-full shadow-xl
          hover:from-teal-400 hover:via-green-400 hover:to-lime-500 
          transform hover:rotate-1 hover:scale-105 transition-all duration-300 ease-out"
            >
              Book Now
            </Link>
          </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
