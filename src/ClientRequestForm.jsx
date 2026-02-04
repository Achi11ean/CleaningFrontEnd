import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import ClientViewConsults from "./ClientViewConsults";

function ClientRequestForm({ clientId }) {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post("https://cleaningback.onrender.com/client-requests", {
        client_id: clientId,
        category,
        description,
      });

      setSuccess("Request submitted successfully.");
      setCategory("");
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12">
      <h3 className="text-xl font-semibold mb-2">📥 Send a Request or Feedback</h3>
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-xl shadow-md p-5 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            required
          >
            <option value="">Select category</option>
            <option value="add request">Add Request</option>
            
            <option value="remove request">Remove Request</option>
                        <option value="add request">Change Schedule</option>

            <option value="feedback">Feedback</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-2 rounded-xl font-bold hover:brightness-110 transition"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>

        {success && <p className="text-green-600 font-semibold text-center">{success}</p>}
        {error && <p className="text-red-600 font-semibold text-center">{error}</p>}
      </form>
    </div>
  );
}

export default ClientRequestForm;
