import React, { useState, useEffect } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const ManagePurchases = () => {
  const { axios, role } = useAuthorizedAxios();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the item currently being edited
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ quantity: 0, description: "", total_cost: 0 });

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/purchases");
      setPurchases(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (axios) fetchPurchases();
  }, [axios]);

  // Calculate total spend from the current list
  const totalSpend = purchases.reduce((sum, p) => sum + (p.total_cost || 0), 0);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record? This will also subtract the quantity from total inventory.")) return;
    try {
      await axios.delete(`/purchases/${id}`);
      setPurchases(purchases.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  };

  const startEdit = (purchase) => {
    setEditingId(purchase.id);
    setEditForm({ 
        quantity: purchase.quantity, 
        description: purchase.description || "",
        total_cost: purchase.total_cost || 0 // 👈 Added cost to edit form
    });
  };

  const handleUpdate = async (id) => {
    try {
      // Ensure we send numbers to the backend
      const payload = {
        ...editForm,
        quantity: parseInt(editForm.quantity),
        total_cost: parseFloat(editForm.total_cost)
      };
      const res = await axios.put(`/purchases/${id}`, payload);
      setPurchases(purchases.map(p => p.id === id ? res.data.purchase : p));
      setEditingId(null);
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading history...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="flex flex-wrap justify-between items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Purchase History</h2>
          <p className="text-sm text-gray-500">Track expenses and inventory intake</p>
        </div>
        
        {/* 💰 Summary Card */}
        <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4">
          <span className="text-emerald-100 uppercase text-xs font-bold tracking-wider">Total Lifetime Spend</span>
          <span className="text-2xl font-black">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <button onClick={fetchPurchases} className="text-sm bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition">
          🔄 Refresh Data
        </button>
      </header>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b">
              <th className="p-4 font-semibold text-gray-600">Item / Receipt</th>
              <th className="p-4 font-semibold text-gray-600">Inventory Details</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Cost</th>
              <th className="p-4 font-semibold text-gray-600">Added By</th>
              <th className="p-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/80 transition">
                {/* Item & Image */}
                <td className="p-4">
                  <div className="flex items-center gap-4">
                    {p.receipt_image_url ? (
                      <a href={p.receipt_image_url} target="_blank" rel="noreferrer" className="shrink-0">
                        <img 
                          src={p.receipt_image_url} 
                          alt="Receipt" 
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:scale-110 transition shadow-sm"
                        />
                      </a>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase text-center p-1">
                        No Image
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-800">{p.item_name}</div>
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        {new Date(p.purchase_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Editable Inventory Details */}
                <td className="p-4">
                  {editingId === p.id ? (
                    <div className="space-y-2 max-w-xs">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Qty:</label>
                        <input 
                          type="number" 
                          className="border p-1 w-20 rounded bg-white shadow-sm"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                        />
                      </div>
                      <textarea 
                        className="border p-2 w-full text-sm rounded bg-white shadow-sm"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Description..."
                      />
                    </div>
                  ) : (
                    <div>
                      <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold ring-1 ring-blue-200">
                        Qty: {p.quantity}
                      </span>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description || "—"}
                      </p>
                    </div>
                  )}
                </td>

                {/* 💰 COST COLUMN */}
                <td className="p-4 text-right">
                  {editingId === p.id ? (
                    <div className="flex flex-col items-end gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Total Cost ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        className="border p-1 w-24 rounded text-right font-bold bg-white shadow-sm"
                        value={editForm.total_cost}
                        onChange={(e) => setEditForm({...editForm, total_cost: e.target.value})}
                      />
                    </div>
                  ) : (
                    <div className="font-black text-emerald-700 text-lg">
                      ${p.total_cost?.toFixed(2)}
                    </div>
                  )}
                </td>

                {/* Attribution */}
                <td className="p-4">
                  <div className="text-sm font-bold text-gray-700">{p.added_by.username}</div>
                  <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{p.added_by.role}</div>
                </td>

                {/* Actions */}
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {editingId === p.id ? (
                      <>
                        <button onClick={() => handleUpdate(p.id)} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md transition">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                           ✏️
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                           🗑️
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <div className="p-20 text-center">
            <div className="text-4xl mb-4">🛒</div>
            <div className="text-gray-400 font-bold uppercase tracking-widest">No Purchases Logged</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePurchases;