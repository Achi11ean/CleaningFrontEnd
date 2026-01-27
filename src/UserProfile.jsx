import { useEffect, useState } from "react";
import axios from "axios";
import { useAdmin } from "./AdminContext";
import { useStaff } from "./StaffContext";

const API_BASE_URL = "https://cleaningback.onrender.com";

const CLOUD_NAME = "dcw0wqlse";
const UPLOAD_PRESET = "karaoke";

export default function UserProfile() {
  const adminCtx = useAdmin?.();
  const staffCtx = useStaff?.();

  // Detect role + token
  const isAdmin = !!adminCtx?.admin;
  const token = adminCtx?.token || staffCtx?.token;
  const role = isAdmin ? "admin" : "staff";

  // Build axios instance with baseURL + token
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
  });

  authAxios.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    photo_url: "",
  });

  // 🔄 Load profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authAxios.get("/me/profile");

        const profile = res.data.profile;

        if (profile) {
          setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            bio: profile.bio || "",
            photo_url: profile.photo_url || "",
          });
        }
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ✏️ Form change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ☁️ Upload to Cloudinary
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

  // 📸 Handle file select
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setStatus("Uploading photo...");
      setError(null);

      const url = await uploadToCloudinary(file);

      setForm((prev) => ({
        ...prev,
        photo_url: url,
      }));

      setStatus("Photo uploaded!");
    } catch {
      setError("Failed to upload image");
    }
  };

  // 💾 Save profile
  const saveProfile = async () => {
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const res = await authAxios.patch("/me/profile", form);

      setStatus("Profile saved successfully!");

      // Update localStorage copy so UI stays in sync
      if (isAdmin) {
        const updated = { ...adminCtx.admin, profile: res.data.profile };
        localStorage.setItem("admin", JSON.stringify(updated));
      } else {
        const updated = { ...staffCtx.staff, profile: res.data.profile };
        localStorage.setItem("staff", JSON.stringify(updated));
      }
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border p-8">

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        My Profile
      </h2>

      {status && (
        <div className="mb-4 text-green-600 font-semibold">
          {status}
        </div>
      )}

      {error && (
        <div className="mb-4 text-red-600 font-semibold">
          {error}
        </div>
      )}

      {/* Photo */}
      <div className="flex items-center space-x-6 mb-6">
        <div className="w-28 h-28 rounded-full overflow-hidden border bg-gray-100 flex items-center justify-center">
          {form.photo_url ? (
            <img
              src={form.photo_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm">No Photo</span>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">
            Profile Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="text-sm"
          />
        </div>
      </div>

      {/* Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-1">First Name</label>
          <input
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Last Name</label>
          <input
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-1">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={5}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          disabled={saving}
          onClick={saveProfile}
          className={`px-6 py-2 rounded font-semibold text-white transition ${
            saving
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
