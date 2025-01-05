import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { FaInstagram, FaFacebook } from "react-icons/fa"; // Import social media icons
import './assets/Aspire.ttf';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth(); // Access auth context
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu toggle
  const toggleMenu = () => setIsMenuOpen((prev) => !prev); // Toggle function
  
  return (
    <nav className="bg-white  shadow-md sticky top-0 z-50">
      
      <div className="container  flex justify-between items-center px-full py-1">
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
        
        
        <div className="flex items-center justify-start flex-1">
          
<Link
  to="/signin"
  className="
    text-6xl font-extrabold bg-clip-text 
    bg-gradient-to-r from-blue-500 via-white to-blue-500 
    drop-shadow-lg hover:drop-shadow-2xl 
    transition duration-500 ease-in-out transform hover:scale-105
    whitespace-nowrap mr-5
    md:text-xl sm:text-xs xs:text-sm
  "
  style={{ fontFamily: "'Aspire', serif" }}
>
  <span
    className="text-3xl bg-gradient-to-r from-black via-blue-400 to-blue-700 bg-clip-text text-transparent drop-shadow-md md:text-5xl sm:text-xl xs:text-xl"
  >
    . ݁₊ ⊹ . ݁˖ . ݁ A Breath of Fresh Air 𓈒𓏸
  </span>
</Link>

  
</div>



{/* Navigation Links */}
<div className="hidden md:flex space-x-14 items-center flex-1 justify-center font-serif">
  <Link
    to="/"
    className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
  >
    Home
  </Link>
  <Link
    to="/packages"
    className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
  >
    Packages
  </Link>
  <Link
    to="/contact"
    className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
  >
    Inquiry
  </Link>
  <Link
    to="/gallery"
    className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
  >
    Gallery
  </Link>
  <Link
    to="/reviews"
    className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
  >
    Reviews
  </Link>
  {isAuthenticated && (
    <Link
      to="/contact-center"
      className="text-gray-700 hover:text-blue-500 text-2xl font-bold transition duration-300 uppercase tracking-wider"
    >
      Admin
    </Link>
  )}
  {/* Sign Out Button */}
  {isAuthenticated && (
    <button
  onClick={logout}
  className="bg-red-500 text-white px-1  rounded-lg hover:bg-red-400 transition duration-300 font-serif"
  style={{
    fontFamily: "'Times New Roman', Times, serif",
    whiteSpace: "nowrap", // Prevents text wrapping
  }}
>
  Sign Out
</button>

  )}
</div>

<div className="flex justify-end items-end lg:ml-40 space-x-6">
  <a
    href="https://www.instagram.com/harmonicessence"
    target="_blank"
    rel="noopener noreferrer"
    className="text-pink-500 hover:text-pink-600 text-3xl"
  >
    <FaInstagram />
  </a>
  <a
    href="https://www.facebook.com/harmonicessence"
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