import { createContext, useContext, useState } from "react";
import axios from "axios";

const StaffContext = createContext();
const API_BASE_URL = "https://cleaningback.onrender.com";

export function StaffProvider({ children }) {
  const [staff, setStaff] = useState(() => {
    const stored = localStorage.getItem("staff");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("staff_token");
  });

  const login = async (username, password) => {
    const res = await axios.post(`${API_BASE_URL}/staff/login`, {
      username,
      password,
    });

    const { token, staff } = res.data;

    localStorage.setItem("staff_token", token);
    localStorage.setItem("staff", JSON.stringify(staff));

    setToken(token);
    setStaff(staff);

    return staff;
  };

  const logout = () => {
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff");
    setToken(null);
    setStaff(null);
  };

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
  });

  // 🔑 Attach staff token automatically
  authAxios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return (
    <StaffContext.Provider
      value={{
        staff,
        token,
        login,
        logout,
        authAxios,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(StaffContext);
  if (!ctx) {
    throw new Error("useStaff must be used inside a StaffProvider");
  }
  return ctx;
}
