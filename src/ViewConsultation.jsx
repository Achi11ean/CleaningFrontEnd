import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PrintConsultation from "./PrintConsultation";
import EditConsultationEntry from "./EditConsultationEntry";
const CREW_RATES = {
  2: 100,
  3: 125,
  4: 150
};
const CREW_MIN_HOURS = 1;

export default function ViewConsultation({ consultationId }) {
  const { axios } = useAuthorizedAxios();
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);
const [serviceType, setServiceType] = useState("one_time"); 
const [recurringFrequency, setRecurringFrequency] = useState("weekly");
const [cleaners, setCleaners] = useState(2);
const clientName = useMemo(() => {
  if (!consultation?.client) return "Client";
  return `${consultation.client.first_name} ${consultation.client.last_name}`;
}, [consultation]);
const handleDeleteRoom = async (roomId) => {
  if (!window.confirm("Delete this entire room and ALL its entries?")) return;

  try {
    await axios.delete(`/consultation-rooms/${roomId}`);

    // reload consultation after delete
    const res = await axios.get(`/consultations/${consultationId}`);
    setConsultation(res.data);

  } catch (err) {
    console.error(err);
    alert("Failed to delete room");
  }
};





const estimatedTotal = useMemo(() => {
  if (!consultation) return 0;

  const points = Number(consultation.total_points) || 0;

  const minutes = points * 6;
  const laborHours = minutes / 60;
  const onsiteHours = laborHours / cleaners;

  const rate = CREW_RATES[cleaners] || 100;

  const calculated = onsiteHours * rate;

  const minimum = rate * CREW_MIN_HOURS;

  return Math.max(calculated, minimum);

}, [consultation, cleaners]);

const [discountPercent, setDiscountPercent] = useState(0);
const [discountNotes, setDiscountNotes] = useState("");

