import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Import AuthContext for login handling
import "./App.css"

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
  const messages = [
    "Welcome Home, Superstar!",
    "You're a Legend!",
    "Go Get 'Em, Tiger!",
    "You Rock!",
    "You're a Star!",
    "Keep Shining!",
    "You're Unstoppable!",
    "Keep Crushing It!",
    "Today’s Your Day!",
    "You’re a Champion!",
    "You’re On Fire!",
    "You’re the Real MVP!",
    "You’re the Dream Team!",
    "Good Vibes Only!",
    "You Got This!",
    "You're Killing It!",
    "Keep Being Awesome!",
    "Nothing Can Stop You!",
    "You’re a Force of Nature!",
    "You Make Magic Happen!",
    "The World’s Better with You!",
    "You’re a Game Changer!",
    "Stay Fabulous!",
    "You’re So Powerful!",
    "You’re a Treasure!",
    "Keep Up the Amazing Work!",
    "You're a Boss!",
    "You’re Truly Incredible!",
    "You're Pure Gold!",
    "You're Simply the Best!",
    "You Make Everything Better!",
    "Keep Doing Your Thing!",
    "You're All That and More!",
    "You’ve Got It Going On!",
    "You're On Top of the World!",
    "You’re So Cool!",
    "You're a Work of Art!",
    "You’re a True Inspiration!",
    "Keep Being Legendary!",
    "You’re One in a Million!",
    "Keep Rocking It!",
    "You're Limitless!",
    "You're Simply Brilliant!",
    "Keep Being the Best!",
    "You Bring the Magic!",
    "You’re Pure Awesome!",
    "You’re One-of-a-Kind!",
    "Keep Shining Bright!",
    "You’ve Got the Power!",
    "You’re an Absolute Boss!"
  ];
  
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  useEffect(() => {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);
  }, []); 

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('signin22.webp')", // Set your background image
      }}
    >
      {welcomeMessage ? (
        <div className="text-center">
  <h2 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse shadow-lg p-6 rounded-lg">
    {currentMessage}
  </h2>
</div>

      ) : (
        <div className="bg-white p-10 rounded-3xl  shadow-2xl w-full max-w-md">
<div className="text-center mb-8">
<h1 className="text-xl sm:text-3xl font-extrabold text-gray-800 mb-2" style={{ fontFamily: "'Aspire'" }}>
  Welcome Back, Amanda!
</h1>

</div>


          {error && (
            <div className="mb-4 bg-red-100 text-red-700 border-l-4 border-red-500 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border rounded-full text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="mb-6">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-full text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
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
