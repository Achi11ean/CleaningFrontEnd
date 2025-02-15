import React, { useState } from "react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    call_or_text: "call",
    description: "",
    status: "pending", // Default status
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
    const phoneNumber = value.replace(/\D/g, ""); // Remove non-numeric characters
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
  
    // Extract digits only from the phone number
    const digitsOnlyPhone = formData.phone_number.replace(/\D/g, "");
  
    // If phone number is entered, it must be exactly 10 digits
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
        setShowBubbles(true); // Trigger animation
        setTimeout(() => setShowBubbles(false), 3000); // Hide after 3 seconds
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };
  

  return (
    <div
      className="min-h-screen flex items-center bg-gray-600 justify-end pl-10 rounded-xl bg-cover bg-center"
      style={{ backgroundImage: "url('cleaning8.webp')" }}
    >
      <div className="bg-white bg-opacity-90 p-10 rounded-lg overflow-x-auto shadow-2xl max-w-xl justify-center mr-10 w-full top-20">
      <h2
  className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 text-center mb-6"
  style={{ fontFamily: "Aspire, sans-serif" }}
>
  Get In Touch
</h2>


        {message && (
          <div className="mb-4 text-green-700 bg-green-100 p-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">{error}</div>
        )}

<form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
          <label className="block text-sm text-black text-center font-medium mb-1">First & Last Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-4 text-lg bg-gray-900/50 border text-center border-gray-600 rounded-lg text-white placeholder-gray-400 shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Email */}
          <div>
          <label className="block text-sm text-black text-center font-medium mb-1">Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full p-4 text-lg bg-gray-900/50 border text-center border-gray-600 rounded-lg text-white placeholder-gray-400 shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          {/* Phone Number (Optional) */}
          <div>
            <label className="block text-sm text-black text-center font-medium mb-1">(Optional)</label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Phone Number"
              maxLength="14"
              className="w-full p-4 text-lg bg-gray-900/50 border text-center border-gray-600 rounded-lg text-white placeholder-gray-400 shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
          {/* Preferred Contact Method */}
          <div>
            <label className="block text-lg text-black text-center font-medium mb-2">Preferred Contact</label>
            <select
              name="call_or_text"
              value={formData.call_or_text}
              onChange={handleChange}
              className="w-full p-4 text-lg bg-gray-900/50 border text-center border-gray-600 rounded-lg text-white shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="call">Call</option>
              <option value="text">Text</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg text-black text-center font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="How may we assist you? Please provide any details or cleaning packages you'd like to discuss."
              className="w-full p-4 text-lg bg-gray-900/50 border text-center border-gray-600 rounded-lg text-white placeholder-gray-400 shadow-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
              required
            ></textarea>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreement"
              required
              className="w-5 h-5 text-blue-500 border-gray-500 text-center rounded focus:ring focus:ring-blue-500"
            />
            <label htmlFor="agreement" className="text-black text-sm">
              I agree to be contacted via <b>SMS, email, and/or phone call</b>. Message & data rates may apply.
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white text-center font-semibold py-3 rounded-lg hover:from-gray-600 hover:to-gray-800 transition-transform transform hover:scale-105 shadow-lg"
          >
            Submit Inquiry
          </button>
        </form>

      </div>
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
  );
};

export default Contact;
