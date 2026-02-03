import React, { useState } from "react";
import { useAdmin } from "./AdminContext";

export default function AdminStartShift({ schedule, onStarted }) {
  const { authAxios } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceError, setDistanceError] = useState(null);
  const [needsLocationPermission, setNeedsLocationPermission] = useState(false);

  const startShift = async () => {
    setError(null);
    setDistanceError(null);
    setNeedsLocationPermission(false);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this device.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        try {
          const res = await authAxios.post("/admin/shifts/check-in", {
            client_id: schedule.client.id,
            schedule_id: schedule.id,
            lat,
            lng,
          });

          onStarted?.(res.data.shift);
        } catch (err) {
          const data = err?.response?.data;

          if (data?.distance_miles) {
            setDistanceError(
              `You are ${data.distance_miles} miles away. You must be within 1 mile to start this shift.`
            );
          } else {
            setError(data?.error || "Failed to start shift");
          }
        } finally {
          setLoading(false);
        }
      },
      (geoErr) => {
        setLoading(false);
        setNeedsLocationPermission(true);

        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(
            "Location access is blocked. Please allow GPS access to continue."
          );
        } else {
          setError("Unable to get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mt-6 border-t pt-4 space-y-3">
      <h4 className="font-semibold text-lg">
        ⏱️ Start This Shift (Admin)
      </h4>

      <p className="text-sm text-gray-600">
        To start this shift, you must be physically within 1 mile of the client’s address.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm">
          {error}
        </div>
      )}

      {distanceError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-2 text-sm">
          {distanceError}
        </div>
      )}

      {/* ACTION BUTTON */}
      <button
        onClick={startShift}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-bold transition ${
          loading
            ? "bg-gray-300 cursor-not-allowed"
            : needsLocationPermission
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
      >
        {loading
          ? "Checking location..."
          : needsLocationPermission
          ? "📍 Get My Location"
          : "📍 Start Shift as Admin"}
      </button>

      {needsLocationPermission && (
        <p className="text-xs text-gray-500 text-center">
          Tip: When prompted, choose “Allow while using the app”
        </p>
      )}
    </div>
  );
}
