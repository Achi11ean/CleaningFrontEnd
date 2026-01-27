// AdminContext.jsx
import { createContext, useContext, useState } from "react";
import axios from "axios";

const AdminContext = createContext();
const API_BASE_URL = "https://cleaningback.onrender.com";

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("admin");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("admin_token");
  });

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE_URL}/admin/login`, {
      username,
      password,
    });

    const { token, admin } = res.data;

    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin", JSON.stringify(admin));

    setToken(token);
    setAdmin(admin);

    return admin;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin");
    setToken(null);
    setAdmin(null);
  };

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
  });

  // 🔑 Automatically attach token
  authAxios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <AdminContext.Provider
      value={{
        admin,
        token,
        login,
        logout,
        authAxios, // 👈 use this for protected routes
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
