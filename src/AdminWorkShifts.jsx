import React, { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

export default function AdminWorkShifts() {
  const { role, axios } = useAuthorizedAxios();

  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
const [admins, setAdmins] = useState([]);

  const [editingShift, setEditingShift] = useState(null);

const emptyForm = {
  owner_type: "admin",
  staff_id: "",
  admin_id: "",
  client_id: "",
  schedule_id: "",
  check_in_at: "",
  check_out_at: "",
  message: "",
  image_urls: [], // ✅ NEW
};


  const [form, setForm] = useState(emptyForm);
const openCloudinary = () => {
  if (!window.cloudinary) {
    alert("Cloudinary not loaded");
    return;
  }

  window.cloudinary.openUploadWidget(
    {
      cloudName: "dcw0wqlse",
      uploadPreset: "karaoke",
      multiple: true,
      folder: "work_shifts",
      resourceType: "image",
      clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
      maxImageFileSize: 10_000_000,
    },
    (error, result) => {
      if (error) {
        console.error("❌ Cloudinary error", error);
        return;
      }

      if (result.event === "success") {
        setForm((prev) => ({
          ...prev,
          image_urls: [...prev.image_urls, result.info.secure_url],
        }));
      }
    }
  );
};

  /* ───────────────────────────────
     Load data
     ─────────────────────────────── */
  useEffect(() => {
    if (role !== "admin") return;

const load = async () => {
  const [shiftRes, staffRes, adminRes, clientRes] = await Promise.all([
    axios.get("/admin/shifts"),
    axios.get("/staff/all"),
    axios.get("/admin/all"),
    axios.get("/clients"),
  ]);

  setShifts(shiftRes.data || []);
  setStaff(staffRes.data || []);
  setAdmins(adminRes.data || []);
  setClients(clientRes.data || []);
};

    load();
}, [role, axios]);

  /* ───────────────────────────────
     Handlers
     ─────────────────────────────── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEditingShift(null);
    setForm(emptyForm);
  };

const submit = async () => {
  console.group("🧪 AdminWorkShifts → submit()");

  console.log("📝 Raw form state:", form);
  console.log("🧭 owner_type:", form.owner_type);
const yearOf = (dt) => Number(dt?.slice(0, 4));

if (form.check_out_at && yearOf(form.check_out_at) < 2000) {
  alert("❌ Invalid check-out year");
  return;
}

if (form.check_in_at && yearOf(form.check_in_at) < 2000) {
  alert("❌ Invalid check-in year");
  return;
}

  const payload = {
  client_id: form.client_id,
  schedule_id: form.schedule_id || null,
  check_in_at: form.check_in_at,
  check_out_at: form.check_out_at || null,
  message: form.message || null,

  staff_id:
    form.owner_type === "staff" && form.staff_id
      ? Number(form.staff_id)
      : null,

  admin_id:
    form.owner_type === "admin" && form.admin_id
      ? Number(form.admin_id)
      : null,

  image_urls: form.image_urls.length ? form.image_urls : [], // ✅ NEW
};


  console.log("📦 Payload BEFORE request:", payload);
  console.log("🧪 staff_id type:", typeof payload.staff_id, payload.staff_id);
  console.log("🧪 admin_id type:", typeof payload.admin_id, payload.admin_id);

  try {
    if (editingShift) {
      console.log("✏️ Updating shift:", editingShift.id);
      await axios.put(`/admin/shifts/${editingShift.id}`, payload);
    } else {
      console.log("➕ Creating new shift");
      await axios.post("/admin/shifts", payload);
    }

    console.log("✅ Shift saved successfully");

    resetForm();

    const res = await axios.get("/admin/shifts");
    console.log("🔄 Refetched shifts:", res.data);

    setShifts(res.data);
  } catch (err) {
    console.error("❌ Shift save failed");

    if (err.response) {
      console.error("🚨 Backend error response:", err.response.data);
      console.error("🚨 Status:", err.response.status);
    } else {
      console.error("🚨 Network / Axios error:", err);
    }
  } finally {
    console.groupEnd();
  }
};


const editShift = (shift) => {
  setEditingShift(shift);

  setForm({
    owner_type: shift.staff ? "staff" : "admin",
    staff_id: shift.staff_id || "",
    admin_id: shift.admin_id || "",
    client_id: shift.client_id,
    schedule_id: shift.schedule_id || "",
    check_in_at: shift.check_in_at?.slice(0, 16),
    check_out_at: shift.check_out_at?.slice(0, 16) || "",
    message: shift.message || "",
    image_urls: Array.isArray(shift.image_urls) ? shift.image_urls : [],
  });
};




  const deleteShift = async (id) => {
    if (!window.confirm("Delete this shift?")) return;
    await axios.delete(`/admin/shifts/${id}`);
    setShifts(shifts.filter((s) => s.id !== id));
  };

  /* ─────────────────────────────── */

  if (role !== "admin") return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🕒 Admin Work Shifts</h2>

      {/* CREATE / EDIT */}
      <div className="bg-white border rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-lg">
          {editingShift ? "Edit Shift" : "Create Shift"}
        </h3>
<select
  value={form.owner_type}
 onChange={(e) =>
  setForm({
    ...form,
    owner_type: e.target.value,
    staff_id: "",
    admin_id: "",
  })
}

  className="w-full border rounded p-2"
>
  <option value="admin">🛡️ Admin Shift</option>
  <option value="staff">👤 Staff Shift</option>
</select>

        {/* Owner */}
 {form.owner_type === "staff" && (
  <select
    name="staff_id"
    value={form.staff_id}
    onChange={handleChange}
    className="w-full border rounded p-2"
  >
    <option value="">Select Staff Member</option>
    {staff.map((s) => (
      <option key={s.id} value={s.id}>
        {s.profile?.first_name || s.username}
      </option>
    ))}
  </select>
)}
{/* ADMIN OWNER */}
{form.owner_type === "admin" && (
  <select
    name="admin_id"
    value={form.admin_id}
    onChange={handleChange}
    className="w-full border rounded p-2"
  >
    <option value="">Select Admin</option>
    {admins.map((a) => (
      <option key={a.id} value={a.id}>
        {a.profile?.first_name || a.username}
      </option>
    ))}
  </select>
)}


        {/* Client */}
        <select
          name="client_id"
          value={form.client_id}
          onChange={handleChange}
          className="w-full border rounded p-2"
        >
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name}
            </option>
          ))}
        </select>

        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          <input
            type="datetime-local"
            name="check_in_at"
            value={form.check_in_at}
            onChange={handleChange}
            className="border rounded p-2"
          />

          <input
            type="datetime-local"
            name="check_out_at"
            value={form.check_out_at}
            onChange={handleChange}
            className="border rounded p-2"
          />
        </div>
{/* IMAGE UPLOAD */}
<div className="space-y-2">
  <button
    type="button"
    onClick={openCloudinary}
    className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold"
  >
    📸 Upload Images
  </button>

  {form.image_urls.length > 0 && (
    <div className="grid grid-cols-3 gap-2">
      {form.image_urls.map((url, idx) => (
        <div key={idx} className="relative group">
          <img
            src={url}
            alt="upload"
            className="h-24 w-full object-cover rounded"
          />
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                image_urls: prev.image_urls.filter((_, i) => i !== idx),
              }))
            }
            className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )}
</div>


        {/* Notes */}
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Optional notes"
          className="w-full border rounded p-2"
        />

        <div className="flex gap-3">
          <button
            onClick={submit}
            className="px-4 py-2 bg-green-600 text-white rounded font-semibold"
          >
            {editingShift ? "Save Changes" : "Create Shift"}
          </button>

          {editingShift && (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-lg">Existing Shifts</h3>

        {shifts.map((s) => (
          <div
            key={s.id}
            className="border rounded p-3 flex justify-between items-center"
          >
            <div>
<div className="font-semibold">
  {s.staff ? (
    <>👤 {s.staff.profile?.first_name || s.staff.username}</>
  ) : s.admin ? (
    <>🛡️ {s.admin.profile?.first_name || s.admin.username}</>
  ) : (
    <>—</>
  )}
  {" → "}
  {s.client?.first_name} {s.client?.last_name}
</div>



              <div className="text-sm text-gray-600">
                {new Date(s.check_in_at).toLocaleString()}{" "}
                {s.check_out_at && `→ ${new Date(s.check_out_at).toLocaleString()}`}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => editShift(s)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => deleteShift(s.id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
