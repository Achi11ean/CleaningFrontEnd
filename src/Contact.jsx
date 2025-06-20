import React, { useState, useEffect } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    call_or_text: "call",
    description: "",
    status: "pending",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showBubbles, setShowBubbles] = useState(false);
const [formOpen, setFormOpen] = useState(true);
const [statusChecked, setStatusChecked] = useState(false);
useEffect(() => {
  fetch("https://cleaningbackend.onrender.com/api/contact-status")
    .then((res) => res.json())
    .then((data) => {
      setFormOpen(data.is_open);
      setStatusChecked(true);
    })
    .catch((err) => {
      console.error("Failed to fetch contact form status:", err);
      setFormOpen(false); // fallback to disabled
      setStatusChecked(true);
    });
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone_number") {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, "");
    const match = phoneNumber.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [
        match[1] ? `(${match[1]}` : "",
        match[2] ? `) ${match[2]}` : "",
        match[3] ? `-${match[3]}` : "",
      ].join("");
    }
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    const digitsOnlyPhone = formData.phone_number.replace(/\D/g, "");
    if (formData.phone_number && digitsOnlyPhone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const response = await fetch("https://cleaningbackend.onrender.com/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setFormData({
          name: "",
          email: "",
          phone_number: "",
          call_or_text: "call",
          description: "",
          status: "pending",
        });
        setShowBubbles(true);
        setTimeout(() => setShowBubbles(false), 3000);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-700 bg-cover bg-center flex items-center justify-center px-4 py-12"
      style={{ backgroundImage: "url('cleaning8.webp')" }}
    >
<div className="bg-gradient-to-br from-blue-200 via-blue-300 to-indigo-500 bg-opacity-90 mt-16 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-6xl w-full text-white">
        <h2 className="text-4xl border-2 rounded-3xl border-white bg-white/60 sm:text-5xl font-extrabold text-center text-gray-900 mb-4">
          Contact Us
        </h2>

        {message && (
          <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">{message}</div>
        )}
        {error && (
          <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">{error}</div>
        )}
{statusChecked && !formOpen && (
  <div className="relative bg-gradient-to-br from-blue-400 via-indigo-900 to-blue-600 border-4 border-white text-white text-center p-6 sm:p-10 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.25)] mb-10 max-w-[95vw] sm:max-w-2xl mx-auto animate-fade-in backdrop-blur-xl">

    {/* Logo */}


    {/* Heading */}
    <h3 className="text-xl sm:text-3xl font-extrabold tracking-wide font-serif drop-shadow-lg border-2 border-white rounded-xl inline-block px-4 py-2 bg-white/10 backdrop-blur-md">
      🧹 All Our Brooms Are Busy!
    </h3>

    {/* Message */}
    <p className="mt-6 text-sm sm:text-lg italic font-medium px-4">
      We’re currently not accepting new clients at this time. 💔 <br className="hidden sm:block" />
      <span className="block mt-4">
        Please check back soon — we’d love to shine for you later!
      </span>
    </p>
  </div>
)}


{formOpen && (

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full mt-1 p-3 rounded-lg border bg-white shadow-md focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full mt-1 p-3 rounded-lg border bg-white shadow-md focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Phone (Optional)</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                maxLength="14"
                className="w-full mt-1 p-3 rounded-lg border bg-white shadow-md focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">Preferred Contact</label>
              <select
                name="call_or_text"
                value={formData.call_or_text}
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-lg border bg-white shadow-md focus:ring-2 focus:ring-blue-400"
              >
                <option value="call">Call</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6 flex flex-col">
            <div className="flex-grow">
              <label className="block text-sm font-semibold text-gray-700">Message</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="9"
                placeholder="Tell us about your needs or the service you're interested in..."
                className="w-full mt-1 p-3 rounded-lg border bg-white shadow-md focus:ring-2 focus:ring-blue-400"
                required
              ></textarea>
            </div>

            <div className="flex items-start gap-3 text-sm text-gray-600">
              <input
                type="checkbox"
                id="agreement"
                required
                className="mt-1"
              />
              <label className="border-2 bg-white/50 p-2 rounded-2xl font-bold text-red-700 italic" htmlFor="agreement">
                I agree to be contacted via Phone and/or Email. <br/> <br/> Message and data rates may apply.
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-bold shadow-md hover:scale-105 transition-transform"
            >
              Submit Inquiry
            </button>
          </div>
        </form>
)}
        {/* Optional animation */}
        {showBubbles && (
          <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-end">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="bubble bg-blue-400 text-white text-sm font-bold rounded-full p-3 m-2 animate-bubble"
              ></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Contact;
