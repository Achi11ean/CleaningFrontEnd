import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import "./Gallery.css"; // Import custom CSS for keyframe animations

const Gallery = () => {
  const { user, isAuthenticated } = useAuth(); // Get user data and auth status from AuthContext
  const isAdmin = user && user.username === "admin";
  console.log("AuthContext - user:", user); // Check the user object
  console.log("AuthContext - isAuthenticated:", isAuthenticated); // Check if user is authenticated
  console.log("Admin Check - isAdmin:", isAdmin); // Check if user is admin
  const [photos, setPhotos] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [photoType, setPhotoType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchPhotoType, setSearchPhotoType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 12;
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const indexOfLastPhoto = currentPage * photosPerPage;
  const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
  const currentPhotos = photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const shuffleArray = (array) => {
    return array
      .map((item) => ({ ...item, sort: Math.random() })) // Add a random sort value
      .sort((a, b) => a.sort - b.sort) // Sort based on random value
      .map((item) => {
        const { sort, ...rest } = item; // Remove the sort key
        return rest;
      });
  };
  
  const handleImageClick = (photo) => {
    setSelectedPhoto(photo);
  };

  // Close Modal
  const closeModal = () => {
    setSelectedPhoto(null);
  };
  // Fetch gallery photos
  useEffect(() => {
    fetchPhotos();
  }, []);
  
  const fetchPhotos = () => {
    setLoading(true);
  
    // Add query parameters for filtering
    const queryParams = new URLSearchParams();
    if (searchCategory) queryParams.append("category", searchCategory);
    if (searchPhotoType) queryParams.append("photo_type", searchPhotoType);
  
    fetch(`http://127.0.0.1:5000/api/gallery?${queryParams}`)
      .then((res) => res.json())
      .then((data) => {
        const shuffledPhotos = shuffleArray(data); // Shuffle the photos
        setPhotos(shuffledPhotos); // Update state with shuffled photos
      })
      .catch((err) => console.error("Error fetching gallery:", err))
      .finally(() => setLoading(false));
  };
  
  
  // Refetch photos on load and when filters change
  useEffect(() => {
    fetchPhotos();
  }, [searchCategory, searchPhotoType]);
  
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return; // Confirm deletion
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/gallery/${photoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Include the token
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete photo");
      }
  
      // Remove the deleted photo from the state
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId));
      setMessage("Photo deleted successfully!");
    } catch (error) {
      console.error("Error deleting photo:", error);
      setMessage("Error deleting photo. Please try again.");
    }
  };
  
  // Handle file input
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle upload form submission
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file to upload.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("caption", caption);
    formData.append("category", category);
    formData.append("photo_type", photoType);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/gallery/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Include the token
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPhotos([...photos, data.photo]);
        setMessage("Photo uploaded successfully!");
        setFile(null);
        setCaption("");
        setCategory("Uncategorized");
        setPhotoType("");
      } else {
        setMessage(data.error || "Failed to upload photo.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("An error occurred while uploading.");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-black via-red-900 to-black overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-yellow-600 to-transparent opacity-30"></div>

      {/* Curtains */}
      <div className="curtain left"></div>
      <div className="curtain right"></div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        <h1
          className="text-5xl font-extrabold text-center mb-8 
             bg-clip-text text-transparent 
             bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 
             drop-shadow-lg animate-fade-in"
        >
          ✨ Photo Gallery ✨
        </h1>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
  <input
    type="text"
    placeholder="Search by Category"
    value={searchCategory}
    onChange={(e) => setSearchCategory(e.target.value)}
    className="border rounded p-2 w-full md:w-1/3"
  />
  <input
    type="text"
    placeholder="Search by Photo Type"
    value={searchPhotoType}
    onChange={(e) => setSearchPhotoType(e.target.value)}
    className="border rounded p-2 w-full md:w-1/3"
  />

</div>

        {/* Loading State */}
        {loading ? (
          <p className="text-center text-gray-600">Loading photos...</p>
        ) : (
          /* Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {currentPhotos.map((photo) => (
              <div
  key={photo.id}
  className="relative group bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer"
>
  {/* Delete button (only for admins) */}
  {isAdmin && (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering image click
        handleDeletePhoto(photo.id);
      }}
      className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-md shadow hover:bg-red-700 transition"
    >
      Delete
    </button>
  )}

  {/* Image */}
  <img
    src={`http://127.0.0.1:5000/${photo.image_url}`}
    alt={photo.caption || "Gallery Image"}
    className="w-full h-48 object-cover"
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "placeholder-image.webp"; // Fallback image
    }}
    onClick={() => handleImageClick(photo)} // Image click opens modal
  />


                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center text-white p-4 pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      {photo.caption || "No Caption"}
                    </p>
                    <p className="text-sm">
                      {photo.category || "Uncategorized"}
                    </p>
                    <p className="text-sm">{photo.photo_type || "No Type"}</p>
                  </div>
                </div>
                
              </div>
            ))}
            
          </div>
        )}
