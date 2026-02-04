import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import ClientViewConsults from "./ClientViewConsults";

export default function ClientCleaning() {
  const [lastName, setLastName] = useState("");
  const [last4, setLast4] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [showConsults, setShowConsults] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("https://cleaningback.onrender.com/cleaning", {
        last_name: lastName,
        last4: last4,
      });
      setResult(res.data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return "—";
    return format(new Date(iso), "MMM d, yyyy • h:mm a");
  };

 return (
  <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
    {/* HEADER */}
    <div className="text-center mt-20">
      <h1 className="text-4xl font-extrabold bg-gradient-to-br from-green-600 via-emerald-500 to-green-800 bg-clip-text text-transparent drop-shadow-sm">
        🧼 Your Cleaning Portal
      </h1>
      <p className="text-gray-600 mt-2">
        View recent shift photos, notes, and consultations
      </p>
    </div>

    {/* FORM */}
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-6"
    >
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Last 4 Digits of Phone
          </label>
          <input
            type="text"
            value={last4}
            onChange={(e) =>
              setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            required
            maxLength={4}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-br from-green-600 to-emerald-800 text-white py-3 rounded-xl font-bold text-lg hover:brightness-110 transition"
        disabled={loading}
      >
        {loading ? "Loading..." : "View Cleaning Info"}
      </button>

      {error && <p className="text-red-600 font-semibold text-center">{error}</p>}
    </form>

    {/* RESULTS */}
    {result && (
      <div className="space-y-12">
        <h2 className="text-2xl font-bold text-emerald-800">
          Hello, {result.client.first_name}! 👋
        </h2>
<section>
  <h3 className="text-xl font-semibold mb-4">🧠 Consultation History</h3>

  <button
    onClick={() => setShowConsults((prev) => !prev)}
    className="mb-4 px-4 py-2 rounded-xl font-semibold border bg-white text-emerald-700 hover:bg-emerald-50 transition"
  >
    {showConsults ? "Hide Consultation Reports" : "View Consultation Reports"}
  </button>

  {showConsults && (
    <ClientViewConsults consultations={result.consultations} />
  )}
</section>

        {/* SHIFTS */}
        <section>
          <h3 className="text-xl font-semibold mb-4">🧾 Recent Shifts</h3>
          {result.shifts.length === 0 ? (
            <p className="italic text-gray-500">No shift records found.</p>
          ) : (
            <div className="grid gap-6">
              {result.shifts.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-2"
                >
                  <div>
                    <strong>Check-In:</strong> {formatDateTime(s.check_in_at)}
                  </div>
                  <div>
                    <strong>Check-Out:</strong> {formatDateTime(s.check_out_at)}
                  </div>
                  {s.message && (
                    <div>
                      <strong>Notes:</strong> {s.message}
                    </div>
                  )}
                  {s.image_urls && s.image_urls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {s.image_urls.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Shift Photo ${i + 1}`}
                          className="w-24 h-24 rounded-lg object-cover border"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONSULTATIONS */}
     {/* CONSULTATIONS */}


      </div>
    )}
  </div>
);

}
