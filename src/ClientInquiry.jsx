import { useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://cleaningback.onrender.com";

export default function ClientInquiry() {
const [form, setForm] = useState({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  message: "",

  // 🆕 Additional info
  preferred_contact: "",
  property_type: "",
  square_footage: "",
  service_type: "",
  heard_about_us: "",
});

const inputBase =
  "w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-gray-800 " +
  "shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
  "focus:border-blue-500 transition";

  const textareaBase = inputBase + " resize-none";

const formatPhone = (value) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "").slice(0, 10); // max 10 digits

  const len = digits.length;

  if (len === 0) return "";
  if (len < 4) return `(${digits}`;
  if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
const handlePhoneChange = (e) => {
  const formatted = formatPhone(e.target.value);
  setForm({ ...form, phone: formatted });
};


  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const submitInquiry = async (e) => {
  e.preventDefault();
  setLoading(true);
  setStatus(null);
  setError(null);

  // 🧠 Build appended notes block
// 🧠 Build appended notes block
const additionalInfoLines = [];

if (form.preferred_contact)
  additionalInfoLines.push(`Preferred Contact Method: ${form.preferred_contact}`);

if (form.property_type)
  additionalInfoLines.push(`Property Type: ${form.property_type}`);

if (form.square_footage && isNaN(Number(form.square_footage))) {
  setError("Square footage must be a number.");
  setLoading(false);
  return;
}

if (form.service_type)
  additionalInfoLines.push(`Service Type: ${form.service_type}`);

if (form.heard_about_us)
  additionalInfoLines.push(`Heard About Us From: ${form.heard_about_us}`);

const appendedNotes =
  additionalInfoLines.length > 0
    ? `\n\n--- Additional Information ---\n${additionalInfoLines.join("\n")}`
    : "";

const finalMessage = `${form.message}${appendedNotes}`;


 try {
  const res = await axios.post(`${API_BASE_URL}/clients/inquiry`, {
    first_name: form.first_name,
    last_name: form.last_name,
    email: form.email,
    phone: form.phone,
    address: form.address || null,
    message: finalMessage,
  });

  // ⭐ Use backend dynamic message
  setStatus(res.data.message);

  setForm({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
    preferred_contact: "",
    property_type: "",
    square_footage: "",
    service_type: "",
    heard_about_us: "",
  });

} catch (err) {
  setError(
    err.response?.data?.error ||
      "Failed to submit inquiry. Please try again."
  );
} finally {
  setLoading(false);
}
};


 return (
  <div className="min-h-screen bg-gradient-to-b from-black via-blue-950 to-black">

    {/* 🖼️ HERO BANNER */}
    <div
      className="relative h-[320px] flex items-center justify-center"
      style={{
        backgroundImage: "url('/banner3.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mt-16 tracking-wide drop-shadow-lg">
          Request a Cleaning Quote
        </h1>
        <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">
          Professional, reliable cleaning — tailored to your needs.
        </p>
      </div>
    </div>

    {/* 🌈 SEPARATOR */}
    <div className="h-2 bg-gradient-to-r from-blue-500 via-blue-700 to-black" />

    {/* 🧾 FORM SECTION */}
    <div className="max-w-4xl mx-auto px-4 py-2">
      <div
        className="
          bg-white/95 backdrop-blur-xl
          rounded-sm
          border border-blue-500/20
          shadow-[0_20px_60px_rgba(0,0,0,0.25)]
          p-6 md:p-14
        "
      >
        <h2 className="text-3xl border-b  border-blue-700 font-extrabold text-gray-900 mb-3 tracking-tight text-center">
          Contact Form
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto text-center">
          Fill out the form below and our team will reach out shortly.
        </p>

        <form onSubmit={submitInquiry} className="space-y-12">

          {/* Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                className={inputBase}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handlePhoneChange}
                required
                maxLength={14}
                placeholder="(123) 456-7890"
                className={inputBase}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address (Optional)
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputBase}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method
              </label>
              <select
                name="preferred_contact"
                value={form.preferred_contact}
                onChange={handleChange}
                className={inputBase}
              >
                <option value="">Select one...</option>
                <option value="Call">Call</option>
                <option value="Text">Text</option>
                <option value="Email">Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type
              </label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
                className={inputBase}
              >
                <option value="">Select one...</option>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Condo">Condo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approx. Square Footage
              </label>
              <input
                type="number"
                name="square_footage"
                value={form.square_footage}
                onChange={handleChange}
                placeholder="e.g. 1800"
                min="0"
                step="1"
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Type
              </label>
              <select
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                className={inputBase}
              >
                <option value="">Select one...</option>
                <option value="Commercial">Commercial</option>
                <option value="Deep Clean">Deep Clean</option>
                <option value="Move In / Move Out">Move In / Move Out</option>
                <option value="Post Construction">Post Construction</option>
                <option value="Recurring Maintenance">
                  Recurring Maintenance
                </option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Referral */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you hear about us?
            </label>
            <input
              name="heard_about_us"
              value={form.heard_about_us}
              onChange={handleChange}
              placeholder="Google, Facebook, Friend, etc."
              className={inputBase}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How can we help you? *
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              required
              placeholder="Tell us about your cleaning needs..."
              className={textareaBase}
            />
          </div>

          {status && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-700 font-semibold">
              {status}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`
                px-10 py-4 rounded-full font-bold tracking-wide text-white
                bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900
                shadow-xl shadow-blue-500/30
                hover:scale-105 transition-all duration-300
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {loading ? "Sending…" : "Submit"}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
);

}
