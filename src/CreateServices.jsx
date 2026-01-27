import { useState } from "react";
import { useAdmin } from "./AdminContext";

const CLOUD_NAME = "dcw0wqlse";
const UPLOAD_PRESET = "karaoke";

export default function CreateServices() {
  const { authAxios } = useAdmin();

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  const [imageMode, setImageMode] = useState("upload"); 
  // "upload" | "url"

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

    const json = await res.json();
    return json.secure_url;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const url = await uploadToCloudinary(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch {
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!form.title) {
      setError("Title is required");
      return;
    }

    try {
      setLoading(true);

      await authAxios.post("/admin/services", form);

      setMessage("Service created successfully!");
      setForm({
        title: "",
        description: "",
        image_url: "",
        is_active: true,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold">➕ Create Service</h2>

      {message && <p className="text-green-600 font-semibold">{message}</p>}
      {error && <p className="text-red-600 font-semibold">{error}</p>}

      <form onSubmit={submit} className="space-y-4">

        {/* TITLE */}
        <div>
          <label className="block font-semibold mb-1">Title *</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        {/* IMAGE MODE TOGGLE */}
        <div>
          <label className="block font-semibold mb-2">Image Source</label>

          <div className="flex gap-4 mb-3">
            <button
              type="button"
              onClick={() => setImageMode("upload")}
              className={`px-3 py-1 rounded border text-sm font-semibold ${
                imageMode === "upload"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              📤 Upload
            </button>

            <button
              type="button"
              onClick={() => setImageMode("url")}
              className={`px-3 py-1 rounded border text-sm font-semibold ${
                imageMode === "url"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              🔗 Paste URL
            </button>
          </div>

          {/* UPLOAD MODE */}
          {imageMode === "upload" && (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block"
            />
          )}

          {/* URL MODE */}
          {imageMode === "url" && (
            <input
              type="url"
              name="image_url"
              placeholder="https://example.com/image.jpg"
              value={form.image_url}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          )}

          {/* PREVIEW */}
          {form.image_url && (
            <img
              src={form.image_url}
              alt="preview"
              className="mt-3 w-40 h-40 object-cover rounded border"
            />
          )}
        </div>

        {/* ACTIVE */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <span className="font-medium">Active</span>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Service"}
        </button>
      </form>
    </div>
  );
}
