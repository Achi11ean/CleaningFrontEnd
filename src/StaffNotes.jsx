import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const NOTE_TYPES = [
  { value: "general", label: "General" },
  { value: "notice", label: "Notice" },
  { value: "write_up", label: "Write Up" },
  { value: "praise", label: "Praise" },
];

export default function StaffNotes({ axios, staffId }) {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    try {
      const res = await axios.get(`/staff/${staffId}/notes`);
      setNotes(res.data || []);
    } catch {
      toast.error("Failed to load staff notes");
    }
  };

  useEffect(() => {
    loadNotes();
  }, [staffId]);

  const addNote = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await axios.post(`/staff/${staffId}/notes`, {
        content,
        note_type: noteType,
      });

      setContent("");
      setNoteType("general");
      loadNotes();
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold text-lg">📝 Staff Notes</h3>

      {/* Add Note */}
      <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
        <select
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          {NOTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Write a note about this staff member..."
          className="w-full border rounded px-3 py-2"
        />

        <button
          onClick={addNote}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          {loading ? "Saving..." : "Add Note"}
        </button>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div
              key={n.id}
              className="border rounded-lg p-3 bg-white"
            >
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="uppercase font-semibold">
                  {n.note_type.replace("_", " ")}
                </span>
                <span>
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-sm whitespace-pre-wrap">
                {n.content}
              </p>

              <div className="text-xs text-gray-400 mt-2">
                — {n.created_by} ({n.created_by_role})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
