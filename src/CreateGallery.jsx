import { useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const CLOUD_NAME = "dcw0wqlse"; // 🔁 replace if needed
const UPLOAD_PRESET = "karaoke"; // 🔁 your unsigned preset

export default function CreateGallery({ onCreated }) {
  const { axios } = useAuthorizedAxios();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* ===========================
     CLOUDINARY UPLOAD
     =========================== */
  const uploadImage = async (file) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  /* ===========================
     SAVE GALLERY ITEM
     =========================== */
  const saveGalleryItem = async () => {
    if (!title || !imageUrl) {
      setError("Title and image are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await axios.post("/gallery", {
        title,
        description,
        image_url: imageUrl,
      });

      setTitle("");
      setDescription("");
      setImageUrl("");

      onCreated?.(res.data.gallery_item);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create gallery item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border rounded-2xl p-6 shadow space-y-4">
      <h2 className="text-xl font-bold">🖼️ Add Gallery Image</h2>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-2 rounded">
          {error}
        </div>
      )}

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Image title"
        className="w-full border rounded-lg p-2"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional description"
        rows={3}
        className="w-full border rounded-lg p-2"
      />

      {/* IMAGE UPLOAD */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Upload Image
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => uploadImage(e.target.files[0])}
          className="text-sm"
        />

        {uploading && (
          <p className="text-xs text-gray-500 mt-1">
            Uploading image…
          </p>
        )}

        {imageUrl && (
          <img
            src={imageUrl}
            alt="Preview"
            className="mt-3 rounded-xl border max-h-60 object-cover"
          />
        )}
      </div>

      <button
        onClick={saveGalleryItem}
        disabled={saving || uploading}
        className="w-full py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Gallery Image"}
      </button>
    </div>
  );
}
