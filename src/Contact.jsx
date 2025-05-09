import React, { useState } from "react";

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
      <div className="bg-white/90 mt-16 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 max-w-6xl w-full">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-900 mb-10">
          ✨ Contact Us
        </h2>

        {message && (
          <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">{message}</div>
        )}
        {error && (
          <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">{error}</div>
        )}

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
              <label htmlFor="agreement">
                I agree to be contacted via SMS, email, or phone. Message and data rates may apply.
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
