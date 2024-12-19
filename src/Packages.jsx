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
        `http://127.0.0.1:5000/api/packages/${packageId}`,
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
    "from-yellow-300 to-yellow-500",
    "from-pink-300 to-pink-500",
    "from-green-300 to-green-500",
    "from-blue-300 to-blue-500",
    "from-purple-300 to-purple-500",
    "from-red-300 to-red-500",
  ];

  // Fetch packages from the backend
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/api/packages");
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
        ? `http://127.0.0.1:5000/api/packages/${currentPackageId}` // Update endpoint
        : "http://127.0.0.1:5000/api/packages"; // Create endpoint

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
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-100 via-gray-300 to-gray-900 text-gray-800">
      {/* Header */}
      <header className="relative bg-transparent text-gray-900 text-center py-16">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('banner.webp')" }}
        ></div>

        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 text-white">
          <h1 className="text-6xl font-bold tracking-wide">
            Explore The Golden Packages
          </h1>
          <p className="mt-4 text-2xl font-bold mx-auto">
            Professional and personalized photography services to capture your
            story.
          </p>
          <Link
            to="/contact"
            className="mt-6 inline-block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 
          text-white font-extrabold text-lg px-10 py-4 rounded-full shadow-2xl 
          hover:from-yellow-500 hover:via-red-400 hover:to-pink-500 
          transform hover:scale-110 transition-all duration-300 ease-out"
          >
            Book Now
          </Link>
        </div>
      </header>

      {isAdmin && (
        <div className="max-w-md mx-auto bg-gray-700 p-6 rounded-lg shadow-md mt-5">
          <button
            onClick={() => setShowForm((prev) => !prev)} // Toggle form visibility
            className="w-full py-3 px-6 text-2xl font-bold text-white uppercase 
                 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 
                 hover:scale-105 transform transition-all duration-300 rounded-lg"
          >
            {showForm ? "Close Package Form" : "Add New Package"}
          </button>

          {showForm && (
            <form
              onSubmit={(e) => handleFormSubmit(e)} // Attach the submit handler
              className="space-y-4 mt-4"
            >
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded p-2"
                required
              />

              {/* Tooltip */}
              <div className="relative group">
                <a
                  href="https://imgur.com/upload"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-block w-full font-bold text-white text-center mb-2 uppercase rounded-lg
               bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg transition-all duration-300 ease-in-out 
               hover:scale-105 hover:from-green-500 hover:via-green-600 hover:to-green-700 hover:shadow-2xl
               before:absolute before:-inset-1 before:rounded-lg before:bg-green-300 before:blur-lg before:opacity-30"
                >
                  <span className="relative z-10">Upload Photo to Imgur</span>
                </a>

                <input
                  type="url"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full border rounded p-2"
                  required
                />

                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg 
               opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                >
                  Don't have a URL for your image yet? Click the link. <br />
                  1. Add your image <br />
                  2. Right-click on the image and "Copy Image Address" <br />
                  If it doesn't look like this:
                  "https://i.imgur.com/example.jpg" <br />
                  try copying the address again.
                </div>
              </div>

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded p-2"
              ></textarea>
              <button
                type="submit"
                className="w-full py-2 px-4 font-bold text-white uppercase 
                     bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                Upload Package
              </button>
            </form>
          )}
        </div>
      )}

      {/* Package Cards */}
      <section className="py-12 px-6">
        {loading ? (
          <p className="text-center text-gray-700 text-xl">
            Loading packages...
          </p>
        ) : error ? (
          <p className="text-center text-red-500 text-xl">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {packages.map((pkg, index) => (
              <button
                onClick={() => handleViewPackage(pkg)} // Open modal on card click
                className={`bg-gradient-to-br ${
                  gradientClasses[index % gradientClasses.length]
                } text-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105 relative`}
              >
                {/* Image */}
                {pkg.image_url && (
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                {/* Content */}
                <div className="text-center p-4">
                  <h2 className="text-3xl font-bold">{pkg.title}</h2>
                  <p className="text-xl font-semibold ">${pkg.amount}</p>
                  <p className="text-black font-semibold text-lg flex items-center justify-center gap-2 animate-pulse">
                    <span className="material-icons mb-5 text-white text-2xl">
                      touch_app
                    </span>
                    Select for Details
                  </p>
                </div>

                {/* Admin Buttons */}
                {isAdmin && (
                  <div
                    className="absolute  bottom-2 right-2 flex gap-2"
                    onClick={(e) => e.stopPropagation()} // Prevent click propagation
                  >
                    <button
                      onClick={() => handleEditPackage(pkg)} // Edit button
                      className="bg-black mt-2 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)} // Delete button
                      className="bg-red-500 mt-2  hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
                    >
                      Delete
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
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg font-extrabold w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 shadow-md"
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
                ${selectedPackage.amount}
              </p>
              <p className="text-gray-800 text-md leading-relaxed">
                {selectedPackage.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
