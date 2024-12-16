import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FaInstagram, FaFacebook } from "react-icons/fa"; // Import social media icons

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth(); // Access auth context
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu toggle
  const toggleMenu = () => setIsMenuOpen((prev) => !prev); // Toggle function
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}        {/* Mobile Menu Button */}
        <div className="md:hidden">
        <button
  onClick={toggleMenu} // Add the toggle function
  className="text-gray-700 hover:text-gray-500 focus:outline-none"
  aria-label="Open Menu"
>
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16M4 18h16"
    ></path>
  </svg>
</button>

        </div>
        
        
        <div className="text-center my-">
        <Link
  to="/signin"
  className="
    text-4xl font-extrabold bg-clip-text 
    bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 
    drop-shadow-lg hover:drop-shadow-2xl 
    transition duration-500 ease-in-out transform hover:scale-105
  "
  style={{ fontFamily: "'Playfair Display', serif" }}
>
  <span className="block sm:hidden bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">A.K. Photos</span> {/* Small screens */}
  <span className="hidden sm:block bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">
      Arif K. Photography
    </span>
    </Link>

</div>


        {/* Navigation Links */}
        <div className="hidden md:flex space-x-11 items-center">
          <Link
            to="/"
            className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
            >
            Home
          </Link>
          <Link
            to="/packages"
            className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
            >
            Packages
          </Link>
          <Link
            to="/contact"
            className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
          >
            Contact Me
          </Link>
          <Link
            to="/gallery"
            className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
          >
            Gallery
          </Link>
          <Link
            to="/reviews"
            className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
          >
            Reviews
          </Link>
          {isAuthenticated && (
            <Link
              to="/contact-center"
              className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300"
              >
              Contact Center
            </Link>
          )}
          {/* Sign Out Button */}
          {isAuthenticated && (
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition duration-300"
            >
              Sign Out
            </button>
          )}
        </div>
        <div className="flex justify-center space-x-6 mt-4">
            <a
              href="https://www.instagram.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-600 text-3xl"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.facebook.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-3xl"
            >
              <FaFacebook />
            </a>
            
          </div>

      </div>
      {isMenuOpen && (
  <div className="md:hidden bg-gray-50 border-t border-gray-200">
    <div className="flex flex-col space-y-4 px-6 py-4">
      <Link
        to="/"
        className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
        onClick={() => setIsMenuOpen(false)} // Close menu on click
      >
        Home
      </Link>
      <Link
        to="/packages"
        className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
        onClick={() => setIsMenuOpen(false)}
      >
        Packages
      </Link>
      <Link
        to="/contact"
        className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
        onClick={() => setIsMenuOpen(false)}
      >
        Contact Me
      </Link>
      <Link
        to="/gallery"
        className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
        onClick={() => setIsMenuOpen(false)}
      >
        Gallery
      </Link>
      <Link
        to="/reviews"
        className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
        onClick={() => setIsMenuOpen(false)}
      >
        Reviews
      </Link>
      {isAuthenticated && (
        <Link
          to="/contact-center"
          className="text-gray-700 hover:text-blue-500 text-xl font-bold transition duration-300"
          onClick={() => setIsMenuOpen(false)}
        >
          Contact Center
        </Link>
      )}
      {isAuthenticated && (
        <button
          onClick={() => {
            logout();
            setIsMenuOpen(false);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition duration-300"
        >
          Sign Out
        </button>
      )}
    </div>
  </div>
)}

    </nav>
  );
};

export default Navbar;
