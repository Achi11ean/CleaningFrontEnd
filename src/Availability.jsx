import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function Availability() {
  const { role, axios } = useAuthorizedAxios();
const [hasAvailability, setHasAvailability] = useState(false);

  const [weekly, setWeekly] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const PRESETS = [
  { label: "8a – 8p", start: "08:00", end: "20:00" },
  { label: "9a – 5p", start: "09:00", end: "17:00" },
  { label: "12p – 6p", start: "12:00", end: "18:00" },
  { label: "8a – 12p", start: "08:00", end: "12:00" },
];
const applyPreset = (day, preset) => {
  setWeekly((prev) => ({
    ...prev,
    [day]: {
      ...(prev[day] || {}),
      start: preset.start,
      end: preset.end,
    },
  }));
};

const applyPresetToWeekdays = (preset) => {
  setWeekly((prev) => {
    const updated = { ...prev };
    ["monday", "tuesday", "wednesday", "thursday", "friday"].forEach(
      (d) => {
        updated[d] = {
          ...(prev[d] || {}),
          start: preset.start,
          end: preset.end,
        };
      }
    );
    return updated;
  });
};


  useEffect(() => {
    if (!axios) return;

    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/me/availability");

        if (res.data?.weekly) {
          setWeekly(res.data.weekly);
          setIsLocked(res.data.is_locked);
        } else {
          // initialize empty week
          const empty = {};
          DAYS.forEach((d) => (empty[d] = null));
          setWeekly(empty);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load availability");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [axios]);

  const updateDay = (day, field, value) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { start: "", end: "" }),
        [field]: value,
      },
    }));
  };

  const toggleDay = (day) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { start: "08:00", end: "17:00" },
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await axios.patch("/me/availability", { weekly });
      toast.success("Availability saved");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  if (!axios) {
    return (
      <p className="text-red-600 font-semibold">
        You must be logged in to edit availability.
      </p>
    );
  }

  if (loading) {
    return <p className="italic text-gray-500">Loading availability…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📅 Weekly Availability</h2>

      {isLocked && (
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
          Your availability is currently locked by an admin.
        </div>
      )}
<div className="flex flex-wrap gap-2">
  {PRESETS.map((p) => (
    <button
      key={p.label}
      disabled={isLocked}
      onClick={() => applyPresetToWeekdays(p)}
      className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold hover:bg-blue-200 disabled:opacity-50"
    >
      Apply {p.label} to Mon–Fri
    </button>
  ))}
</div>

      <div className="space-y-4">
       {DAYS.map((day) => {
  const value = weekly[day];

  return (
    <div
      key={day}
      className="border rounded-xl p-4 bg-gray-50 space-y-3"
    >
      {/* Header row */}
      <div className="flex items-center gap-4">
        <div className="w-28 font-semibold text-gray-800">
          {DAY_LABELS[day]}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!value}
            disabled={isLocked}
            onChange={() => toggleDay(day)}
          />
          Available
        </label>
      </div>

      {/* Presets */}
      {value && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              disabled={isLocked}
              onClick={() => applyPreset(day, p)}
              className="px-3 py-1 text-xs rounded-full border bg-white hover:bg-blue-50 text-blue-700 font-semibold disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Manual time inputs */}
      {value && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={value.start}
            disabled={isLocked}
            onChange={(e) =>
              updateDay(day, "start", e.target.value)
            }
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-sm text-gray-600">to</span>
          <input
            type="time"
            value={value.end}
            disabled={isLocked}
            onChange={(e) =>
              updateDay(day, "end", e.target.value)
            }
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      )}
    </div>
  );
})}

      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={save}
          disabled={isLocked || saving}
          className={`px-4 py-2 rounded-lg font-semibold ${
            isLocked
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          💾 Save Availability
        </button>
      </div>
    </div>
  );
}
