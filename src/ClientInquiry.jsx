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
    await axios.post(`${API_BASE_URL}/clients/inquiry`, {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone,
      address: form.address || null,

      // 👇 send composed message
      message: finalMessage,
    });

    setStatus("Your inquiry has been sent successfully! We’ll contact you soon.");
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
          backgroundImage: "url('/cleaning-banner.jpg')", // 👈 replace with your banner image
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 text-center text-white px-2">
          <h1 className="text-4xl md:text-5xl font-extrabold mt-16 tracking-wide drop-shadow-lg">
            Request a Cleaning Quote
          </h1>
          <p className="mt-4 text-lg text-blue-200 max-w-2xl mx-auto">
            Professional, reliable cleaning — tailored to your needs.
          </p>
        </div>
      </div>

      {/* 🌈 SEPARATOR STRIP */}
      <div className="h-2 bg-gradient-to-r from-blue-500 via-blue-700 to-black" />

      {/* 🧾 FORM SECTION */}
      <div className="max-w-4xl mx-auto px-2 py-2">

        <div className="bg-white rounded-none border-blue-700 shadow-2xl border-6 p-3 text-center md:p-12">

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Tell Us About Your Cleaning Needs
          </h2>
          <p className="text-gray-500 mb-8">
            Fill out the form below and our team will reach out shortly.
          </p>

 
          <form onSubmit={submitInquiry} className="space-y-8">

            {/* Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  First Name *
                </label>
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Last Name *
                </label>
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

   <div>
  <label className="block text-sm font-semibold mb-1">
    Phone *
  </label>
  <input
    name="phone"
    value={form.phone}
    onChange={handlePhoneChange}   // 👈 custom handler
    required
    maxLength={14}                // 👈 prevents extra chars
    placeholder="(123) 456-7890"
    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</div>

            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                Address (Optional)
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>


            {/* Additional Info */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

  {/* Preferred Contact */}
  <div>
    <label className="block text-sm font-semibold mb-1">
      Preferred Contact Method
    </label>
    <select
      name="preferred_contact"
      value={form.preferred_contact}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">Select one...</option>
      <option value="Call">Call</option>
      <option value="Text">Text</option>
      <option value="Email">Email</option>
    </select>
  </div>

  {/* Property Type */}
  <div>
    <label className="block text-sm font-semibold mb-1">
      Property Type
    </label>
    <select
      name="property_type"
      value={form.property_type}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">Select one...</option>
      <option value="House">House</option>
      <option value="Apartment">Apartment</option>
      <option value="Condo">Condo</option>
    </select>
  </div>

  {/* Square Footage */}
<div>
  <label className="block text-sm font-semibold mb-1">
    Approx. Square Footage
  </label>
  <input
    type="number"              // 👈 make it numeric
    name="square_footage"
    value={form.square_footage}
    onChange={handleChange}
    placeholder="e.g. 1800"
    min="0"                    // 👈 no negative values
    step="1"                  // 👈 whole numbers only
    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</div>


  {/* Service Type */}
  <div>
    <label className="block text-sm font-semibold mb-1">
      What Service Are You Looking For?
    </label>
    <select
      name="service_type"
      value={form.service_type}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">Select one...</option>
      <option value="Commercial">Commercial</option>
      <option value="Deep Clean">Deep Clean</option>
      <option value="Move In / Move Out">Move In / Move Out</option>
      <option value="Post Construction">Post Construction</option>
      <option value="Recurring Maintenance">Recurring Maintenance</option>
      <option value="Other">Other</option>
    </select>
  </div>
</div>

{/* How did you hear about us */}
<div>
  <label className="block text-sm font-semibold mb-1">
    How did you hear about us?
  </label>
  <input
    name="heard_about_us"
    value={form.heard_about_us}
    onChange={handleChange}
    placeholder="Google, Facebook, Friend, etc."
    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
  />
</div>


            {/* Message */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                How can we help you? *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                required
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Tell us about your cleaning needs..."
              />
            </div>
         {status && (
            <div className="mb-6 p-2 rounded-lg bg-green-100 text-green-700 font-semibold">
              {status}
            </div>
          )}

          {error && (
            <div className="mb-6 p-2 rounded-lg bg-red-100 text-red-700 font-semibold">
              {error}
            </div>
          )}

            {/* Submit */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-4 rounded-xl font-bold text-white tracking-wide transition shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                }`}
              >
                {loading ? "Sending..." : "Send Inquiry"}
              </button>
            </div>

          </form>
        </div>
        
      </div>
    </div>
  );
}
