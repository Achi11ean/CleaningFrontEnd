import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

import { AdminProvider } from "./AdminContext";
import { StaffProvider } from "./StaffContext"; // 👈 ADD THIS

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AdminProvider>
      <StaffProvider>   {/* 👈 WRAP STAFF CONTEXT */}
        <App />
      </StaffProvider>
    </AdminProvider>
  </BrowserRouter>
);
