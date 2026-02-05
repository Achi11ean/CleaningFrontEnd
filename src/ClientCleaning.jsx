import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import ClientViewConsults from "./ClientViewConsults";
import ClientRequestForm from "./ClientRequestForm";
import ClientShifts from "./ClientShifts";
import CreateReview from "./CreateReview";
import ClientCompletedChecklists from "./ClientCompletedChecklists";

export default function ClientCleaning() {
  const [lastName, setLastName] = useState("");
  const [last4, setLast4] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
const [showConsults, setShowConsults] = useState(false);
const [showReviewModal, setShowReviewModal] = useState(false);
const [assignments, setAssignments] = useState([]);


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

// Fetch assignments
const assignmentRes = await axios.get(
  `https://cleaningback.onrender.com/public/clients/${res.data.client.id}/assignments`
);
setAssignments(assignmentRes.data.assignments);


      
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
<div className="min-h-screen bg-gradient-to-br from-cyan-100 via-white to-cyan-200 flex items-start justify-center px-4 py-16">
  <div className="w-full max-w-5xl mt-20 space-y-12">
    {/* HEADER */}
    <div className="text-center rounded-3xl bg-white/80 shadow-lg border border-white/60 backdrop-blur-sm px-6 py-10">
      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 bg-clip-text text-transparent drop-shadow-md">
        🧼 Your Cleaning Portal
      </h1>

      <p className="mt-1 text-sm text-gray-500 italic">
        Designed for transparency, care, and your peace of mind.
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

        {error && (
          <p className="text-red-600 font-semibold text-center">{error}</p>
        )}
      </form>

      {/* RESULTS */}
      {result && (
        <div className="space-y-12">
          <h2 className="text-2xl font-bold text-emerald-800">
            Hello, {result.client.first_name}! 👋
          </h2>
{assignments.length > 0 && (
 <section>
  <h3 className="text-xl font-semibold mb-4">🧹 Assigned Cleaners</h3>

  {assignments.filter((a) => a.type === "staff").length > 0 ? (
    <ul className="space-y-4">
      {assignments
        .filter((a) => a.type === "staff")
        .map((a) => (
          <li
            key={a.assignment_id}
            className="bg-white border border-gray-200 rounded-xl shadow p-4 text-sm flex items-center gap-4"
          >
            {/* {a.profile?.photo_url && (
              <img
                src={a.profile.photo_url}
                alt={`${a.username}'s profile`}
                className="w-12 h-12 rounded-full object-cover border border-gray-300"
              />
            )} */}

            <div className="space-y-1">
             <div>
  <strong>Name:</strong>{" "}
  <span className="font-medium">
    {a.profile?.first_name && a.profile?.last_name
      ? `${a.profile.first_name} ${a.profile.last_name.charAt(0)}.`
      : a.username}
  </span>
</div>

              <div>
                <strong>Role:</strong> {a.role}
              </div>
           
            </div>
          </li>
        ))}
    </ul>
  ) : (
    <p className="text-gray-600 italic">No cleaners have been assigned yet.</p>
  )}
</section>

)}

          {/* Consultation */}
          <section>
            <h3 className="text-xl font-semibold mb-4">🧠 Consultation History</h3>
            <button
              onClick={() => setShowConsults((prev) => !prev)}
              className="mb-4 px-4 py-2 rounded-xl font-semibold border bg-white text-emerald-700 hover:bg-emerald-50 transition"
            >
              {showConsults
                ? "Hide Consultation Reports"
                : "View Consultation Reports"}
            </button>
            {showConsults && (
              <ClientViewConsults consultations={result.consultations} />
            )}
          </section>

          {/* Schedule */}
          {result.client.schedules.length > 0 && (
            <section>
              <h3 className="text-xl font-semibold mb-2">📅 Cleaning Schedule</h3>
              <div className="space-y-4">
                {result.client.schedules.map((sched) => (
                  <div
                    key={sched.id}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-sm"
                  >
                    <div>
                      <strong>Type:</strong>{" "}
                      {sched.schedule_type.replace("_", " ")}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`font-semibold ${
                          sched.status === "active"
                            ? "text-green-600"
                            : sched.status === "paused"
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {sched.status}
                      </span>
                    </div>
                    <div>
                      <strong>Start Date:</strong>{" "}
                      {new Date(sched.start_date).toLocaleDateString()}
                    </div>
                    {sched.day_of_week !== null && (
                      <div>
                        <strong>Day of Week:</strong>{" "}
                        {
                          [
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                            "Saturday",
                            "Sunday",
                          ][sched.day_of_week]
                        }
                      </div>
                    )}
                    <div>
                      <strong>Time:</strong>{" "}
                      {format(
                        new Date(`1970-01-01T${sched.start_time}`),
                        "h:mm a"
                      )}{" "}
                      –{" "}
                      {format(
                        new Date(`1970-01-01T${sched.end_time}`),
                        "h:mm a"
                      )}
                    </div>
                    {sched.description && (
                      <div className="mt-1 italic text-gray-600">
                        {sched.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Shifts */}
        {/* Shifts */}
<section>
  <h3 className="text-xl font-semibold mb-4">🧾 Recent Shifts</h3>
  <ClientShifts shifts={result.shifts} />
</section>

{/* Completed Checklists */}
<section>
  <h3 className="text-xl font-semibold mt-12 mb-4">✅ Completed Checklists</h3>
  <ClientCompletedChecklists checklists={result.completed_checklists} />
</section>


          {/* Requests */}
          <ClientRequestForm clientId={result.client.id} />

          {/* Review Box */}
          <div className="text-center bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
              💬 Want to share your experience?
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              We’d love to hear from you! Leave us a review and help others feel
              confident choosing our cleaning services. Your feedback might even
              be featured on our site! 🌟
            </p>

            <button
              onClick={() => setShowReviewModal(true)}
              className="mt-2 inline-block w-full sm:w-auto px-6 py-3 font-semibold rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md hover:brightness-110 transition-all"
            >
              ⭐ Leave a Review
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
            >
              ×
            </button>
            <CreateReview />
          </div>
        </div>
      )}
    </div>
  </div>
);

}
