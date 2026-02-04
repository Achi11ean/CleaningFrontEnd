import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const CreatePurchase = ({ onPurchaseAdded }) => {
  const { axios, role } = useAuthorizedAxios();
  
  // Form State
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [totalCost, setTotalCost] = useState(""); // 👈 Added Total Cost state
  const [description, setDescription] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Image/Cloudinary State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get("/inventory/items");
        const options = res.data.map(item => ({
          value: item.id,
          label: `${item.name} (${item.category})`,
          ...item
        }));
        setItems(options);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    if (axios) fetchItems();
  }, [axios]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async () => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append("file", imageFile);
    // Be sure to replace "karaoke" and "dcw0wqlse" with your actual Cloudinary settings
    formData.append("upload_preset", "karaoke"); 

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dcw0wqlse/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return alert("Please select an item");

    setIsUploading(true);
    let finalImageUrl = "";

    if (imageFile) {
      finalImageUrl = await uploadToCloudinary();
    }

    const payload = {
      item_id: selectedItem.value,
      quantity: parseInt(quantity),
      total_cost: parseFloat(totalCost) || 0, // 👈 Included total_cost in payload
      description,
      purchase_date: purchaseDate,
      image_url: finalImageUrl
    };

    try {
      await axios.post("/purchases", payload);
      alert("Purchase recorded!");
      // Reset form
      setSelectedItem(null);
      setQuantity(1);
      setTotalCost(""); // 👈 Reset cost
      setDescription("");
      setImageFile(null);
      setPreviewUrl("");
      if (onPurchaseAdded) onPurchaseAdded();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save purchase");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Log New Purchase</h2>
      <p className="text-sm text-gray-500 mb-6">Logged in as: <span className="capitalize font-semibold">{role}</span></p>

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium mb-1">Select Item</label>
          <Select
            options={items}
            value={selectedItem}
            onChange={setSelectedItem}
            placeholder="Search items..."
            isClearable
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
            />
          </div>
          {/* 💰 Added Total Cost Input */}
          <div>
            <label className="block text-sm font-medium mb-1">Total Cost ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full border rounded p-2"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            className="w-full border rounded p-2"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (Optional)</label>
          <textarea
            className="w-full border rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Where was it bought? Store name, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Receipt Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="text-sm"
          />
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="mt-2 h-32 w-32 object-cover rounded border" 
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-2 rounded text-white font-bold transition-all ${
            isUploading ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isUploading ? "Processing..." : "Save Purchase"}
        </button>
      </form>
    </div>
  );
};

export default CreatePurchase;