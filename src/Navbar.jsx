import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false); // 👈 NEW
const { admin, logout: adminLogout } = useAdmin();
const { staff, logout: staffLogout } = useStaff();
const navigate = useNavigate();

const isLoggedIn = !!admin || !!staff;

const handleUniversalLogout = () => {
  if (admin) adminLogout();
  if (staff) staffLogout();

  setAdminOpen(false);
  setStaffOpen(false);
  setMenuOpen(false);

  navigate("/");
};


  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleAdmin = () => {
    setAdminOpen(!adminOpen);
    setStaffOpen(false);
  };
  const toggleStaff = () => {
    setStaffOpen(!staffOpen);
    setAdminOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white backdrop-blur-md shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="inline-block">
          <img
            src="/logo2.jpg"
            alt="A Breath of Fresh Air Logo"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg"
          />
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex space-x-8 text-gray-700 font-semibold uppercase tracking-wider items-center">

{isLoggedIn ? (
  <>
    {/* Dashboard Link */}
    <li>
      <Link
        to={admin ? "/admin-dashboard" : "/staff-dashboard"}
        className="hover:text-blue-600 transition text-sm"
      >
        Dashboard
      </Link>
    </li>

    {/* Logout */}
    <li>
      <button
        onClick={handleUniversalLogout}
        className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition font-semibold text-sm"
      >
        Logout
      </button>
    </li>
  </>
) : (

  <>
    {/* Admin Dropdown */}
    <li className="relative">
      <button
        onClick={toggleAdmin}
        className="flex items-center gap-1 hover:text-blue-600 transition text-sm"
      >
        Admin <ChevronDown size={16} />
      </button>

      {adminOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-40 py-2 text-sm z-50">
          {/* <Link
            to="/admin-signup"
            className="block px-4 py-2 hover:bg-gray-100 transition"
            onClick={() => setAdminOpen(false)}
          >
            Signup
          </Link> */}
          <Link
            to="/admin-login"
            className="block px-4 py-2 hover:bg-gray-100 transition"
            onClick={() => setAdminOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </li>

    {/* Staff Dropdown */}
    <li className="relative">
      <button
        onClick={toggleStaff}
        className="flex items-center gap-1 hover:text-blue-600 transition text-sm"
      >
        Staff <ChevronDown size={16} />
      </button>

      {staffOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-40 py-2 text-sm z-50">
          <Link
            to="/staff-signup"
            className="block px-4 py-2 hover:bg-gray-100 transition"
            onClick={() => setStaffOpen(false)}
          >
            Signup
          </Link>
          <Link
            to="/staff-login"
            className="block px-4 py-2 hover:bg-gray-100 transition"
            onClick={() => setStaffOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </li>
  </>
)}


          {/* 👨‍🔧 Staff Dropdown */}
      
 <li>
  <Link to="/contact" className="hover:text-blue-600 transition">
    Contact Us
  </Link>
</li>


          <li>
            <Link to="/gallery" className="hover:text-blue-600 transition">
              Gallery
            </Link>
          </li>

          <li>
            <Link to="/reviews" className="hover:text-blue-600 transition">
              Reviews
            </Link>
          </li>

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
          <ul className="flex flex-col font-serif space-y-3 text-lg font-bold">

            <li>
              <Link to="/" onClick={toggleMenu}>
                Home
              </Link>
            </li>

{isLoggedIn && (
  <>
    {/* Dashboard */}
    <li className="border-b pb-3">
      <Link
        to={admin ? "/admin-dashboard" : "/staff-dashboard"}
        onClick={toggleMenu}
        className="block w-full px-4 py-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold"
      >
        Dashboard
      </Link>
    </li>

    {/* Logout */}
    <li className="border-b pb-3">
      <button
        onClick={() => {
          handleUniversalLogout();
          toggleMenu();
        }}
        className="w-full px-4 py-3 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-bold"
      >
        Logout
      </button>
    </li>
  </>
)}


         
<li>
  <Link to="/contact" className="hover:text-blue-600 transition">
    Contact Us
  </Link>
</li>


            <li>
              <Link to="/gallery" onClick={toggleMenu}>
                Gallery
              </Link>
            </li>

            <li>
              <Link to="/reviews" onClick={toggleMenu}>
                Reviews
              </Link>
            </li>

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
            {!isLoggedIn && (
  <>
    {/* Mobile Admin Section */}
    <li className="border-t pt-3">
      <div className="text-sm uppercase text-gray-500 mb-2">Admin</div>
      <div className="flex flex-col space-y-2">
        {/* <Link to="/admin-signup" onClick={toggleMenu}>
          Admin Signup
        </Link> */}
        <Link to="/admin-login" onClick={toggleMenu}>
          Admin Login
        </Link>
      </div>
    </li>

    {/* Mobile Staff Section */}
    <li className="border-t pt-3">
      <div className="text-sm uppercase text-gray-500 mb-2">Staff</div>
      <div className="flex flex-col space-y-2">
        <Link to="/staff-signup" onClick={toggleMenu}>
          Staff Signup
        </Link>
        <Link to="/staff-login" onClick={toggleMenu}>
          Staff Login
        </Link>
      </div>
    </li>
  </>
)}


          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
