import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa"; // Import a trash icon for delete button
axios.defaults.baseURL = "http://127.0.0.1:5000";
import { useAuth } from "./AuthContext"; // Adjust the path as necessary

const ContactCenter = () => {
  const [inquiries, setInquiries] = useState([]);
  const { token } = useAuth();
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    reviewer_name: "",
    rating: 1,
    comment: "",
    photo_url: ""
  });
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  const startEditing = (review) => {
    setEditingReview(review.id);
    setEditFormData({
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      photo_url: review.photo_url
    });
  };
  const submitEditReview = async () => {
    try {
      await axios.patch(
        `/api/reviews/${editingReview}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEditingReview(null);
      fetchPendingReviews(); // Refresh reviews
    } catch (err) {
      setReviewsError("Failed to update the review.");
    }
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const paginatedInquiries = inquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const [pendingReviews, setPendingReviews] = useState([]);
  const [reviewsError, setReviewsError] = useState("");
  const fetchPendingReviews = async () => {
    try {
      const response = await axios.get("/api/reviews/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPendingReviews(response.data);
      setReviewsError("");
    } catch (err) {
      setReviewsError("Failed to fetch pending reviews.");
    }
  };
  const approveReview = async (id) => {
    try {
      await axios.patch(
        `/api/reviews/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPendingReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== id)
      );
    } catch (err) {
      setReviewsError("Failed to approve the review.");
    }
  };
  const deleteReview = async (id) => {
    try {
      await axios.delete(`/api/reviews/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPendingReviews((prevReviews) =>
        prevReviews.filter((review) => review.id !== id)
      );
    } catch (err) {
      setReviewsError("Failed to delete the review.");
    }
  };
  
  const [error, setError] = useState("");
  const statusOptions = [
    "pending",
    "contacted",
    "booked",
    "booked & paid",
    "completed",
  ];
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return "N/A";

    const cleaned = ("" + phoneNumber).replace(/\D/g, ""); // Remove all non-numeric characters
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`; // Format the number
    }

    return phoneNumber; // Return as-is if not valid
  };

  const [searchParams, setSearchParams] = useState({
    name: "",
    phone_number: "",
    status: "",
  });

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    fetchPendingReviews();
  }, [token]); // Run when token changes
  
  useEffect(() => {
    fetchInquiries();
  }, [searchParams]);

  const fetchInquiries = async () => {
    try {
      const response = await axios.get("/api/inquiries", {
        params: searchParams,
      });
      setInquiries(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch inquiries.");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await axios.patch(`/api/inquiries/${id}`, {
        status: newStatus,
      });
      setInquiries((prevInquiries) =>
        prevInquiries.map((inquiry) =>
          inquiry.id === id ? { ...inquiry, status: newStatus } : inquiry
        )
      );
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const deleteInquiry = async (id) => {
    try {
      await axios.delete(`/api/inquiries/${id}`);
      setInquiries((prevInquiries) =>
        prevInquiries.filter((inquiry) => inquiry.id !== id)
      );
    } catch (err) {
      setError("Failed to delete inquiry.");
    }
  };
  const formatDateTime = (dateString) => {
    const utcDate = new Date(dateString + "Z"); // Append 'Z' to ensure UTC interpretation
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York", // Adjust to your desired time zone
    }).format(utcDate);
  };

  return (
    <div
      className="max-w-full min-h-screen justify-center items-center mx-auto p-6 rounded-lg shadow-md bg-blue-50"
      style={{
        backgroundImage: "url('bookings.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <h1 className="text-4xl pt-5 font-bold mb-6 text-center text-gray-800">
        Contact Center
      </h1>

      {/* Search Bar */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <input
          type="text"
          name="name"
          placeholder="Search by Name"
          value={searchParams.name}
          onChange={handleSearchChange}
          className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Search by Phone Number"
          value={searchParams.phone_number}
          onChange={handleSearchChange}
          className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          name="status"
          placeholder="Search by Status"
          value={searchParams.status}
          onChange={handleSearchChange}
          className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      <div className="overflow-x-auto flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedInquiries.map((inquiry, index) => {
            const gradientColors = [
              "from-pink-200 to-pink-400",
              "from-blue-200 to-blue-400",
              "from-green-200 to-green-400",
              "from-yellow-200 to-yellow-400",
              "from-purple-200 to-purple-400",
            ];
            const cardGradient = gradientColors[index % gradientColors.length];

            return (
              <div
                key={inquiry.id}
            
                className={`p-5 border-4 border-white rounded-lg shadow-lg bg-gradient-to-br ${cardGradient} text-gray-800`}
                >
                
                
                <h2 className="text-2xl font-bold text-black text-center mb-2">
                  {inquiry.name}
                </h2>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Email:</span> <br />
                  {inquiry.email}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Phone:</span> <br />
                  {formatPhoneNumber(inquiry.phone_number)}
                </p>

                <p className="text-sm mb-1">
                  <span className="font-semibold">Preferred Contact:</span>{" "}
                  {inquiry.call_or_text || "N/A"}
                </p>
                <p className="text-sm mb-3">
                  <span className="font-semibold">Description:</span> <br />
                  {inquiry.description}
                </p>
                <p className="text-sm mb-3">
                  <span className="font-semibold">Submitted:</span> <br />
                  {formatDateTime(inquiry.submitted_at)}
                </p>

                {/* Status Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">
                    Status
                  </label>
                  <select
                    value={inquiry.status}
                    onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                    className="border rounded p-1 shadow-sm w-full"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => deleteInquiry(inquiry.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center"
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center mt-6 gap-4">
  <button
    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
    disabled={currentPage === 1}
    className={`px-4 py-2 rounded ${
      currentPage === 1 ? "bg-white" : "bg-green-500 text-white hover:bg-yellow-600"
    }`}
  >
    Previous
  </button>
  <span className="text-gray-700 font-medium">
    Page {currentPage} of {Math.ceil(inquiries.length / itemsPerPage)}
  </span>
  <button
    onClick={() =>
      setCurrentPage((prev) =>
        prev < Math.ceil(inquiries.length / itemsPerPage) ? prev + 1 : prev
      )
    }
    disabled={currentPage === Math.ceil(inquiries.length / itemsPerPage)}
    className={`px-4 py-2 rounded ${
      currentPage === Math.ceil(inquiries.length / itemsPerPage)
        ? "bg-white"
        : "bg-red-500 text-white hover:bg-blue-600"
    }`}
  >
    Next
  </button>
</div>
<h2 className="text-3xl font-bold mb-4 text-center text-gray-800">
  Pending Reviews
</h2>
{reviewsError && <p className="text-red-500 mb-4 text-center">{reviewsError}</p>}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {pendingReviews.map((review) => (
    <div
      key={review.id}
      className="p-5 border-4 border-white rounded-lg shadow-lg bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800"
    >
      {editingReview === review.id ? (
        <div className="space-y-2">
          <input
            type="text"
            name="reviewer_name"
            value={editFormData.reviewer_name}
            onChange={handleEditChange}
            placeholder="Reviewer Name"
            className="w-full border rounded px-2 py-1"
          />
          <input
            type="number"
            name="rating"
            value={editFormData.rating}
            onChange={handleEditChange}
            min="1"
            max="5"
            placeholder="Rating"
            className="w-full border rounded px-2 py-1"
          />
          <textarea
            name="comment"
            value={editFormData.comment}
            onChange={handleEditChange}
            placeholder="Comment"
            className="w-full border rounded px-2 py-1"
          />
          <input
            type="text"
            name="photo_url"
            value={editFormData.photo_url}
            onChange={handleEditChange}
            placeholder="Photo URL"
            className="w-full border rounded px-2 py-1"
          />
          <div className="flex gap-2">
            <button
              onClick={submitEditReview}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditingReview(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-xl font-semibold mb-2 text-center">
            {review.reviewer_name}
          </h3>
          <p className="mb-2">
            <span className="font-semibold">Rating:</span> {review.rating}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Comment:</span> {review.comment}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-semibold">Submitted:</span>{" "}
            {formatDateTime(review.created_at)}
          </p>
          {review.photo_url && (
            <img
              src={review.photo_url}
              alt={`Review by ${review.reviewer_name}`}
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
          )}

          <div className="flex gap-2">
            <button
              onClick={() => approveReview(review.id)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={() => deleteReview(review.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => startEditing(review)}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
          </div>
        </>
      )}
    </div>
  ))}
</div>

    </div>
  );
};

export default ContactCenter;
