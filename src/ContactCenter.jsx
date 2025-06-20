import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa"; // Import a trash icon for delete button
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import Creations from "./Creation";
import debounce from "lodash.debounce";

axios.defaults.baseURL = "https://cleaningbackend.onrender.com";
import { useAuth } from "./AuthContext"; // Adjust the path as necessary
import Calendar from "./Calendar";

const ContactCenter = () => {
  const [inquiries, setInquiries] = useState([]);
  const [activeTab, setActiveTab] = useState("Agenda"); // Default tab
  const [oldRecords, setOldRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { token } = useAuth();
  const [oneTimeCleanings, setOneTimeCleanings] = useState([]);
  const [cleaningCurrentPage, setCleaningCurrentPage] = useState(1);
  const cleaningItemsPerPage = 5;

  useEffect(() => {
    fetchOneTimeCleanings();
  }, [token]);
  const [editingCleaningId, setEditingCleaningId] = useState(null);
  const [editCleaningFormData, setEditCleaningFormData] = useState({
    inquiry_id: "",
    date_time: "",
    amount: "",
    paid: false,
    notes: "", // Add notes here
  });

  // Calculate paginated data
  useEffect(() => {
    fetchOldRecords();
}, []);
const fetchOldRecords = async () => {
  if (!token) {
      console.error("No authentication token found.");
      return;
  }

  try {
      const response = await axios.get("/api/old_records", {
          headers: { Authorization: `Bearer ${token}` }
      });
      setOldRecords(response.data);
  } catch (error) {
      console.error("Error fetching old records:", error);
  }
};

// Delete old records with authentication
const deleteOldRecords = async () => {
  if (oldRecords.length === 0) {
      setMessage("No records to delete.");
      return;
  }

  // Confirm before deletion
  const confirmDelete = window.confirm(
      `Are you sure you want to delete ${oldRecords.length} old records?`
  );
  if (!confirmDelete) return;

  setLoading(true);
  setMessage("");

  try {
      const response = await axios.delete("/api/cleanup_old_records", {
          headers: { Authorization: `Bearer ${token}` }, // Send token
      });

      setOldRecords([]); // Clear records on success
      setMessage(response.data.message || "Old records deleted successfully!");
  } catch (error) {
      console.error("Error deleting records:", error);
      setMessage("Failed to delete records.");
  } finally {
      setLoading(false);
  }
};
  // Handlers for pagination controls
  const handleCleaningNextPage = () => {
    if (cleaningCurrentPage < cleaningTotalPages) {
      setCleaningCurrentPage(cleaningCurrentPage + 1);
    }
  };
  const handleCleaningPreviousPage = () => {
    if (cleaningCurrentPage > 1) {
      setCleaningCurrentPage(cleaningCurrentPage - 1);
    }
  };

  const [cleaningSummary, setCleaningSummary] = useState(null);
  const fetchCleaningSummary = async () => {
    try {
      const response = await axios.get("/api/total_paid_cleanings_summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCleaningSummary(response.data);
    } catch (err) {
      console.error("Failed to fetch total paid cleanings summary:", err);
    }
  };

  useEffect(() => {
    fetchCleaningSummary();
  }, [token]);
  const startEditingCleaning = (cleaning) => {
    setEditingCleaningId(cleaning.id);
    setEditCleaningFormData({
      inquiry_id: cleaning.inquiry_id,
      date_time: cleaning.date_time,
      amount: cleaning.amount,
      paid: cleaning.paid,
      notes: cleaning.notes || "", // Add notes here
    });
  };

  const handleEditCleaningChange = (e) => {
    const { name, value, type, checked } = e.target;

    // For datetime-local, simply set the value as selected
    setEditCleaningFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value, // No changes needed for datetime-local
    }));
  };

  const [recurringSearchParams, setRecurringSearchParams] = useState({
    inquiry_name: "",
    frequency: "",
    notes: "",
  });

  const [recurringPayments, setRecurringPayments] = useState([]);
  const [newRecurringPayment, setNewRecurringPayment] = useState({
    inquiry_id: "",
    amount: "",
    frequency: "",
    notes: "",
  });
  const fetchRecurringPayments = async () => {
    try {
      const response = await axios.get("/api/recurring_payments", {
        headers: { Authorization: `Bearer ${token}` },
        params: recurringSearchParams, // Pass search params
      });
      setRecurringPayments(response.data);
      setRecurringCurrentPage(1); // Reset to first page
    } catch (err) {
      console.error("Failed to fetch recurring payments:", err);
    }
  };
  const filteredRecurringPayments = recurringPayments.filter((payment) => {
    return (
      payment.inquiry_name
        ?.toLowerCase()
        .includes(recurringSearchParams.inquiry_name.toLowerCase()) &&
      payment.frequency
        ?.toLowerCase()
        .includes(recurringSearchParams.frequency.toLowerCase()) &&
      payment.notes
        ?.toLowerCase()
        .includes(recurringSearchParams.notes.toLowerCase())
    );
  });

  const handleRecurringSearchChange = (e) => {
    const { name, value } = e.target;
    setRecurringSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchRecurringPayments();
  }, [token, recurringSearchParams]);

  const submitEditCleaning = async () => {
    try {
      await axios.patch(
        `/api/one_time_cleanings/${editingCleaningId}`,
        editCleaningFormData, // Send the entire form data
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingCleaningId(null);
      fetchOneTimeCleanings(); // Refresh the list
    } catch (err) {
      console.error("Failed to update one-time cleaning:", err);
    }
  };

  const deleteCleaning = async (id) => {
    try {
      await axios.delete(`/api/one_time_cleanings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOneTimeCleanings((prev) =>
        prev.filter((cleaning) => cleaning.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete one-time cleaning:", err);
    }
  };

  const [editingInquiryId, setEditingInquiryId] = useState(null); // Tracks which inquiry is being edited
  const [editInquiryFormData, setEditInquiryFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    call_or_text: "",
    description: "",
    status: "",
  });
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formattedData = {
      name: editInquiryFormData.name,
      email: editInquiryFormData.email,
      phone_number: editInquiryFormData.phone_number,
      call_or_text: editInquiryFormData.call_or_text,
      description: editInquiryFormData.description,
      status: editInquiryFormData.status,
    };
    try {
      const response = await axios.patch(
        `/api/inquiries/${editingInquiryId}`,
        formattedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Update response:", response.data);
      setEditingInquiryId(null);
      fetchInquiries(); // Refresh inquiries
    } catch (err) {
      console.error("Error updating inquiry:", err);
      setError("Failed to update inquiry.");
    }
  };
  const [isLoading, setIsLoading] = useState(false);

  const fetchOneTimeCleanings = async () => {
    try {
      const response = await axios.get("/api/one_time_cleanings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOneTimeCleanings(response.data); // Ensure `inquiry_name` is part of the response
      setCleaningCurrentPage(1); // Reset to first page
    } catch (err) {
      console.error("Failed to fetch one-time cleanings:", err);
    }
  };

  const [cleaningSearch, setCleaningSearch] = useState(""); // For One-Time Cleanings search
  const handleCleaningSearchChange = (e) => {
    setCleaningSearch(e.target.value.toLowerCase());
  };

  const filteredCleanings = oneTimeCleanings.filter(
    (cleaning) =>
      cleaning.inquiry_name.toLowerCase().includes(cleaningSearch) ||
      (cleaning.notes &&
        String(cleaning.notes).toLowerCase().includes(cleaningSearch)) ||
      (cleaning.paid && "paid".includes(cleaningSearch)) // Check if 'paid' matches the search term
  );

  const displayedCleanings = filteredCleanings.slice(
    (cleaningCurrentPage - 1) * cleaningItemsPerPage,
    cleaningCurrentPage * cleaningItemsPerPage
  );

  const cleaningTotalPages = Math.ceil(
    filteredCleanings.length / cleaningItemsPerPage
  );

  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    reviewer_name: "",
    rating: 1,
    comment: "",
    photo_url: "",
  });
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    fetchRecurringPaid();
  }, [token]);

  const startEditinginquiry = (inquiry) => {
    setEditingInquiryId(inquiry.id);
    setEditInquiryFormData({
      name: inquiry.name,
      email: inquiry.email,
      phone_number: inquiry.phone_number || "",
      call_or_text: inquiry.call_or_text || "",
      description: inquiry.description || "",
      status: inquiry.status || "",
    });
  };
  // State for editing recurring payments
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editRecurringPaymentFormData, setEditRecurringPaymentFormData] =
    useState({
      inquiry_id: "",
      amount: "",
      frequency: "",
      notes: "",
    });

  // Start editing a recurring payment
  const startEditingRecurringPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setEditRecurringPaymentFormData({
      inquiry_id: payment.inquiry_id,
      amount: payment.amount,
      frequency: payment.frequency,
      notes: payment.notes,
    });
  };

  // Handle form input changes for editing recurring payments
  const handleEditRecurringPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditRecurringPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const [recurringPaid, setRecurringPaid] = useState([]);
  const [newRecurringPaid, setNewRecurringPaid] = useState({
    recurring_payment_id: "",
    dates_related: [], // Store dates as an array
    amount_paid: "",
    notes: "",
  });

  const [editingPaidId, setEditingPaidId] = useState(null);
  const [editPaidFormData, setEditPaidFormData] = useState({
    recurring_payment_id: "",
    dates_related: [], // Initialize as an empty array
    amount_paid: "",
    notes: "",
  });
  const startEditingPaid = (payment) => {
    setEditPaidFormData({
      recurring_payment_id: payment.recurring_payment_id,
      dates_related: payment.dates_related
        ? payment.dates_related.split(", ") // Convert string to array if necessary
        : [],
      amount_paid: payment.amount_paid,
      notes: payment.notes,
    });
  };

  const fetchRecurringPaid = async (name = "") => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/recurring_paid", {
        headers: { Authorization: `Bearer ${token}` },
        params: { name },
      });
      setRecurringPaid(response.data);
      setRecurringPaidCurrentPage(1); // Reset to the first page on new fetch
    } catch (err) {
      console.error("Failed to fetch recurring paid records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const submitEditRecurringPaid = async () => {
    try {
      // Ensure dates_related is sent as a comma-separated string
      const formattedData = {
        ...editPaidFormData,
        dates_related: editPaidFormData.dates_related.join(", "), // Convert array to a string
      };

      await axios.patch(
        `/api/recurring_paid/${editingPaidId}`,
        formattedData, // Submit the formatted data
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Reset the editing state and refresh the data
      setEditingPaidId(null);
      fetchRecurringPaid(); // Refresh the list
    } catch (err) {
      console.error("Failed to update recurring paid record:", err);
    }
  };

  const deleteRecurringPaid = async (id) => {
    try {
      await axios.delete(`/api/recurring_paid/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecurringPaid((prev) => prev.filter((paid) => paid.id !== id));
    } catch (err) {
      console.error("Failed to delete recurring paid record:", err);
    }
  };

  // Submit edit for a recurring payment
  const submitEditRecurringPayment = async () => {
    try {
      await axios.patch(
        `/api/recurring_payments/${editingPaymentId}`,
        editRecurringPaymentFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEditingPaymentId(null);
      fetchRecurringPayments(); // Refresh the list
    } catch (err) {
      console.error("Failed to update recurring payment:", err);
    }
  };

  // Delete a recurring payment
  const deleteRecurringPayment = async (id) => {
    try {
      await axios.delete(`/api/recurring_payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecurringPayments((prev) =>
        prev.filter((payment) => payment.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete recurring payment:", err);
    }
  };
  const startEditing = (review) => {
    setEditingReview(review.id);
    setEditFormData({
      reviewer_name: review.reviewer_name,
      rating: review.rating,
      comment: review.comment,
      photo_url: review.photo_url,
    });
  };
  const submitEditReview = async () => {
    try {
      await axios.patch(`/api/reviews/${editingReview}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingReview(null);
      fetchPendingReviews(); // Refresh reviews
    } catch (err) {
      setReviewsError("Failed to update the review.");
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
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
    "New Inquiry",
    "Contacted",
    "Booked",
    "Paused",
    "Completed",
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
    if (!dateString) {
      console.error("Invalid dateString passed to formatDateTime:", dateString);
      return "Invalid Date";
    }

    try {
      // Parse the date string directly
      const utcDate = new Date(dateString);
      if (isNaN(utcDate.getTime())) {
        throw new Error("Invalid Date");
      }

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
    } catch (error) {
      console.error("Error formatting dateString:", dateString, error);
      return "Invalid Date";
    }
  };

  const [recurringCurrentPage, setRecurringCurrentPage] = useState(1);
  const recurringItemsPerPage = 5; // Adjust as needed
  const recurringTotalPages = Math.ceil(
    filteredRecurringPayments.length / recurringItemsPerPage
  );

  const displayedRecurringPayments = filteredRecurringPayments.slice(
    (recurringCurrentPage - 1) * recurringItemsPerPage,
    recurringCurrentPage * recurringItemsPerPage
  );

  const handleRecurringNextPage = () => {
    if (recurringCurrentPage < recurringTotalPages) {
      setRecurringCurrentPage(recurringCurrentPage + 1);
    }
  };

  const handleRecurringPreviousPage = () => {
    if (recurringCurrentPage > 1) {
      setRecurringCurrentPage(recurringCurrentPage - 1);
    }
  };

  const [recurringPaidCurrentPage, setRecurringPaidCurrentPage] = useState(1);
  const recurringPaidItemsPerPage = 5;
  const recurringPaidTotalPages = Math.ceil(
    recurringPaid.length / recurringPaidItemsPerPage
  );

  const displayedRecurringPaid = recurringPaid.slice(
    (recurringPaidCurrentPage - 1) * recurringPaidItemsPerPage,
    recurringPaidCurrentPage * recurringPaidItemsPerPage
  );

  const handleRecurringPaidNextPage = () => {
    if (recurringPaidCurrentPage < recurringPaidTotalPages) {
      setRecurringPaidCurrentPage((prev) => prev + 1);
    }
  };

  const handleRecurringPaidPreviousPage = () => {
    if (recurringPaidCurrentPage > 1) {
      setRecurringPaidCurrentPage((prev) => prev - 1);
    }
  };

  const debouncedSearch = debounce((value) => {
    fetchRecurringPaid(value);
  }, 300); // 300ms debounce delay

  const handleSearchPaidChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };
  const [showAlert, setShowAlert] = useState(false);
  useEffect(() => {
    if (oldRecords.length > 20) {
        setShowAlert(true);
    } else {
        setShowAlert(false);
    }
}, [oldRecords.length]);



const [contactFormOpen, setContactFormOpen] = useState(true);
const [statusLoading, setStatusLoading] = useState(false);
const toggleContactFormStatus = async () => {
  try {
    setStatusLoading(true);
    const response = await axios.patch(
      "/api/contact-status",
      { is_open: !contactFormOpen },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setContactFormOpen(response.data.is_open);
  } catch (error) {
    console.error("Failed to toggle contact form status:", error);
  } finally {
    setStatusLoading(false);
  }
};

const fetchContactFormStatus = async () => {
  try {
    const response = await axios.get("/api/contact-status");
    setContactFormOpen(response.data.is_open);
  } catch (error) {
    console.error("Failed to fetch contact form status:", error);
  }
};

useEffect(() => {
  fetchContactFormStatus();
}, []);


  // -----------------------------------------------------------------------------------------------------------------------------------End of Logic
  return (
    <div
      className="max-w-full min-h-screen mx-auto p-6 rounded-lg shadow-md bg-blue-500"
      style={{
        backgroundImage: "url('bookings22.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <h1
          className="text-5xl pt-5 rounded-3xl font-bold mb-8 pb-3 mt-20 text-center  bg-gradient-to-r from-pink-400 via-purple-300 to-yellow-300 shadow-lg"
          style={{ fontFamily: "'Pacifico', 'Dancing Script', cursive" }}
        >
          Amanda's Hub
        </h1>
        {showAlert && (
  <div>
    <div
    title="--> Manage tab --> at the very bottom you can delete anything over 90 days old!."
    className="left-0 right-0 bg-red-600 text-white p-4 text-center font-bold animate-bounce">
      ⚠️ Warning: Database is getting large! Consider cleaning up old records. ⚠️
      
    </div>


  </div>
)}

        {/* Tab Navigation */}
        <div className="flex justify-center space-x-4 mb-6">
          {["Agenda", "Manage", "Create Cleaning"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold rounded-lg transition-all duration-300 shadow-md ${
                activeTab === tab
                  ? "bg-gradient-to-b from-blue-300 via-blue-600 to-black text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 hover:bg-blue-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className=" rounded-4xl   shadow-md">
          {activeTab === "Agenda" && (
            <div>
              <Calendar />
            </div>
          )}

          {activeTab === "Create Cleaning" && (
            <Creations inquiries={inquiries} />
          )}
        </div>
        {/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/*                                                                  End of Creation Logic*/}
        {/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------- */}

        {activeTab === "Manage" && (
          <div className="flex flex-col items-center justify-center">
<div className="mb-6 flex justify-center">
  <button
    onClick={toggleContactFormStatus}
    disabled={statusLoading}
    className={`px-6 py-3 rounded-full text-white font-bold shadow-lg transition-all ${
      contactFormOpen
        ? "bg-green-500 hover:bg-green-600"
        : "bg-red-500 hover:bg-red-600"
    }`}
  >
    {statusLoading
      ? "Updating..."
      : contactFormOpen
      ? "✅ Contact Form is OPEN – Click to Disable"
      : "🚫 Contact Form is CLOSED – Click to Enable"}
  </button>
</div>


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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {paginatedInquiries.map((inquiry, index) => {
                  const gradientColors = [
                    "from-pink-200 to-pink-400",
                    "from-blue-200 to-blue-400",
                    "from-green-200 to-green-400",
                    "from-yellow-200 to-yellow-400",
                    "from-purple-200 to-purple-400",
                  ];
                  const cardGradient =
                    gradientColors[index % gradientColors.length];

                  return (
                    <div
                      key={inquiry.id}
                      className={`p-5 border-4 max-w-sm border-white rounded-lg shadow-lg bg-gradient-to-br ${cardGradient} text-gray-800`}
                    >
                      {editingInquiryId === inquiry.id ? (
                        // Edit form for inquiry
                        <form className="space-y-2">
                          <input
                            type="text"
                            name="name"
                            value={editInquiryFormData.name}
                            onChange={(e) =>
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            placeholder="Name"
                            className="block w-full mb-2 p-2 border rounded"
                          />
                          <input
                            type="email"
                            name="email"
                            value={editInquiryFormData.email}
                            onChange={(e) =>
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            placeholder="Email"
                            className="block w-full mb-2 p-2 border rounded"
                          />
                          <input
                            type="text"
                            name="phone_number"
                            value={editInquiryFormData.phone_number}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(
                                /\D/g,
                                ""
                              ); // Remove non-numeric characters
                              if (rawValue.length > 10) return; // Prevent more than 10 digits
                              const formattedValue =
                                formatPhoneNumber(rawValue); // Apply formatting
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: formattedValue,
                              }));
                            }}
                            placeholder="Phone Number"
                            className="block w-full mb-2 p-2 border rounded"
                          />

                          <select
                            name="call_or_text"
                            value={editInquiryFormData.call_or_text}
                            onChange={(e) =>
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            className="block w-full mb-2 p-2 border rounded"
                          >
                            <option value="call">Call</option>
                            <option value="text">Text</option>
                          </select>
                          <textarea
                            name="description"
                            value={editInquiryFormData.description}
                            onChange={(e) =>
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            placeholder="Description"
                            className="block w-full mb-2 p-2 border rounded"
                          />
                          <select
                            name="status"
                            value={editInquiryFormData.status}
                            onChange={(e) =>
                              setEditInquiryFormData((prev) => ({
                                ...prev,
                                [e.target.name]: e.target.value,
                              }))
                            }
                            className="block w-full mb-2 p-2 border rounded"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleEditSubmit}
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingInquiryId(null)}
                              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Display inquiry details
                        <>
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
                            <span className="font-semibold">
                              Preferred Contact:
                            </span>{" "}
                            {inquiry.call_or_text || "N/A"}
                          </p>
                          <p className="text-sm mb-3">
                            <span className="font-semibold">Description:</span>
                            <br />
                            <div
                              className="max-h-24 overflow-y-auto"
                              style={{
                                wordBreak: "break-word", // Ensures long words wrap within the container
                                whiteSpace: "pre-wrap", // Preserves line breaks and spaces
                              }}
                            >
                              {inquiry.description ||
                                "No description available"}
                            </div>
                          </p>

                          <p className="text-sm mb-3">
                            <span className="font-semibold">Submitted:</span>{" "}
                            <br />
                            {formatDateTime(inquiry.submitted_at)}
                          </p>
                          <div className="mb-4">
                            <label className="block text-sm font-semibold mb-1">
                              Status
                            </label>
                            <select
                              value={inquiry.status}
                              onChange={(e) =>
                                updateStatus(inquiry.id, e.target.value)
                              }
                              className="border rounded p-1 shadow-sm w-full"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => startEditinginquiry(inquiry)}
                              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteInquiry(inquiry.id)}
                              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
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
                  currentPage === 1
                    ? "bg-white"
                    : "bg-green-500 text-white hover:bg-yellow-600"
                }`}
              >
                Previous
              </button>
              <span className="text-gray-700 font-medium">
                Page {currentPage} of{" "}
                {Math.ceil(inquiries.length / itemsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < Math.ceil(inquiries.length / itemsPerPage)
                      ? prev + 1
                      : prev
                  )
                }
                disabled={
                  currentPage === Math.ceil(inquiries.length / itemsPerPage)
                }
                className={`px-4 py-2 rounded ${
                  currentPage === Math.ceil(inquiries.length / itemsPerPage)
                    ? "bg-white"
                    : "bg-red-500 text-white hover:bg-blue-600"
                }`}
              >
                Next
              </button>
            </div>
            {/* ------------------------------------------------END OF INQUIRY ------------------------------------------------------------------- */}

            <div className="mt-6 ">
              <div className="flex justify-center my-4">
                <input
                  type="text"
                  placeholder="Search Cleanings by Inquiry Name or Notes"
                  value={cleaningSearch}
                  onChange={handleCleaningSearchChange}
                  className="border px-4 py-2 w-full rounded"
                />
              </div>
              <div className="w-full  h-1 bg-white mx-auto "></div>

              <div className="relative py-8 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 opacity-50 rounded-lg"></div>
                <h2 className="relative z-10 text-4xl font-extrabold text-center text-white tracking-wide drop-shadow-md font-[Poppins]">
                  One-Time Cleanings
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
  {displayedCleanings.map((cleaning) => (
    <div key={cleaning.id} className="bg-white shadow-lg rounded-lg p-4">
      {editingCleaningId === cleaning.id ? (
        // Edit Mode
        <>
          <div className="mb-3">
            <label className="text-sm font-semibold">Inquiry Name</label>
            <select
              name="inquiry_id"
              value={editCleaningFormData.inquiry_id}
              onChange={handleEditCleaningChange}
              className="block w-full p-2 border rounded"
            >
              <option value="" disabled>Select an Inquiry</option>
              {inquiries.map((inquiry) => (
                <option key={inquiry.id} value={inquiry.id}>
                  {inquiry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Date and Time</label>
            <input
              type="datetime-local"
              name="date_time"
              value={editCleaningFormData.date_time}
              onChange={handleEditCleaningChange}
              className="block w-full p-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Amount</label>
            <input
              type="number"
              name="amount"
              value={editCleaningFormData.amount}
              onChange={handleEditCleaningChange}
              className="block w-full p-2 border rounded"
            />
          </div>

          <div className="mb-3 flex items-center">
            <input
              type="checkbox"
              name="paid"
              checked={editCleaningFormData.paid}
              onChange={handleEditCleaningChange}
              className="form-checkbox h-5 w-5"
            />
            <span className="ml-2">Paid</span>
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              name="notes"
              value={editCleaningFormData.notes}
              onChange={handleEditCleaningChange}
              className="block w-full p-2 border rounded"
              placeholder="Add notes here..."
            ></textarea>
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitEditCleaning}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditingCleaningId(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        // Display Mode
        <>
<h3 className="text-xl sm:text-3xl font-semibold text-center p-2  rounded-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-400">
  {cleaning.inquiry_name}
</h3>


          <p className="text-md text-gray-600">
            <strong>Date & Time:</strong> <br/> {formatDateTime(cleaning.date_time)}
          </p>
          <p className="text-md text-gray-600">
            <strong>Amount:</strong> ${cleaning.amount}
          </p>
          <p className="text-md text-gray-600">
            <strong>Paid:</strong> {cleaning.paid ? "Yes" : "No"}
          </p>

          <div className="text-md text-gray-600 mt-2">
            <strong>Notes:</strong>
            <div className="max-h-20 max-w-60 overflow-y-auto break-words">
              {cleaning.notes || "No notes available"}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => startEditingCleaning(cleaning)}
              className="bg-green-400 text-black px-4 py-2 rounded hover:bg-yellow-600"
            >
               Edit ✐
            </button>
            <button
              onClick={() => deleteCleaning(cleaning.id)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              X
            </button>
          </div>
        </>
      )}
    </div>
  ))}
</div>
              <div className="flex justify-center mt-4 gap-4">
                <button
                  onClick={handleCleaningPreviousPage}
                  disabled={cleaningCurrentPage === 1}
                  className={`px-4 py-2 rounded ${
                    cleaningCurrentPage === 1
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {cleaningCurrentPage} of {cleaningTotalPages}
                </span>
                <button
                  onClick={handleCleaningNextPage}
                  disabled={cleaningCurrentPage === cleaningTotalPages}
                  className={`px-4 py-2 rounded ${
                    cleaningCurrentPage === cleaningTotalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap gap-4 mb-6 justify-center">
                <input
                  type="text"
                  name="inquiry_name"
                  placeholder="Search by Inquiry Name"
                  value={recurringSearchParams.inquiry_name}
                  onChange={handleRecurringSearchChange}
                  className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="frequency"
                  placeholder="Search by Frequency"
                  value={recurringSearchParams.frequency}
                  onChange={handleRecurringSearchChange}
                  className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="notes"
                  placeholder="Search by Notes"
                  value={recurringSearchParams.notes}
                  onChange={handleRecurringSearchChange}
                  className="border rounded-lg p-2 w-72 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="relative z-10  text-center">
                <div className="w-full  h-1 bg-white mx-auto "></div>
              </div>
              <div className="relative py-8 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-50 rounded-lg"></div>
                <h2 className="relative z-10 text-4xl font-extrabold text-center text-white tracking-wide drop-shadow-md font-[Poppins]">
                  Recurring Scheduler
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
  {displayedRecurringPayments.map((payment) => (
    <div key={payment.id} className="bg-white shadow-lg rounded-lg p-4">
      {editingPaymentId === payment.id ? (
        // Edit Mode
        <>
          <div className="mb-3">
            <label className="text-md font-semibold">Inquiry Name</label>
            <select
              name="inquiry_id"
              value={editRecurringPaymentFormData.inquiry_id}
              onChange={handleEditRecurringPaymentChange}
              className="block w-full p-2 border rounded"
            >
              <option value="" disabled>Select an Inquiry</option>
              {inquiries.map((inquiry) => (
                <option key={inquiry.id} value={inquiry.id}>
                  {inquiry.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Amount</label>
            <input
              type="number"
              name="amount"
              value={editRecurringPaymentFormData.amount}
              onChange={handleEditRecurringPaymentChange}
              placeholder="Amount"
              className="block w-full p-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Frequency</label>
            <input
              type="text"
              name="frequency"
              value={editRecurringPaymentFormData.frequency}
              onChange={handleEditRecurringPaymentChange}
              placeholder="Frequency"
              className="block w-full p-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              name="notes"
              value={editRecurringPaymentFormData.notes}
              onChange={handleEditRecurringPaymentChange}
              placeholder="Notes"
              className="block w-full p-2 border rounded"
            ></textarea>
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitEditRecurringPayment}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditingPaymentId(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        // Display Mode
        <>
          <h3 className="text-xl sm:text-3xl font-semibold text-center p-2  rounded-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-400">
            {payment.inquiry_name}
          </h3>

          <p className="text-lg text-gray-600">
            <strong>Amount:</strong> ${payment.amount}
          </p>

          <p className="text-lg text-gray-600">
            <strong>Frequency:</strong> <br/> {payment.frequency}
          </p>

          <div className="text-md text-gray-600 mt-2">
            <strong>Notes:</strong>
            <div className="max-h-20 max-w-60 overflow-y-auto break-words">
              {payment.notes || "None"}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => startEditingRecurringPayment(payment)}
              className="bg-green-400 text-black px-4 py-2 rounded hover:bg-yellow-600"
            >
               Edit ✐
               </button>
            <button
              onClick={() => deleteRecurringPayment(payment.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              X
            </button>
          </div>
        </>
      )}
    </div>
  ))}
</div>
              <div className="flex justify-center mt-4 gap-4">
                <button
                  onClick={handleRecurringPreviousPage}
                  disabled={recurringCurrentPage === 1}
                  className={`px-4 py-2 rounded ${
                    recurringCurrentPage === 1
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {recurringCurrentPage} of {recurringTotalPages}
                </span>
                <button
                  onClick={handleRecurringNextPage}
                  disabled={recurringCurrentPage === recurringTotalPages}
                  className={`px-4 py-2 rounded ${
                    recurringCurrentPage === recurringTotalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={handleSearchPaidChange}
                  className="border px-4 py-2 w-full rounded"
                />
              </div>
              <div className="relative z-10  text-center">
                <div className="w-full  h-1 bg-black mx-auto "></div>
              </div>
              <div className="relative py-8 bg-opacity-80 backdrop-blur-lg rounded-lg shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-600 opacity-50 rounded-lg"></div>
                <h2 className="relative z-10 text-4xl font-extrabold text-center text-white tracking-wide drop-shadow-md font-[Poppins]">
                  Recurring Paid Records
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
  {displayedRecurringPaid.map((paid) => (
    <div key={paid.id} className="bg-white shadow-lg rounded-lg p-4">
      {editingPaidId === paid.id ? (
        // Edit Mode
        <>
          <div className="mb-3">
            <label className="text-sm font-semibold">Recurring Payment</label>
            <select
              name="recurring_payment_id"
              value={editPaidFormData.recurring_payment_id}
              onChange={(e) =>
                setEditPaidFormData((prev) => ({
                  ...prev,
                  recurring_payment_id: e.target.value,
                }))
              }
              className="block w-full p-2 border rounded"
            >
              <option value="" disabled>Select Recurring Payment</option>
              {recurringPayments.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {payment.inquiry_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Dates Related</label>
            {Array.isArray(editPaidFormData.dates_related) &&
              editPaidFormData.dates_related.map((date, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="datetime-local"
                    name="dates_related"
                    value={date}
                    onChange={(e) => {
                      const updatedDates = [...editPaidFormData.dates_related];
                      updatedDates[index] = e.target.value;
                      setEditPaidFormData((prev) => ({
                        ...prev,
                        dates_related: updatedDates,
                      }));
                    }}
                    className="block w-full p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditPaidFormData((prev) => ({
                        ...prev,
                        dates_related: prev.dates_related.filter((_, i) => i !== index),
                      }));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

            <button
              type="button"
              onClick={() => {
                setEditPaidFormData((prev) => ({
                  ...prev,
                  dates_related: [...(prev.dates_related || []), ""],
                }));
              }}
              className="mt-2 bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
            >
              Add Date
            </button>
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Amount Paid</label>
            <input
              type="number"
              name="amount_paid"
              value={editPaidFormData.amount_paid}
              onChange={(e) =>
                setEditPaidFormData((prev) => ({
                  ...prev,
                  amount_paid: e.target.value,
                }))
              }
              placeholder="Amount Paid"
              className="block w-full p-2 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              name="notes"
              value={editPaidFormData.notes}
              onChange={(e) =>
                setEditPaidFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder="Notes"
              className="block w-full p-2 border rounded"
            ></textarea>
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitEditRecurringPaid}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditingPaidId(null)}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        // Display Mode
        <>
          <h3 className="text-xl sm:text-3xl font-semibold text-center p-2  rounded-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-pink-400">
            {paid.recurring_payment_name}
          </h3>

          <p className="text-md text-gray-600">
            <strong>Dates Related:</strong> <br />
            {paid.dates_related
              ? paid.dates_related
                  .split(", ")
                  .map((date, index) => (
                    <span key={index} className="block">
                      {formatDateTime(date)}
                    </span>
                  ))
              : "None"}
          </p>

          <p className="text-lg text-gray-600">
            <strong>Amount Paid:</strong> ${paid.amount_paid}
          </p>

          <p className="text-lg text-gray-600">
            <strong>Submitted At:</strong> <br/> {new Date(paid.submitted_at).toLocaleString()}
          </p>

          <div className="text-lg text-gray-600 mt-2">
            <strong>Notes:</strong>
            <div className="max-h-20 max-w-60 overflow-y-auto break-words">
              {paid.notes || "None"}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setEditingPaidId(paid.id);
                startEditingPaid(paid);
              }}
              className="bg-green-400 text-black px-4 py-2 rounded hover:bg-yellow-600"
            >
               Edit ✐
               </button>
            <button
              onClick={() => deleteRecurringPaid(paid.id)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              X
            </button>
          </div>
        </>
      )}
    </div>
  ))}
</div>

              <div className="flex justify-center mt-4 gap-4">
                <button
                  onClick={handleRecurringPaidPreviousPage}
                  disabled={recurringPaidCurrentPage === 1}
                  className={`px-4 py-2 rounded ${
                    recurringPaidCurrentPage === 1
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {recurringPaidCurrentPage} of {recurringPaidTotalPages}
                </span>
                <button
                  onClick={handleRecurringPaidNextPage}
                  disabled={
                    recurringPaidCurrentPage === recurringPaidTotalPages
                  }
                  className={`px-4 py-2 rounded ${
                    recurringPaidCurrentPage === recurringPaidTotalPages
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">
              Pending Reviews
            </h2>
            {reviewsError && (
              <p className="text-red-500 mb-4 text-center">{reviewsError}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <span className="font-semibold">Rating:</span>{" "}
                        {review.rating}
                      </p>
                      <p className="mb-2 max-h-32 overflow-y-auto">
                        <span className="font-semibold">Comment:</span>{" "}
                        {review.comment}
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
            <div className="max-w-xl mx-auto p-6 bg-black rounded-lg shadow-md">
            <h2 
        className={`text-2xl font-bold mb-4 text-center  animate-pulse ${
            oldRecords.length < 10 ? "text-green-400" :
            oldRecords.length < 20 ? "text-yellow-400" :
            "text-red-500"
        }`}
    >
        Cleanup Old Records ({oldRecords.length})
    </h2>
    {oldRecords.length > 0 ? (
        <ul className="mb-4 border rounded p-4 bg-gray-100 max-h-60 overflow-y-auto">
            {oldRecords.map((record) => (
                <li key={record.id} className="p-2 border-b last:border-0">
                    <strong>{record.name || "Unnamed Record"}</strong> - {record.submitted_at} ({record.type})
                    {record.dates_related && <span> | Dates: {record.dates_related}</span>}
                </li>
            ))}
        </ul>
    ) : (
        <p className="text-gray-500">No old records found.</p>
    )}

    <button
        onClick={deleteOldRecords}
        className="w-full h-2xl bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-400"
        disabled={loading}
    >
        {loading ? "Deleting..." : `Delete ${oldRecords.length} Old Records`}
    </button>

    {message && <p className="mt-4 text-green-600">{message}</p>}
</div>

          </div>
        )}

        {/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/*                                                                  End of Manage Logic*/}
        {/* ----------------------------------------------------------------------------------------------------------------------------------------------------------------- */}
      </div>
    </div>
  );
};

export default ContactCenter;
