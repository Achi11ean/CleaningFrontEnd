// src/CreateReview.jsx
import { useState } from "react";
import axios from "axios";

const API_BASE = "https://cleaningback.onrender.com"; // adjust

export default function CreateReview() {
  const [form, setForm] = useState({
    first_name: "",
    last_initial: "",
    rating: 5,
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setError(null);

    // 🔒 Frontend validation:
    if (form.rating < 5 && !form.message.trim()) {
      setError("If your rating is less than 5 stars, please tell us how we can do better.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE}/reviews`, form);

      setStatus("Thank you! Your review is pending approval. 💙");
      setForm({
        first_name: "",
        last_initial: "",
        rating: 5,
        message: "",
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const needsMessage = form.rating < 5;

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl border p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        ⭐ Leave a Review
      </h2>

      <p className="text-gray-500 text-sm mb-6">
        We truly value your feedback. Reviews are published after approval.
      </p>

      {status && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700 font-semibold">
          {status}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Name Fields */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              First Name
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 
                text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div className="w-24">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Last Initial
            </label>
            <input
              name="last_initial"
              value={form.last_initial}
              onChange={handleChange}
              placeholder="A"
              maxLength={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 
                text-center uppercase text-gray-900 placeholder-gray-400
                focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Rating
          </label>
          <select
            name="rating"
            value={form.rating}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 
              text-gray-900 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
            <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
            <option value={3}>⭐⭐⭐ (3 - Okay)</option>
            <option value={2}>⭐⭐ (2 - Not Great)</option>
            <option value={1}>⭐ (1 - Poor)</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Your Review
            {needsMessage && (
              <span className="ml-2 text-red-600 text-xs font-semibold">
                (Required for ratings under 5 ⭐)
              </span>
            )}
          </label>

          {needsMessage && (
            <p className="text-sm text-gray-500 mb-1">
              We’d love to know how we can improve.
            </p>
          )}

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder={
              needsMessage
                ? "Please tell us what we could do better..."
                : "Share your experience (optional for 5-star reviews)"
            }
            rows={5}
            className={`w-full border rounded-lg px-3 py-2 
              text-gray-900 placeholder-gray-400
              focus:ring-2 focus:outline-none
              ${
                needsMessage
                  ? "border-red-300 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            required={needsMessage}
          />
        </div>

        {/* Submit */}
        <button
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          }`}
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
