import React, { useState } from "react";
import { useStaff } from "./StaffContext";

export default function StartShift({ schedule, onStarted }) {
  const { authAxios } = useStaff();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceError, setDistanceError] = useState(null);

  const startShift = async () => {
    setError(null);
    setDistanceError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this device.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const res = await authAxios.post("/staff/shifts/check-in", {
            client_id: schedule.client.id,
            schedule_id: schedule.id,
            lat,
            lng,
          });

          // Success
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
        setError("Unable to get your location. Please allow GPS access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="mt-6 border-t pt-4 space-y-3">
      <h4 className="font-semibold text-lg">⏱️ Start This Shift</h4>

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

      <button
        onClick={startShift}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-bold transition ${
          loading
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {loading ? "Checking location..." : "📍 Start Shift"}
      </button>
    </div>
  );
}
