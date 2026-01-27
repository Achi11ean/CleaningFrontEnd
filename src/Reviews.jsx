import React, { useEffect, useState } from "react";
import axios from "axios";
import CreateReview from "./CreateReview";

const API_BASE = "https://cleaningback.onrender.com";

const ReviewList = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  const [showCreate, setShowCreate] = useState(false);

  // 🔹 Fetch approved reviews from backend
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/reviews/public`);
        setReviews(res.data || []);
      } catch (err) {
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-blue-950 to-black min-h-screen pt-24 text-gray-100">
      {/* Decorative glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent)] pointer-events-none"></div>

      {/* Section Title */}
      <section className="text-center relative z-10 px-4">
        <h1 className="text-3xl md:text-5xl mt-6 border-b-2 border-yellow-400 
          font-extrabold text-blue-400 drop-shadow-lg tracking-wider uppercase">
          What Our Clients Say
        </h1>
        <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
          Real stories from happy clients who trust us to make their spaces
          spotless ✨
        </p>
      </section>

      {/* Leave a Review Button */}
      <div className="flex justify-center mt-8 relative z-10">
        <button
          onClick={() => setShowCreate(true)}
          className="px-8 py-3 rounded-2xl border-2 border-white font-bold text-lg 
            bg-gradient-to-r from-slate-300 via-white to-slate-400
            text-black shadow-xl hover:scale-105 hover:shadow-2xl transition transform"
        >
          ✍️ Leave a Review
        </button>
      </div>

      {/* Create Review Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full mx-4 animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => setShowCreate(false)}
              className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 
                text-white w-10 h-10 rounded-full font-bold shadow-lg transition"
            >
              ✕
            </button>

            <CreateReview />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-24 text-gray-400 font-semibold">
          Loading reviews...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 text-red-400 font-semibold">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && reviews.length === 0 && (
        <div className="text-center py-24 text-gray-400">
          No reviews yet — be the first to leave one! ✨
        </div>
      )}

      {/* Reviews Grid */}
      {!loading && !error && reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {currentReviews.map((review) => (
            <div
              key={review.id}
              className="bg-gradient-to-b from-gray-900 to-gray-800 
                p-6 rounded-2xl shadow-xl border border-blue-700/40 
                hover:shadow-blue-500/40 transition transform hover:scale-[1.03]"
            >
              {/* Name */}
              <p className="text-lg font-bold text-blue-300 mb-1">
                {review.first_name} {review.last_initial}.
              </p>

              {/* Stars */}
              <div className="flex space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`${
                      i < review.rating ? "text-yellow-400" : "text-gray-600"
                    } text-lg drop-shadow`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Message */}
              <p className="text-sm text-gray-300 max-h-[200px] overflow-auto  leading-relaxed">
                {review.message}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-4 pb-16 relative z-10">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              currentPage === 1
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow"
            }`}
          >
            Previous
          </button>

          <span className="text-gray-300 font-semibold">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              currentPage === totalPages
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
