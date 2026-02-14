import { useState } from "react";
import axios from "axios";

const API = "https://singspacebackend.onrender.com";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);

      await axios.post(`${API}/auth/request-password-reset`, {
        email,
      });

      // Always show success for security
      setSent(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900 to-black" />
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-purple-500/20 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-pink-500/20 blur-[200px] rounded-full" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

        <h1 className="text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Forgot Password
        </h1>

        {!sent ? (
          <>
            <p className="text-center text-gray-300 mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl">📬</div>
            <h2 className="text-2xl font-bold text-green-400">
              Email Sent!
            </h2>
            <p className="text-gray-300">
              If an account exists with that email, a reset link has been sent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
