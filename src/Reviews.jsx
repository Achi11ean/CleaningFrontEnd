import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; // For authenticated routes

const API_URL = "https://cleaningbackend.onrender.com/api/reviews";

const ReviewList = () => {
  const { token, user } = useAuth(); // Use token if user is signed in
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 12;
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const [errorMessage, setErrorMessage] = useState("");
  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    if (newComment.length > 500) {
      setErrorMessage("Comment must be less than 500 characters.");
    } else {
      setErrorMessage("");
    }
    setComment(newComment);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Calculate the current reviews to display
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const [editingReview, setEditingReview] = useState(null);
  const [error, setError] = useState(null);
  const [emojis, setEmojis] = useState([]); // State for falling emojis
  // Fetch all reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err.message);
    }
  };
  const triggerFallingEmojis = () => {
    const newEmojis = Array.from({ length: 20 }, () => ({
      id: Math.random(),
      left: Math.random() * 100, // Random horizontal position
    }));
    setEmojis(newEmojis);

    // Remove emojis after animation
    setTimeout(() => setEmojis([]), 3000);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // Add or Update a review
  const handleAddOrUpdateReview = async (reviewData) => {
    const method = editingReview ? "PUT" : "POST";
    const url = editingReview ? `${API_URL}/${editingReview.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) throw new Error("Failed to save review");
      fetchReviews(); // Refresh the list
      setEditingReview(null);
    } catch (err) {
      setError(err.message);
    }
  };
  const Modal = ({ imageUrl, caption, reviewer, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative max-w-3xl w-full p-4 bg-white rounded-lg shadow-lg animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose} // Use the passed 'onClose' function
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg font-extrabold w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-all duration-300 shadow-md"
          aria-label="Close Modal"
        >
          &times;
        </button>

        {/* Image Section */}
        <div className="flex justify-center items-center max-h-[80vh] overflow-hidden">
  <img
    src={imageUrl}
    alt="Review"
    className={`rounded-lg object-contain shadow-md ${
      imageUrl === "logo.jpeg" ? "max-h-40" : "max-h-[80vh]"
    }`}
  />
</div>

        {/* Caption */}
        <div className="mt-4 text-center">
          <p className="text-lg max-h-32 overflow-y-auto font-semibold text-gray-800">
            {caption || "No caption provided"}
          </p>
          <p className="text-sm text-gray-600">
            Reviewed by: {reviewer || "Anonymous"}
          </p>
        </div>
      </div>
    </div>
  );

  const [selectedImage, setSelectedImage] = useState(null);
  // Delete a review
  const handleDeleteReview = async (reviewId) => {
    try {
      const response = await fetch(`${API_URL}/${reviewId}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) throw new Error("Failed to delete review");
      fetchReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  // Load reviews on mount
  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div
      className="max-w-full mx-auto p-8 text-white min-h-screen shadow-xl rounded-3xl overflow-hidden"
      style={{
        backgroundImage: "url('7.webp')",
        backgroundSize: "cover", // Ensures the image covers the div
        backgroundPosition: "center", // Centers the image
        backgroundRepeat: "no-repeat", // Prevents tiling
        backgroundBlendMode: "overlay", // Blends with the gradient
        // Fallback color
      }}
    >
      {" "}
      {/* Section Title */}
      <h1
        className="relative text-5xl font-semibold text-center mb-8 text-red-800 
             tracking-widest uppercase transition-all duration-300 ease-in-out 
             hover:scale-105 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] 
             hover:drop-shadow-[0_0_20px_rgba(255,255,255,1)]"
        style={{
          fontFamily: "'Aspire', serif",
          textShadow:
            "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 1)",
        }}
      >
        <span className="inline-block underline relative">
          Reviews
          <span
            className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r 
                 from-blue-400 via-green-400 to-teal-500 transform 
                 scale-x-0 group-hover:scale-x-100 transition-transform 
                 duration-500 ease-out"
          ></span>
        </span>
      </h1>
      {/* Review Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {currentReviews.map((review) => (
    <div
      key={review.id}
      className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 
                 text-white rounded-2xl shadow-lg overflow-hidden transform 
                 transition-all duration-500 hover:scale-105 hover:shadow-[0px_10px_25px_rgba(255,255,255,0.2)] 
                 w-[90%] max-w-[250px] mx-auto"
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={review.photo_url || "logo.jpeg"}
          alt="Review"
          className="w-full h-40 object-cover rounded-t-2xl"
          onClick={() => setSelectedImage(review)}
        />

        {/* Floating Star Ratings */}
        <div className="absolute -bottom-3 mt-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 px-3 py-1 rounded-full flex text-sm">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={`text-lg ${
                index < review.rating ? "text-yellow-400" : "text-gray-500"
              }`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Review Details */}
      <div className="p-4 flex flex-col items-center">
        {/* Reviewer Name with Styling */}
        <p className="text-sm font-bold text-cyan-300 tracking-wide mb-1">
          {review.reviewer_name}
        </p>

        {/* Scrollable Review Comment */}
        <div
          className="bg-gray-700 bg-opacity-30 p-2 rounded-lg w-full max-h-20 overflow-y-auto text-xs text-gray-300 shadow-inner"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#00BFFF #333", // Custom scrollbar
          }}
        >
          {review.comment}
        </div>
      </div>

      {/* Admin Buttons */}
      {user?.username === "admin" && (
        <div className="p-2 flex justify-center">
          <button
            onClick={() => handleDeleteReview(review.id)}
            className="px-3 py-1 bg-red-600 text-white rounded-full text-xs shadow-md 
                      hover:bg-red-700 hover:shadow-[0px_0px_10px_rgba(255,0,0,0.6)] transition-all"
          >
            ❌ Delete
          </button>
        </div>
      )}
    </div>
  ))}