const discountedTotal = useMemo(() => {
  if (!estimatedTotal) return 0;

  const rate = CREW_RATES[cleaners];
  const minimum = rate * CREW_MIN_HOURS;

  const discounted = estimatedTotal * (1 - discountPercent / 100);

  return Math.max(discounted, minimum);

}, [estimatedTotal, discountPercent, cleaners]);
  useEffect(() => {
    if (!consultationId || !axios) return;

    async function load() {
      try {
        const res = await axios.get(`/consultations/${consultationId}`);
        setConsultation(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load consultation");
      }
    }

    load();
  }, [consultationId, axios]);

  /* ───────────────────────────────
     Group entries by section
     ─────────────────────────────── */
 const groupedRooms = useMemo(() => {
  if (!consultation?.entries) return {};

  const roomsMap = {};

  consultation.entries.forEach(entry => {
    const roomId = entry.room_id || "no-room";

    // 🔹 Find room object
    const room =
      consultation.rooms?.find(r => r.id === entry.room_id) || {
        id: "no-room",
        label: "Unassigned",
      };

    if (!roomsMap[roomId]) {
      roomsMap[roomId] = {
        room,
        total_points: 0,
        sections: {},
      };
    }

    const sectionKey = entry.section_name;

    if (!roomsMap[roomId].sections[sectionKey]) {
      roomsMap[roomId].sections[sectionKey] = {
        section_name: sectionKey,
        entries: [],
        total_points: 0,
      };
    }

  const points = Number(entry.calculated_points) || 0;

roomsMap[roomId].sections[sectionKey].total_points += points;
roomsMap[roomId].total_points += points;
roomsMap[roomId].sections[sectionKey].entries.push(entry);

  });

  return roomsMap;
}, [consultation]);


const pricingBreakdown = useMemo(() => {
  if (!consultation) return null;


  const base = Number.isFinite(estimatedTotal) ? estimatedTotal : 0;
  const final = Number.isFinite(discountedTotal) ? discountedTotal : 0;

  const discountAmount =
    discountPercent > 0 ? base - final : 0;

  return {
    crewRate: CREW_RATES[cleaners],
    totalPoints: consultation.total_points ?? 0,
    baseEstimate: base,
    discountPercent,
    discountAmount,
    discountNotes,
    finalTotal: final,
  };
}, [
  consultation,
  estimatedTotal,
  discountPercent,
  discountNotes,
  discountedTotal,
]);


const roomTimeBreakdown = useMemo(() => {
  if (!groupedRooms) return [];

  const POINT_TO_MINUTES = 6;

  return Object.values(groupedRooms).map(room => {

    const points = Number(room.total_points) || 0;

    const minutes = points * POINT_TO_MINUTES;
    const laborHours = minutes / 60;
    const onsiteHours = laborHours / cleaners;

    return {
      roomId: room.room.id,
      minutes,
      laborHours,
      onsiteHours
    };

  });

}, [groupedRooms, cleaners]);


const MAINTENANCE_FACTORS = {
  weekly: 0.7,
  biweekly: 0.8,
  monthly: 0.9
};

const totalTime = useMemo(() => {
  if (!consultation) return null;

  const POINT_TO_MINUTES = 6;
  const TRANSITION_MINUTES_PER_ROOM = 5;

  const points = Number(consultation.total_points) || 0;

  const cleaningMinutes = points * POINT_TO_MINUTES;

  const roomCount = consultation.rooms?.length || 0;
  const transitionMinutes = roomCount * TRANSITION_MINUTES_PER_ROOM;

  let totalMinutes = cleaningMinutes + transitionMinutes;

  const laborHours = totalMinutes / 60;
  let onsiteHours = laborHours / cleaners;

  /* ───────────────────────────────
     Break logic (crew breaks together)
  ─────────────────────────────── */

  let breakMinutes = 0;

  if (onsiteHours > 6.5) {
    breakMinutes = 30;
  } else if (onsiteHours > 4) {
    breakMinutes = 15;
  }

  totalMinutes += breakMinutes;

  const finalLaborHours = totalMinutes / 60;
  const finalOnsiteHours = finalLaborHours / cleaners;

  return {
    minutes: totalMinutes,
    laborHours: finalLaborHours,
    onsiteHours: finalOnsiteHours,
    transitionMinutes,
    breakMinutes
  };

}, [consultation, cleaners]);


const maintenanceTotal = useMemo(() => {
  if (!estimatedTotal) return 0;

  const factor = MAINTENANCE_FACTORS[recurringFrequency] || 0.7;

  const rate = CREW_RATES[cleaners];
  const minimum = rate * CREW_MIN_HOURS;

  const calculated = estimatedTotal * factor;

  return Math.max(calculated, minimum);

}, [estimatedTotal, cleaners, recurringFrequency]);



const maintenanceTime = useMemo(() => {
  if (!totalTime) return null;

  const factor = MAINTENANCE_FACTORS[recurringFrequency] || 0.7;

  return {
    ...totalTime,
    onsiteHours: totalTime.onsiteHours * factor
  };

}, [totalTime, recurringFrequency]);


  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!consultation) {
    return <div className="text-gray-500">Loading consultation…</div>;
  }



 return (
  <div className="bg-white rounded-xl border shadow-sm p-5 space-y-6">

    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<div>
  <h2 className="text-xl font-bold text-gray-800">
    Consultation Summary
  </h2>
{/* Service Type */}
<div className="flex gap-2">

  <button
    onClick={() => setServiceType("one_time")}
    className={`px-3 py-1 rounded-full text-sm font-semibold border
      ${serviceType === "one_time"
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-gray-700 hover:bg-gray-50"}
    `}
  >
    One-Time
  </button>

  <button
    onClick={() => setServiceType("recurring")}
    className={`px-3 py-1 rounded-full text-sm font-semibold border
      ${serviceType === "recurring"
        ? "bg-indigo-600 text-white border-indigo-600"
        : "bg-white text-gray-700 hover:bg-gray-50"}
    `}
  >
    Recurring
  </button>

</div>
  <p className="text-sm font-medium text-gray-700">
    {clientName}
  </p>

  <p className="text-sm text-gray-500">
    {new Date(consultation.created_at).toLocaleString()}
  </p>
</div>

      <div className="flex items-center gap-4">
        <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-semibold text-sm">
          Total Points
          <div className="text-lg font-bold">
{Number(consultation.total_points || 0).toFixed(2)}          </div>
        </div>
        <div className="flex items-center gap-3">
  <label className="text-sm font-medium text-gray-600">
    Cleaners
  </label>

  <select
    value={cleaners}
    onChange={(e) => setCleaners(Number(e.target.value))}
    className="border rounded px-2 py-1 text-sm"
  >
    <option value={2}>2 Cleaners</option>
    <option value={3}>3 Cleaners</option>
    <option value={4}>4 Cleaners</option>
  </select>
</div>
      </div>
    </div>

    {consultation.notes && (
      <div className="bg-gray-50 border rounded-lg px-4 py-3 text-sm text-gray-600">
        <strong className="text-gray-700">Notes:</strong>{" "}
        {consultation.notes}
      </div>
    )}

    {/* Sections */}
{Object.keys(groupedRooms).length === 0 && (
  <div className="text-gray-500 italic text-sm">
    No entries yet.
  </div>
)}

  <div className="space-y-6">

  {Object.values(groupedRooms).map(roomGroup => (

    <div key={roomGroup.room.id} className="rounded-xl border bg-white shadow">

      {/* ROOM HEADER */}
      <div className="px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-sky-50">
       <div className="flex justify-between items-center">

  <div>
    <h3 className="text-lg font-bold text-gray-800">
      {roomGroup.room.label}
    </h3>

    {roomGroup.room.square_feet && (
      <div className="text-xs text-gray-500">
        {roomGroup.room.square_feet} sqft • multiplier ×{roomGroup.room.sqft_multiplier}
      </div>
    )}
  </div>

  <div className="flex items-center gap-3">
<div className="text-xs text-gray-600 mt-1">
  {(() => {

   const points = Number(roomGroup.total_points) || 0;
const minutes = points * 6;

const hrs = Math.floor(minutes / 60);
const mins = Math.round(minutes % 60);
    return `${hrs}h ${mins}m estimated`;

  })()}
</div>
<div className="text-sm font-semibold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
  {Number(roomGroup.total_points).toFixed(2)} pts
</div>


    {/* DELETE BUTTON */}
    {roomGroup.room.id !== "no-room" && (
      <button
        onClick={() => handleDeleteRoom(roomGroup.room.id)}
        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Delete
      </button>
    )}

  </div>

</div>
      </div>

      {/* SECTIONS INSIDE ROOM */}
      <div className="space-y-5 p-4">

        {Object.values(roomGroup.sections).map(section => (

          <div key={section.section_name} className="rounded-lg border bg-gray-50">

            {/* SECTION HEADER */}
            <div className="flex justify-between px-4 py-3 border-b bg-white">
              <h4 className="font-semibold text-gray-800">
                {section.section_name} Items
              </h4>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
{Number(section.total_points).toFixed(2)} pts              </span>
            </div>

            {/* ENTRIES */}
            <div className="divide-y">
              {section.entries.map(e => (
                <EditConsultationEntry
                  key={e.id}
                  entry={e}
                  onUpdated={async () => {
                    const res = await axios.get(`/consultations/${consultationId}`);
                    setConsultation(res.data);
                  }}
                />
              ))}
            </div>

          </div>

        ))}

      </div>

    </div>

  ))}

</div>

{/* Pricing Estimate */}
<div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-5 space-y-4">
  <h3 className="text-lg font-semibold text-gray-800">
    Cleaning Cost Estimate
  </h3>
{totalTime && (
  <div className="rounded-xl border bg-blue-50 p-4 flex justify-between items-center">

    <div>
      <div className="text-sm text-gray-600">
        Estimated Cleaning Time
      </div>
<div className="text-xl font-bold text-blue-700">
  {Math.floor(totalTime.onsiteHours)}h{" "}
  {Math.round((totalTime.onsiteHours % 1) * 60)}m
</div>
<div className="text-xs text-gray-500 mt-1 space-y-1">

  {totalTime.transitionMinutes > 0 && (
    <div>
      Room Transitions: {totalTime.transitionMinutes} min
    </div>
  )}

  {totalTime.breakMinutes > 0 && (
    <div>
      Crew Break: {totalTime.breakMinutes} min
    </div>
  )}

</div>
    </div>

    <div className="text-sm text-gray-600">
      {cleaners} cleaners
    </div>

  </div>
)}

{serviceType === "one_time" && (
  <div className="rounded-xl border bg-emerald-50 p-5 space-y-3">

    <h3 className="text-lg font-semibold">
      One-Time Deep Clean Estimate
    </h3>

    <div className="text-xl font-bold">
      {Math.floor(totalTime?.onsiteHours)}h{" "}
      {Math.round((totalTime?.onsiteHours % 1) * 60)}m
    </div>

    <div className="text-2xl font-bold text-emerald-700">
      ${discountedTotal.toFixed(2)}
    </div>

  </div>
)}

{serviceType === "recurring" && (
  <div className="grid md:grid-cols-2 gap-2">

    {/* Initial Clean */}
    <div className="rounded-xl border bg-orange-50 p-5">
<div className="flex gap-2 mb-3">
  {[
    { label: "Weekly", value: "weekly" },
    { label: "Bi-Weekly", value: "biweekly" },
    { label: "Monthly", value: "monthly" }
  ].map(opt => (
    <button
      key={opt.value}
      onClick={() => setRecurringFrequency(opt.value)}
      className={`px-2 py-1 rounded-full text-sm font-semibold border
        ${recurringFrequency === opt.value
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 hover:bg-gray-50"}
      `}
    >
      {opt.label}
    </button>
  ))}
</div>
<p className="text-xs text-gray-500">
  Maintenance factor: {(MAINTENANCE_FACTORS[recurringFrequency] * 100).toFixed(0)}%
</p>
      <h3 className="text-lg font-semibold">
        Initial Deep Clean
      </h3>

      <div className="text-xl font-bold">
        {Math.floor(totalTime?.onsiteHours)}h{" "}
        {Math.round((totalTime?.onsiteHours % 1) * 60)}m
      </div>

      <div className="text-2xl font-bold text-orange-700">
        ${discountedTotal.toFixed(2)}
      </div>

    </div>

    {/* Maintenance */}
    <div className="rounded-xl border bg-blue-50 p-5">

      <h3 className="text-lg font-semibold">
        Recurring Maintenance Clean
      </h3>

      <div className="text-xl font-bold">
        {Math.floor(maintenanceTime?.onsiteHours)}h{" "}
        {Math.round((maintenanceTime?.onsiteHours % 1) * 60)}m
      </div>

      <div className="text-2xl font-bold text-blue-700">
        ${maintenanceTotal.toFixed(2)}
      </div>

    </div>

  </div>
)}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
<div>
  <div className="text-sm font-medium text-gray-700">
    Crew Rate
  </div>

  <div className="text-lg font-bold text-gray-800">
    ${CREW_RATES[cleaners]}/hr
  </div>
  <div className="text-xs text-gray-500">
  Minimum Service Charge: ${CREW_RATES[cleaners]}
</div>
</div>
    {/* Total points */}
    <div className="text-sm text-gray-600">
      <div className="font-medium">Total Points</div>
      <div className="text-lg font-bold text-gray-800">
{Number(consultation.total_points || 0).toFixed(2)}      </div>
    </div>

    {/* Estimated total */}
   <div className="text-right space-y-1">
  <div className="text-sm text-gray-500">
    Base Estimate
  </div>
  <div className="text-lg font-semibold text-gray-800">
    ${estimatedTotal.toFixed(2)}
  </div>

  {discountPercent > 0 && (
    <div className="text-sm text-emerald-600 font-medium">
      − {discountPercent}% discount
    </div>
  )}

  <div className="text-2xl font-bold text-emerald-700">
    ${discountedTotal.toFixed(2)}
  </div>
</div>

  </div>

  <p className="text-xs text-gray-500 italic">
    * This is an estimate based on the selected price per point.
  </p>
</div>
{/* Discount Options */}
<div className="space-y-3">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Apply Discount
    </label>

    <div className="flex gap-2">
      {[0, 5, 10, 15].map((percent) => (
        <button
          key={percent}
          onClick={() => setDiscountPercent(percent)}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition
            ${
              discountPercent === percent
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
        >
          {percent === 0 ? "No Discount" : `${percent}%`}
        </button>
      ))}
    </div>
  </div>

  {/* Discount Notes */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Discount Notes (optional)
    </label>
    <textarea
      value={discountNotes}
      onChange={(e) => setDiscountNotes(e.target.value)}
      rows={2}
      placeholder="e.g. First-time customer, referral, bundled service…"
      className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
    />
  </div>
</div>

    {/* Footer Total */}
    <div className="pt-4 border-t flex justify-end">
      
   
    </div>
{pricingBreakdown && consultation && (
  <PDFDownloadLink

    key={JSON.stringify(pricingBreakdown)}
    document={
<PrintConsultation
  consultation={consultation}
  pricing={pricingBreakdown}
  client={consultation.client}
  serviceType={serviceType}
  recurringFrequency={recurringFrequency}
  totalTime={totalTime}
  transitionMinutes={totalTime?.transitionMinutes || 0}
  breakMinutes={totalTime?.breakMinutes || 0}
  maintenanceTime={maintenanceTime}
  maintenanceTotal={maintenanceTotal}
/>
    }
    fileName={`consultation-estimate-${consultation.id}.pdf`}
  >
    {({ loading }) => (
      <button
        className="ml-auto px-4 py-2 rounded-lg bg-gray-900 text-white"
        onClick={() => {
          console.log("🖨️ PDF CLICKED");
          console.log("📋 Consultation:", consultation);
console.log("📊 Grouped Rooms:", groupedRooms);
          console.log("💰 Pricing Breakdown:", pricingBreakdown);
        }}
        disabled={loading}
      >
        {loading ? "Generating PDF…" : "Export PDF"}
      </button>
    )}
  </PDFDownloadLink>
)}





  </div>
);

}
