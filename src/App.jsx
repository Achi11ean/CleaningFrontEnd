import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Navbar from "./Navbar";
import Packages from "./Packages";
import Contact from "./Contact";
import Gallery from "./Gallery"; // Import the Gallery component
import Reviews from "./Reviews";
const App = () => (
  
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/packages" element={<Packages />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/gallery" element={<Gallery isAdmin={true} />} /> 
      <Route path="/reviews" element={<Reviews isAdmin={true} />} /> 

    </Routes>
  </>
);

export default App;
