import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Navbar from "./Navbar";
import Packages from "./Packages";
import Contact from "./Contact";
import Gallery from "./Gallery"; // Import the Gallery component
import Reviews from "./Reviews";
import AdminSignup from "./AdminSignup";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import StaffSignup from "./StaffSignup";
import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";
import ClientInquiry from "./ClientInquiry";
import ClientCleaning from "./ClientCleaning";
const App = () => (
  
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/packages" element={<Packages />} />
      <Route path="/contact" element={<ClientInquiry />} />
      <Route path="/gallery" element={<Gallery isAdmin={true} />} /> 
      <Route path="/reviews" element={<Reviews isAdmin={true} />} /> 
      <Route path="/admin-signup" element={<AdminSignup />}/>
            <Route path="/admin-login" element={<AdminLogin />}/>
            <Route path="/admin-dashboard" element={<AdminDashboard/>}/>
            <Route path="/staff-signup" element={<StaffSignup/>}/>
            <Route path="/staff-login" element={<StaffLogin/>}/>
            <Route path="/staff-dashboard" element={<StaffDashboard/>}/>
            <Route path="/cleaning" element={<ClientCleaning/>}/>


    </Routes>
  </>
);

export default App;
