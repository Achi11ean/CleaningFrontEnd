import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStaff } from "./StaffContext";

export default function StaffLogin() {
  const { login } = useStaff();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const staff = await login(form.username, form.password);

      // ✅ Optional: redirect based on role
      if (staff.role === "manager") {
        navigate("/staff-dashboard");
      } else {
        navigate("/staff-dashboard"); // or a limited dashboard if you want later
      }

    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="min-h-screen bg-gradient-to-br from-sky-600 via-blue-900 to-black flex flex-col">

    {/* 🔝 TOP BANNER */}
    <div className="bg-gradient-to-t from-slate-700 to-black ">
    <div
      className="relative w-full mt-14 lg:mt-20  border-b lg:h-96 md:h-80 h-64 flex items-end"
      style={{
        backgroundImage: "url('/logo2.jpg')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Banner Text */}
      <div className="relative z-10 w-full  text-center text-white">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-wide drop-shadow-xl">
          Welcome Back, Team 👋
        </h1>
   
      </div></div>
    </div>

{/* 🧾 LOGIN SECTION */}
<div className="flex mt-8 justify-center px-4 ">
  <div className="w-full max-w-md border-yellow-400 border-2 bg-white rounded-2xl shadow-2xl p-8 ">


        {/* Header */}
        <div className="text-center border-b border-blue-700  mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Staff Login
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Only approved staff may log in
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-sm"
              placeholder="staffusername"
            />
          </div>

          {/* Password with Toggle */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Password
            </label>

            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-sm"
              placeholder="••••••••"
            />

            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-9 text-sm text-sky-600 font-semibold hover:text-sky-800"
            >
              {showPassword ? "Hide" : "View"}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition shadow-lg ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 text-center text-red-600 font-semibold">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} A Breath of Fresh Air — Staff System
        </div>
      </div>
    </div>
  </div>
);

}