<div className="flex justify-center mt-4 space-x-2">
  <button
    onClick={() => handlePageChange(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
  >
    Previous
  </button>

  {/* Page Numbers */}
  {Array.from({ length: totalPages }, (_, index) => (
    <button
      key={index + 1}
      onClick={() => handlePageChange(index + 1)}
      className={`px-4 py-2 rounded ${
        currentPage === index + 1
          ? "bg-blue-500 text-white"
          : "bg-gray-300 text-gray-700 hover:bg-gray-400"
      }`}
    >
      {index + 1}
    </button>
  ))}

  <button
    onClick={() => handlePageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
  >
    Next
  </button>
</div>

{selectedPhoto && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 px-4">
    <div className="relative max-w-3xl w-full mx-auto bg-gray-900 rounded-lg shadow-lg p-4 md:p-6">
      {/* Close Button */}
      <button
        onClick={closeModal}
        className="absolute top-4 right-4 text-gray-300 hover:text-white text-3xl leading-none transition transform hover:scale-110"
        aria-label="Close Modal"
      >
        &times;
      </button>

      {/* Image Container */}
      <div className="flex flex-col items-center space-y-4">
        {/* Framed Image */}
        <div className="relative w-full max-w-lg border-4 border-gray-600 rounded-lg shadow-md">
          <img
            src={`http://127.0.0.1:5000/${selectedPhoto.image_url}`}
            alt={selectedPhoto.caption || "Gallery Image"}
            className="w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>

        {/* Image Details */}
        <div className="text-center text-white">
          <h2 className="text-xl font-bold text-red-500 mb-1">
            {selectedPhoto.caption || "Untitled"}
          </h2>
          <p className="text-md text-gray-400">
            Category:{" "}
            <span className="text-gray-200">
              {selectedPhoto.category || "Uncategorized"}
            </span>
          </p>
          <p className="text-md text-gray-400">
            Type:{" "}
            <span className="text-gray-200">
              {selectedPhoto.photo_type || "No Type"}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
)}


        <br/>
        {/* Admin Upload Form */}
        {isAuthenticated && isAdmin && (
          <div className="max-w-md mx-auto bg-gray-700 p-6 rounded-lg shadow-md mb-8">
<button
  onClick={() => setShowUploadForm((prev) => !prev)} // Toggle the form visibility
  className="relative w-full py-3 px-6 text-2xl font-bold text-white uppercase tracking-wider 
             bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 
             hover:from-purple-600 hover:via-red-500 hover:to-yellow-400 
             rounded-lg overflow-hidden transition-transform duration-500 ease-in-out 
             transform hover:scale-105 hover:shadow-2xl"
>
  <span className="relative  z-10">
    {showUploadForm ? "Close Upload Form" : "Add to Gallery"}
  </span>
  
  {/* Glowing Border */}
  <span
    className="absolute inset-0 w-full h-full  border-4 border-transparent rounded-lg 
               animate-border-glow"
  ></span>
</button>

            {message && (
              <p className="mb-4 text-center text-green-600 font-semibold">
                {message}
              </p>
            )}
            
            {showUploadForm && (

            <form onSubmit={handleUpload} className="mt-2 space-y-4">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="w-full border rounded p-2"
                required
              />
              <input
                type="text"
                placeholder="Caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                placeholder="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded p-2"
              />
              <input
                type="text"
                placeholder="Photo Type"
                value={photoType}
                onChange={(e) => setPhotoType(e.target.value)}
                className="w-full border rounded p-2"
              />
<button
  type="submit"
  className="relative w-full py-3 px-6 font-bold text-white uppercase rounded-lg 
             bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 
             hover:from-red-500 hover:via-yellow-400 hover:to-red-500 
             shadow-lg transition-all duration-300 ease-in-out 
             transform hover:scale-105 hover:shadow-2xl group"
>
  <span className="relative z-10">Upload Photo</span>
  {/* Artistic Glow Effect */}
  <div
    className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-300 via-red-400 to-yellow-300 
               opacity-30 blur-lg group-hover:opacity-50 group-hover:blur-2xl pointer-events-none"
  ></div>
</button>
            </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Gallery;