</div>


      <br />
      <div className="flex justify-center items-center gap-4 mt-6">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`px-4 text-black py-2 rounded ${
            currentPage === 1
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-black"
          }`}
        >
          Previous
        </button>

        <span className="text-black">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 text-black py-2 rounded ${
            currentPage === totalPages
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-black"
          }`}
        >
          Next
        </button>
      </div>
      <br />
      <div
        className="relative max-w-md mx-auto  rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, blue, black)", // Vibrant gradient with purple, pink, and teal
          boxShadow:
            "0 15px 30px rgba(0, 0, 0, 0.3), 0 0 3px rgba(106, 13, 173, 0.8), 0 0 20px rgba(255, 110, 199, 0.8)", // Deep shadow with mystical glow
        }}
      >
        {/* Top Glow Effect */}
        <div
          className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-300 opacity-40 rounded-full blur-[120px]"
          style={{ pointerEvents: "none" }}
        ></div>

        {/* Bottom Glow Effect */}
        <div
          className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500 opacity-40 rounded-full blur-[120px]"
          style={{ pointerEvents: "none" }}
        ></div>

        {/* Center Highlight Glow */}
        <div
          className="absolute inset-0 m-auto w-64 h-64 bg-cyan-700 opacity-20 rounded-full blur-[200px]"
          style={{ pointerEvents: "none" }}
        ></div>
<h2
  onClick={() => setShowReviewForm(!showReviewForm)}
  className="text-2xl sm:text-xl md:text-6xl lg:text-2xl font-extrabold text-center 
             bg-clip-text text-transparent bg-gradient-to-r from-[#FFD700] via-[#00BFFF] to-[#FFD700] 
             drop-shadow-[0px_0px_15px_rgba(255,255,255,0.8)] cursor-pointer 
             transition-all duration-300 ease-in-out transform hover:scale-110 hover:drop-shadow-[0px_0px_25px_rgba(255,255,255,1)]"
  style={{ fontFamily: "'Poppins', sans-serif" }}
>
  {showReviewForm ? "❌ Close Review Form" : "⭐ Share Your Experience ⭐"}
</h2>


        <div className="border-b-2 border-gray-300 mx-auto w-1/2 mb-6"></div>
        {showReviewForm && (
          <ReviewForm
            onSubmit={handleAddOrUpdateReview}
            existingReview={editingReview}
            onCancel={() => {
              setEditingReview(null);
              setShowReviewForm(false);
            }}
            triggerFallingEmojis={triggerFallingEmojis} // Pass as a prop
          />
        )}
      </div>
      {/* Error Message */}
      {error && <p className="text-red-500 text-center">{error}</p>}
      {selectedImage && (
  <Modal
  imageUrl={selectedImage.photo_url || "logo.jpeg"} // Ensure fallback here
  caption={selectedImage.comment}
  reviewer={selectedImage.reviewer_name}
  onClose={() => setSelectedImage(null)}
/>
      )}
      {/* Falling Emojis */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
        {emojis.map((emoji) => (
          <div
            key={emoji.id}
            className="absolute text-4xl animate-fall"
            style={{
              top: "-10%", // Start above the viewport
              left: `${emoji.left}%`, // Random horizontal position
              animationDuration: `${Math.random() * 3 + 2}s`, // Random animation duration
            }}
          >
            🧹🫧
          </div>
        ))}
      </div>
    </div>
  );
};

// Review Form Component (unchanged)
const ReviewForm = ({
  onSubmit,
  existingReview = null,
  onCancel,
  triggerFallingEmojis,
}) => {
  const [reviewerName, setReviewerName] = useState(
    existingReview?.reviewer_name || ""
  );
  const [rating, setRating] = useState(existingReview?.rating || 1);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [photoUrl, setPhotoUrl] = useState(existingReview?.photo_url || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    const reviewData = {
      reviewer_name: reviewerName,
      rating,
      comment,
      photo_url: photoUrl,
    };

    onSubmit(reviewData); // Submit the data

    // Reset the form fields
    setReviewerName("");
    setRating(1);
    setComment("");
    setPhotoUrl("");
    triggerFallingEmojis(); // Trigger emoji animation
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border p-4 rounded-lg shadow-md"
    >
      <div>
        <label className="block text-xl text-white underline font-medium">
          Reviewer Name:
        </label>
        <input
          type="text"
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          required
          className="border text-black rounded px-3 py-1 w-full"
        />
      </div>

      {/* Star Rating Input */}
      <div>
        <label className="block text-xl mx-auto text-white font-medium mb-1 underline">
          Star Rating:
        </label>
        <div className="flex">
          {[...Array(5)].map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setRating(index + 1)} // Update rating state
              className={`text-2xl ${
                index < rating ? "text-yellow-400" : "text-gray-300"
              }`}
              style={{ padding: "0", background: "none", border: "none" }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xl underline text-white font-medium">
          Comment:
        </label>
        <textarea
  value={comment}
  placeholder="Max Characters 500"
  onChange={(e) => setComment(e.target.value.slice(0, 500))}
  className="w-full border text-black rounded px-3 py-2"
/>

      </div>

      <div>
        <label className="block text-xl text-white underline font-medium">
          Photo URL:
        </label>
        <div className="relative group">
          <a
            href="https://imgur.com/upload"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-block w-full font-bold text-white text-center mb-2  uppercase rounded-lg
             bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg transition-all duration-300 ease-in-out 
             hover:scale-105 hover:from-green-500 hover:via-green-600 hover:to-green-700 hover:shadow-2xl
             before:absolute before:-inset-1 before:rounded-lg before:bg-green-300 before:blur-lg before:opacity-30"
          >
            <span className="relative z-10">Upload Photo to Imgur</span>
          </a>

          {/* Tooltip */}
          <div
            className="absolute bottom-full mb-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg 
               opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ left: "50%", transform: "translateX(-50%)" }}
          >
            Don't have a URL for your image yet? Click the link. <br />
            1: add your image <br /> 2. right-click on the image and "Copy Image
            Address" <br /> If it doesn't look like this:
            "https://i.imgur.com/rwfrF.jpeg" <br /> try to copy the image
            address once more.
          </div>
        </div>

        <input
          type="url"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full border text-black rounded px-3 py-2"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="py-2 px-4 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white font-bold rounded-lg 
          shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl 
          hover:from-blue-600 hover:via-blue-700 hover:to-blue-800"
        >
          {existingReview ? "Update Review" : "Add Review"}
        </button>
        {existingReview && (
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewList;
