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

    try {
      const response = await fetch("http://127.0.0.1:5000/api/contact", {
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
        <h2 className="text-6xl  font-extrabold text-gray-900 text-center mb-6"
        style={{ fontFamily:"aspire, sans-serif"}}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full p-4 text-lg ring-2 ring-black border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder=" Email Address"
              className="w-full p-4 border text-lg ring-2 ring-black rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-lg text-gray-700 text-center font-medium mb-1">
              (Optional)
            </label>
            <input
              type="text"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Phone Number"
              maxLength="14"
              className="w-full p-4 border  ring-2 ring-black rounded-lg text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700  text-center text-lg font-medium mb-1">
              Preferred Contact Method
            </label>
            <select
              name="call_or_text"
              value={formData.call_or_text}
              onChange={handleChange}
              className="w-full text-lg p-4 border ring-2 ring-black rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="call">Call</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div>
            <label className="block text-center text-lg text-gray-700 font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="How may we help you? "
              className="w-full p-3 border text-center text-lg ring-2 ring-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-300"
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
