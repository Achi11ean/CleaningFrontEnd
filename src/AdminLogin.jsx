import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "./AdminContext";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdmin();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 🔐 Call AdminContext login()
      await login(form.username, form.password);

      // ✅ On success → go to dashboard
      navigate("/admin-dashboard");

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };
const [showPassword, setShowPassword] = useState(false);

return (
  <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-900 to-black flex flex-col">

    {/* 🔝 TOP BANNER */}
{/* 🔝 TOP BANNER */}
<div
  className="relative w-full mt-20 border-b-2 lg:h-96 md:h-80 h-64 flex items-end"
  style={{
    backgroundImage: "url('/cleaning2.webp')",
    backgroundSize: "contain",        // no cropping
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",    // 👈 THIS centers it
    backgroundColor: "#000",         // fills empty space
  }}
>
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-700/80 via-black/40 to-transparent" />

  {/* Bottom Content */}
  <div className="relative z-10 w-full px-6 pb-6 text-white text-center">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-4xl  font-extrabold tracking-wide drop-shadow-lg">
        Welcome Back
      </h1>
    </div>
  </div>
</div>



    {/* 🧾 LOGIN SECTION */}
   <div className="flex-1 flex items-start  justify-center px-4 py-8">
  <div className="w-full max-w-md border-yellow-400 border-2 bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-8 ">

    {/* Header */}
    <div className="text-center mb-2 border-b border-blue-700">

      <p className="text-blue-800 mt-2 text-2xl tracking-wide">
        Authorized admin <br/> access only
      </p>
    </div>

    {/* Form */}
    <form onSubmit={submit} className="space-y-6">

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
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-sm"
          placeholder="adminusername"
        />
      </div>

      {/* Password with Toggle */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Password
        </label>

        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-sm"
            placeholder="••••••••"
          />

          {/* Show / Hide Button */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            {showPassword ? "Hide" : "View"}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
        }`}
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>

    {/* Error */}
    {error && (
      <div className="mt-6 text-center text-red-600 font-semibold">
        {error}
      </div>
    )}

    {/* Footer */}
    <div className="mt-8 text-center text-xs text-gray-400 tracking-wide">
      © {new Date().getFullYear()} A Breath of Fresh Air — Admin System
    </div>
  </div>
</div>

  </div>
);

}
