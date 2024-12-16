import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import Navbar from "./Navbar";
import SignIn from "./Singin";
import Forgot from "./Forgot";
import Reset from "./Reset";
import Packages from "./Packages";
import Contact from "./Contact";
import Gallery from "./Gallery"; // Import the Gallery component
import Reviews from "./Reviews";
import ContactCenter from "./ContactCenter"; // Import the new component

const App = () => (
  
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="/reset-password" element={<Reset />} />
      <Route path="/packages" element={<Packages />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/gallery" element={<Gallery isAdmin={true} />} /> {/* New route */}
      <Route path="/reviews" element={<Reviews isAdmin={true} />} /> {/* New route */}
      <Route path="/contact-center" element={<ContactCenter />} /> {/* New route */}

      {/* Other routes */}
    </Routes>
  </>
);

export default App;
