import { useEffect, useMemo, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PrintConsultation from "./PrintConsultation";
import EditConsultationEntry from "./EditConsultationEntry";

export default function ViewConsultation({ consultationId }) {
  const { axios } = useAuthorizedAxios();
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);
const [pricePerPoint, setPricePerPoint] = useState("");
const clientName = useMemo(() => {
  if (!consultation?.client) return "Client";
  return `${consultation.client.first_name} ${consultation.client.last_name}`;
}, [consultation]);

const estimatedTotal = useMemo(() => {
  const points = consultation?.total_points ?? 0;
  const rate = parseFloat(pricePerPoint);
  if (!rate || rate <= 0) return 0;
  return points * rate;
}, [pricePerPoint, consultation]);
const [discountPercent, setDiscountPercent] = useState(0);
const [discountNotes, setDiscountNotes] = useState("");

const discountedTotal = useMemo(() => {
  if (!estimatedTotal) return 0;
  return estimatedTotal * (1 - discountPercent / 100);
}, [estimatedTotal, discountPercent]);

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
  const groupedSections = useMemo(() => {
    if (!consultation?.entries) return {};

    return consultation.entries.reduce((acc, entry) => {
      const key = entry.section_name;

      if (!acc[key]) {
        acc[key] = {
          section_name: key,
          entries: [],
          total_points: 0,
        };
      }

      acc[key].entries.push(entry);
      acc[key].total_points += entry.calculated_points;

      return acc;
    }, {});
  }, [consultation]);



const pricingBreakdown = useMemo(() => {
  if (!consultation) return null;

  const safePricePerPoint = Number(pricePerPoint);
  const validPricePerPoint = Number.isFinite(safePricePerPoint)
    ? safePricePerPoint
    : 0;

  const base = Number.isFinite(estimatedTotal) ? estimatedTotal : 0;
  const final = Number.isFinite(discountedTotal) ? discountedTotal : 0;

  const discountAmount =
    discountPercent > 0 ? base - final : 0;

  return {
    pricePerPoint: validPricePerPoint,
    totalPoints: consultation.total_points ?? 0,
    baseEstimate: base,
    discountPercent,
    discountAmount,
    discountNotes,
    finalTotal: final,
  };
}, [
  pricePerPoint,
  consultation,
  estimatedTotal,
  discountPercent,
  discountNotes,
  discountedTotal,
]);



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
            {consultation.total_points ?? 0}
          </div>
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
    {Object.keys(groupedSections).length === 0 && (
      <div className="text-gray-500 italic text-sm">
        No entries yet.
      </div>
    )}

    <div className="space-y-5">
      {Object.values(groupedSections).map((section) => (
        <div
          key={section.section_name}
          className="rounded-xl border bg-gray-50"
        >
 <div className="flex flex-col gap-1 px-4 py-3 border-b bg-white rounded-t-xl">
  <div className="flex items-center justify-between">
    <h3 className="font-semibold text-gray-800">
      {section.section_name}
    </h3>

    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
      {section.total_points} pts
    </span>
  </div>

  {section.entries[0]?.section_description && (
    <p className="text-xs text-gray-500 italic">
      {section.entries[0].section_description}
    </p>
  )}
</div>

          {/* Entries */}
          <div className="divide-y">
          {section.entries.map((e) => (
  <EditConsultationEntry
    key={e.id}
    entry={e}
    onUpdated={async () => {
      try {
        const res = await axios.get(`/consultations/${consultationId}`);
        setConsultation(res.data);
      } catch (err) {
        console.error("Failed to reload consultation", err);
      }
    }}
  />
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

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
    {/* Price per point */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Dollar amount per point
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          $
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={pricePerPoint}
          onChange={(e) => setPricePerPoint(e.target.value)}
          placeholder="e.g. 2.50"
          className="w-full pl-7 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>
    </div>

    {/* Total points */}
    <div className="text-sm text-gray-600">
      <div className="font-medium">Total Points</div>
      <div className="text-lg font-bold text-gray-800">
        {consultation.total_points ?? 0}
      </div>
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
      <div className="text-lg font-bold text-gray-800">
        Grand Total{" "}
        <span className="text-green-700">
          {consultation.total_points ?? 0} pts
        </span>
      </div>
    </div>
{pricingBreakdown && (
  <PDFDownloadLink
    key={JSON.stringify(pricingBreakdown)}
    document={
      <PrintConsultation
        consultation={consultation}
        groupedSections={groupedSections}
        pricing={pricingBreakdown}
          client={consultation.client}

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
          console.log("📊 Grouped Sections:", groupedSections);
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
