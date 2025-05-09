import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Menu, X } from "lucide-react";
import { FaFacebook } from "react-icons/fa";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="fixed  top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/signin" className="inline-block">
          <img
            src="/logo2.jpg"
            alt="A Breath of Fresh Air Logo"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg"
          />
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex space-x-8 text-gray-700 font-semibold uppercase tracking-wider">
          <li><Link to="/" className="hover:text-blue-600 transition">Home</Link></li>
          <li><Link to="/packages" className="hover:text-blue-600 transition">Packages</Link></li>
          <li><Link to="/contact" className="hover:text-blue-600 transition">Book Now</Link></li>
          <li><Link to="/gallery" className="hover:text-blue-600 transition">Gallery</Link></li>
          <li><Link to="/reviews" className="hover:text-blue-600 transition">Reviews</Link></li>
          {isAuthenticated && (
            <>
              <li><Link to="/contact-center" className="hover:text-blue-600 transition">Admin</Link></li>
              <li>
                <button
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600 transition"
                >
                  Sign Out
                </button>
              </li>
            </>
          )}
          <li>
            <a
              href="https://www.facebook.com/people/A-Breath-of-Fresh-Air-Cleaning-Service/61558246240604"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-xl"
            >
              <FaFacebook />
            </a>
          </li>
        </ul>

        {/* Mobile Menu Toggle */}
        <button onClick={toggleMenu} className="md:hidden text-gray-800">
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden mx-4 mt-2 mb-4 rounded-2xl border border-gray-200 bg-black/20 backdrop-blur-xl shadow-2xl p-4 text-center text-gray-800 space-y-4">
          <ul className="flex flex-col font-serif space-y-2 text-lg font-bold">
            <li><Link to="/" onClick={toggleMenu}>Home</Link></li>
            <li><Link to="/packages" onClick={toggleMenu}>Packages</Link></li>
            <li><Link to="/contact" onClick={toggleMenu}>Book Now</Link></li>
            <li><Link to="/gallery" onClick={toggleMenu}>Gallery</Link></li>
            <li><Link to="/reviews" onClick={toggleMenu}>Reviews</Link></li>
            {isAuthenticated && (
              <>
                <li><Link to="/contact-center" onClick={toggleMenu}>Admin</Link></li>
                <li>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="text-red-500"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            )}
            <div className="items-center justify-center flex">
            <li>
              <a
                href="https://www.facebook.com/people/A-Breath-of-Fresh-Air-Cleaning-Service/61558246240604"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-2xl"
              >
                <FaFacebook />
              </a>
            </li>
            </div>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
