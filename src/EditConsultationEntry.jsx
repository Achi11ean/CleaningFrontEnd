import { useState, useEffect } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";
import { toast } from "react-toastify";


function getCalculation(entry) {
  const base = entry.base_points || 0;
  const qty = entry.quantity || 1;
  const intensity = entry.intensity_points || 1;

  const multiplierValues =
    entry.multipliers?.map((m) => m.multiplier) || [];

  const roomMultiplier = entry.room_sqft_multiplier || 1;

  // STEP 1
  const baseTotal = base * qty;

  // STEP 2
  const afterIntensity = baseTotal * intensity;

  // STEP 3
  let afterMultipliers = afterIntensity;
  multiplierValues.forEach((m) => {
    afterMultipliers *= m;
  });

  // STEP 4
  const afterRoom = Math.round(afterMultipliers * roomMultiplier);

  return {
    base,
    qty,
    baseTotal,
    intensity,
    multipliers: multiplierValues,
    roomMultiplier,
    afterIntensity,
    afterMultipliers,
    final: afterRoom,
  };
}
export default function EditConsultationEntry({ entry, onUpdated }) {
  const { axios } = useAuthorizedAxios();
  const [editing, setEditing] = useState(false);
  const [intensities, setIntensities] = useState([]);
  const [multipliers, setMultipliers] = useState([]);

const [form, setForm] = useState({
  intensity_id: entry.intensity_id,
  multiplier_ids: entry.multipliers?.map((m) => m.id) || [],
  notes: entry.entry_notes || "",
});

const calc = getCalculation(entry);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [iRes, mRes] = await Promise.all([
          axios.get("/consultation/intensities"),
          axios.get("/consultation/multipliers"),
        ]);
        setIntensities(iRes.data || []);
        setMultipliers(mRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load options");
      }
    };
    if (editing) loadData();
  }, [editing, axios]);

  const handleSave = async () => {
    try {
      await axios.patch(`/consultation-entries/${entry.id}`, form);
      toast.success("Entry updated");
      setEditing(false);
      onUpdated?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update entry");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await axios.delete(`/consultation-entries/${entry.id}`);
      toast.success("Entry deleted");
      onUpdated?.();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete entry");
    }
  };

  if (!editing) {
    return (
      <div className="px-4 py-3 bg-white hover:bg-gray-50 transition space-y-2">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="font-medium text-gray-800">{entry.item_title}</div>
            <div className="text-xs text-gray-500">
              Base: {entry.base_points} • Intensity:
              <span className="font-semibold text-gray-700"> {entry.intensity_label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-800">{entry.calculated_points} pts</div>
          </div>
        </div>

        {entry.entry_notes && (
          <div className="text-xs italic text-gray-600">Entry notes: “{entry.entry_notes}”</div>
        )}

        {entry.multipliers?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 px-3 py-2 rounded text-xs space-y-1">
            <div className="font-semibold text-amber-700">Applied Multipliers</div>
            {entry.multipliers.map((m) => (
              <div key={m.id} className="text-amber-800">
                • {m.label} × {m.multiplier}
              </div>

              
            ))}
          </div>
        )}

        <div className="flex justify-between text-[10px] text-gray-400 pt-1">
          <span>Added by {entry.created_by ?? "system"}</span>
          <span>{new Date(entry.created_at).toLocaleString()}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-white rounded-lg space-y-3 border border-blue-100">
      <div className="font-semibold text-gray-700">{entry.item_title}</div>

      <div>
        <label className="block text-xs font-medium mb-1">Intensity</label>
        <select
          value={form.intensity_id}
          onChange={(e) => setForm({ ...form, intensity_id: Number(e.target.value) })}
          className="w-full border rounded px-2 py-1 text-sm"
        >
          {intensities.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label} ({i.points} pts)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Multipliers</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
          {multipliers.map((m) => (
            <label key={m.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.multiplier_ids.includes(m.id)}
                onChange={(e) => {
                  const ids = form.multiplier_ids.includes(m.id)
                    ? form.multiplier_ids.filter((id) => id !== m.id)
                    : [...form.multiplier_ids, m.id];
                  setForm({ ...form, multiplier_ids: ids });
                }}
              />
              {m.label} × {m.multiplier}
            </label>
          ))}
          
        </div>
        
      </div>

   <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded text-xs space-y-1">

  <div className="font-semibold text-blue-700">
    Calculation Details
  </div>

  {/* STEP 1 */}
  <div>
    Base ({calc.base}) × Qty ({calc.qty}) ={" "}
    <strong>{calc.baseTotal}</strong>
  </div>

  {/* STEP 2 */}
  <div>
    × Intensity ({calc.intensity}) ={" "}
    <strong>{calc.afterIntensity}</strong>
  </div>

  {/* STEP 3 */}
  {calc.multipliers.length > 0 && (
    <div>
      × Multipliers ({calc.multipliers.join(" × ")}) ={" "}
      <strong>{calc.afterMultipliers}</strong>
    </div>
  )}

  {/* STEP 4 */}
  {calc.roomMultiplier !== 1 && (
    <div>
      × Room Size ({calc.roomMultiplier}) ={" "}
      <strong>{calc.final}</strong>
    </div>
  )}

  {/* FINAL */}
  <div className="font-semibold text-blue-800 pt-1 border-t">
    Final: {calc.final} pts
  </div>

</div>

      <div>
        <label className="block text-xs font-medium mb-1">Entry Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
