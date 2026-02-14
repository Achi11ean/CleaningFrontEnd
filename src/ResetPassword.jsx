import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "https://cleaningback.onrender.com";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API}/auth/reset-password`, {
        token,
        password,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 3000);

    } catch (err) {
      alert(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">

      {/* Glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900 to-black" />
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-500/20 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-500/20 blur-[200px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

        <h1 className="text-4xl font-extrabold text-center mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Reset Password
        </h1>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">

            <input
              type="password"
              placeholder="New password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              placeholder="Confirm password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 transition"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-bold text-green-400">
              Password Updated!
            </h2>
            <p className="text-gray-300">
              Redirecting to login...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
