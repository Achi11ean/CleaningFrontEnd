import { useState } from "react";
import axios from "axios";

const API = "https://cleaningback.onrender.com";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email || loading) return;

  console.log("📤 Sending reset request for:", email);

  setError("");

  try {
    setLoading(true);

    const res = await axios.post(
      `${API}/auth/request-password-reset`,
      { email }
    );

    console.log("✅ Backend response:", res.data);

    setSent(true);
    setEmail("");

  } catch (err) {
    console.error("❌ Reset request failed:", err);

    if (err.response) {
      console.error("Response data:", err.response.data);
      console.error("Status:", err.response.status);
    }

    setError("Unable to send reset email. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900 to-black" />
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-blue-500/20 blur-[200px] rounded-full" />
        <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] bg-cyan-500/20 blur-[200px] rounded-full" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">

        <h1 className="text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-yellow-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Forgot Password
        </h1>

        {!sent ? (
          <>
            <p className="text-center text-gray-300 mb-6">
              Enter your email and we’ll send you a secure reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

              <input
                type="email"
                placeholder="Enter your email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />

              {error && (
                <div className="text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-yellow-600 to-orange-600 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                    Sending…
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>

            </form>
          </>
        ) : (
          <div className="text-center space-y-4 animate-fade-in">
            <div className="text-6xl">📬</div>

            <h2 className="text-2xl font-bold text-green-400">
              Email Sent!
            </h2>

            <p className="text-gray-300">
              If an account exists with that email, a password reset link has been sent.
            </p>

            <p className="text-sm text-gray-500">
              Check your spam folder if you don’t see it within a minute.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
