import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Create Context
const AuthContext = createContext();

// Custom Hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      console.log("Token being sent to /api/user:", token);

      try {
        const response = await fetch("http://127.0.0.1:5000/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("Response Status:", response.status);
        const data = await response.json();
        console.log("Response Body:", data);

        if (response.ok) {
          setUser(data);
        } else {
          console.error("Failed to fetch user details:", data);
          logout();
        }
      } catch (err) {
        console.error("Fetch error:", err);
        logout();
      } finally {
        setLoading(false); // Ensure loading is toggled off
      }
    };

    if (token) {
      fetchUserDetails();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Login function
  const login = (authToken) => {
    setToken(authToken);
    localStorage.setItem("token", authToken);
  };

  // Logout function
  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user, loading }}
    >
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="text-2xl font-bold text-gray-600">Loading...</div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
