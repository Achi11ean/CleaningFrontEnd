import React, { useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function CreateSection({ onCreated }) {
  const { role, axios } = useAuthorizedAxios();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🚫 Not logged in
  if (!axios) {
    return (
      <div className="text-red-600">
        You must be logged in to create consultation sections.
      </div>
    );
  }

  // 🚫 Permission hint (optional UI guard)
  if (role !== "admin" && role !== "manager") {
    return (
      <div className="text-red-600">
        You do not have permission to create consultation sections.
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Section name is required");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/consultation/sections", {
        name: name.trim(),
        description: description || null,
      });

      setName("");
      setDescription("");
      setLoading(false);

      if (onCreated) {
        onCreated(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to create section"
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 border rounded-lg bg-white"
    >
      <h2 className="text-xl font-semibold">
        Consultation Section
      </h2>

      <div className="text-sm text-gray-500">
        Logged in as: <strong>{role}</strong>
      </div>

      {/* Section Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Section Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kitchen, Bathrooms, Living Areas"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What does this section cover?"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Section"}
      </button>
    </form>
  );
}
