import { useEffect, useState } from "react";
import { useAuthorizedAxios } from "./useAuthorizedAxios";

const CLOUD_NAME = "dcw0wqlse";
const UPLOAD_PRESET = "karaoke";

export default function ManageGallery() {
  const { axios } = useAuthorizedAxios();

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    const res = await axios.get("/gallery");
    setItems(res.data || []);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || "",
      image_url: item.image_url,
    });
  };

  const uploadImage = async (file) => {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    setForm((f) => ({ ...f, image_url: data.secure_url }));
    setUploading(false);
  };

  const saveEdit = async (id) => {
    await axios.patch(`/gallery/${id}`, form);
    setEditingId(null);
    loadGallery();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    await axios.delete(`/gallery/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🖼️ Manage Gallery</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isEditing = editingId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white border rounded-2xl shadow p-4 space-y-3"
            >
              <img
                src={isEditing ? form.image_url : item.image_url}
                className="rounded-xl w-full h-48 object-cover"
                alt=""
              />

              {isEditing ? (
                <>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="w-full border rounded p-2"
                  />

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                    className="w-full border rounded p-2"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadImage(e.target.files[0])}
                    className="text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(item.id)}
                      className="flex-1 py-1.5 rounded bg-blue-600 text-white text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-1.5 rounded bg-gray-100 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex-1 py-1.5 rounded bg-blue-100 text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex-1 py-1.5 rounded bg-red-100 text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
