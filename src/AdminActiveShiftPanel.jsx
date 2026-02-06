import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import ConsultationChecklist from "./ConsultationChecklist";

export default function AdminActiveShiftPanel() {
  const { authAxios } = useAdmin();

  const CLOUD_NAME = "dcw0wqlse";
  const UPLOAD_PRESET = "karaoke";

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState(null);

  const [photoUrl, setPhotoUrl] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  // PIN flow
  const [pinRequired, setPinRequired] = useState(false);
  const [pin, setPin] = useState("");
  const [pendingCoords, setPendingCoords] = useState(null);
function formatTime12(timeStr) {
  if (!timeStr) return "";

  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);

  return date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime12(isoString) {
  if (!isoString) return "";

  const d = new Date(isoString);

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

  // 📸 Upload to Cloudinary
  const uploadToCloudinary = async (file) => {
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setPhotoUrl(data.secure_url);
      setStatus("📸 Photo uploaded successfully");
    } catch (err) {
      setUploadError("❌ Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // 🔄 Load active admin shift
  const loadActiveShift = async () => {
    try {
      setLoading(true);
      const res = await authAxios.get("/admin/shifts/active");

      if (res.data.active) {
        setActiveShift(res.data);
      } else {
        setActiveShift(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveShift();
  }, []);

  // 📍 Get browser GPS
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => reject("Failed to get location"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // 🚪 Send checkout
  const sendCheckout = async ({ lat, lng, pinOverride = null }) => {
    const payload = {
      lat,
      lng,
      image_url: photoUrl || null,
      message: message || null,
    };

    if (pinOverride) {
      payload.pin = pinOverride;
    }

    const res = await authAxios.post("/admin/shifts/check-out", payload);
    return res.data;
  };

  // ⏹️ Normal checkout flow
  const checkOut = async () => {
    try {
      setStatus("📍 Getting your location...");

      const coords = await getCurrentLocation();

      setStatus("Checking out...");

      await sendCheckout({
        lat: coords.lat,
        lng: coords.lng,
      });

      setStatus("✅ Shift checked out successfully");
      setActiveShift(null);
      setPinRequired(false);
      setPin("");
      setPendingCoords(null);
    } catch (err) {
      const data = err.response?.data;

      // 🔐 PIN REQUIRED
      if (data?.pin_required) {
        setStatus(
          `🔒 You are ${data.distance_miles} miles away. PIN required to check out.`
        );
        setPinRequired(true);

        if (!pendingCoords) {
          try {
            const coords = await getCurrentLocation();
            setPendingCoords(coords);
          } catch {
            setStatus("Failed to get location for PIN retry");
          }
        }

        return;
      }

      setStatus(data?.error || "❌ Failed to check out");
    }
  };

  // 🔐 Submit PIN override
  const submitPin = async () => {
    if (!pin) {
      setStatus("Enter the PIN to continue");
      return;
    }

    try {
      setStatus("🔐 Verifying PIN and checking out...");

      await sendCheckout({
        lat: pendingCoords.lat,
        lng: pendingCoords.lng,
        pinOverride: pin,
      });

      setStatus("✅ Shift checked out with PIN override");
      setActiveShift(null);
      setPinRequired(false);
      setPin("");
      setPendingCoords(null);
    } catch (err) {
      setStatus(err.response?.data?.error || "Invalid PIN or checkout failed");
    }
  };

  if (loading) return <p>Loading shift status...</p>;

  if (!activeShift) {
    return (
      <div className="bg-gray-50 border rounded-xl p-4 text-gray-600 italic">
        You are not currently checked in to a client shift.
      </div>
    );
  }

  const { client, schedule, shift } = activeShift;

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-1 space-y-4">
      <h3 className="text-lg font-bold text-green-800">
        🟢 Active Admin Work Shift
      </h3>

      <div className="space-y-1 text-sm">
        <p>
          <strong>Client:</strong> {client.first_name} {client.last_name}
        </p>

        {schedule && (
          <p>
            <strong>Scheduled Time:</strong>{" "}
{formatTime12(schedule.start_time)} → {formatTime12(schedule.end_time)}
          </p>
        )}

        <p>
          <strong>Checked In At:</strong>{" "}
          {new Date(shift.check_in_at).toLocaleString()}
        </p>
      </div>
{/* ✅ Consultation Checklist */}
{client?.id && (
  <div>
    <ConsultationChecklist clientId={client.id} />
  </div>
)}


      {/* 📸 PHOTO UPLOAD */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold">
          Shift Photo (optional)
        </label>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) uploadToCloudinary(file);
          }}
          className="block w-full text-sm"
        />

        {uploading && (
          <p className="text-sm text-blue-600 font-semibold">
            ⏫ Uploading photo...
          </p>
        )}

        {uploadError && (
          <p className="text-sm text-red-600 font-semibold">
            {uploadError}
          </p>
        )}

        {photoUrl && (
          <div className="space-y-1">
            <p className="text-sm text-green-700 font-semibold">
              📸 Photo ready
            </p>
            <img
              src={photoUrl}
              alt="Shift proof"
              className="w-40 rounded border"
            />
          </div>
        )}
      </div>

      {/* 📝 NOTES */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Shift Notes (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe work done, issues, etc..."
          className="w-full border rounded px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      {/* 🔐 PIN SECTION */}
      {pinRequired && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-yellow-800">
            🔒 You are too far from the client location.
            Enter manager PIN to check out.
          </p>

          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full border rounded px-3 py-2 text-sm"
          />

          <button
            onClick={submitPin}
            className="px-4 py-2 rounded bg-yellow-600 text-white font-semibold hover:bg-yellow-700"
          >
            🔐 Submit PIN & Check Out
          </button>
        </div>
      )}

      {/* ⏹️ CHECK OUT BUTTON */}
      {!pinRequired && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={checkOut}
            className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
          >
            ⏹️ Check Out of Shift
          </button>

          {status && (
            <p className="text-sm font-semibold text-gray-700">
              {status}
            </p>
          )}
        </div>
      )}

      {pinRequired && status && (
        <p className="text-sm font-semibold text-gray-700">
          {status}
        </p>
      )}
    </div>
  );
}
