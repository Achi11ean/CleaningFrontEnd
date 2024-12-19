import React, { useState } from "react";

const Forgot = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
        const response = await fetch("http://127.0.0.1:5000/forgot_password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username }),
          });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Password reset link sent to your email.");
        setUsername(""); // Clear the form
      } else {
        setError(data.error || "Failed to send reset email. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
<div
  className="min-h-screen flex items-center justify-center"
  style={{
    background: `
      linear-gradient(to bottom right, rgba(243, 244, 246, 0.7), rgba(209, 213, 219, 0.7)), 
      url('forgot2.webp')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Forgot Password
        </h2>
        <p className="text-center text-gray-500 mb-6">
          Enter your username, and we'll send you a reset link.
        </p>

        {message && (
          <div className="mb-4 bg-green-100 text-green-700 border-l-4 border-green-500 p-3 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 border-l-4 border-red-500 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="username"
              className="block text-gray-700 font-medium mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your username"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition duration-300 shadow-lg"
          >
            Send Reset Link
          </button>
        </form>

        <div className="text-center mt-6">
          <a
            href="/signin"
            className="text-blue-600 hover:underline font-medium"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default Forgot;
