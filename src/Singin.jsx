import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Import AuthContext for login handling

const SignIn = () => {
  const { login } = useAuth(); // Use the login function from AuthContext
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState(false); // New state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:5000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("API response:", data); // Debugging

      if (response.ok) {
        login(data.token); // Call AuthContext's login function
        setWelcomeMessage(true); // Show Welcome Message
        setTimeout(() => {
          setWelcomeMessage(false); // Hide message after 5 seconds
          navigate("/contact-center"); // Redirect to Contact Center
        }, 5000); // Delay for 5 seconds
      } else {
        setError(data.error || "Sign-in failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('signin2.webp')", // Set your background image
      }}
    >
      {welcomeMessage ? (
        <div className="text-center">
          <h2 className="text-5xl font-extrabold text-white animate-pulse">
            Welcome Home!
          </h2>
        </div>
      ) : (
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
              Welcome Back, Arif!
            </h1>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 text-red-700 border-l-4 border-red-500 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-gray-700 mb-2 font-medium">
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

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2 font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg"
            >
              Sign In
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-500">
              Forgot your password?{" "}
              <a href="/forgot-password" className="text-blue-600 hover:underline">
                Reset here
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
