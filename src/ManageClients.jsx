import { useEffect, useMemo, useState } from "react";

/* ============================================================================
   DEMO MOCK BACKEND  —  lets this preview run on its own.
   To use in YOUR app: delete this whole block and restore your real import:
       import { useAdmin } from "./AdminContext";
   Everything below the mock is your real component logic, just restyled.
   ========================================================================== */
const seedClients = [
  { id: 1, first_name: "Nadia", last_name: "Rahman", email: "nadia.rahman@example.com", phone: "(860) 555-0142", address: "14 Birch Ln, Cromwell, CT", message: "Heard about you from a neighbor — hoping to get on the schedule.", general_notes: "", cleaning_notes: "", status: "waitlist", created_at: "2026-07-24T14:20:00Z", cleaners: [] },
  { id: 2, first_name: "Tom", last_name: "Becker", email: "tom.becker@example.com", phone: "(860) 555-0110", address: "3 Maple Ct, Middletown, CT", message: "3 bed / 2 bath, biweekly if possible. Two cats.", general_notes: "", cleaning_notes: "", status: "new", created_at: "2026-07-25T09:05:00Z", cleaners: [] },
  { id: 3, first_name: "Grace", last_name: "Lin", email: "grace.lin@example.com", phone: "(203) 555-0177", address: "88 Elm St, Berlin, CT", message: "Move-out clean needed by end of month.", general_notes: "", cleaning_notes: "", status: "new", created_at: "2026-07-26T17:42:00Z", cleaners: [] },
  { id: 4, first_name: "Oliver", last_name: "Reyes", email: "oliver.reyes@example.com", phone: "(860) 555-0198", address: "22 Cedar Dr, Rocky Hill, CT", message: "", general_notes: "Left voicemail 7/23, waiting on quote reply.", cleaning_notes: "", status: "contacted", created_at: "2026-07-19T11:15:00Z", cleaners: [] },
  { id: 5, first_name: "Sophie", last_name: "Martin", email: "sophie.martin@example.com", phone: "(860) 555-0123", address: "5 Willow Way, Cromwell, CT", message: "", general_notes: "Prefers Thursdays. Gate code 4417.", cleaning_notes: "Use fragrance-free products. Dog (friendly) is home.", status: "active", created_at: "2026-04-02T13:00:00Z", cleaners: [{ id: "as-501", name: "Maria Alvarez", role: "staff", ref: "s1" }] },
  { id: 6, first_name: "Aaron", last_name: "Keller", email: "aaron.keller@example.com", phone: "(203) 555-0155", address: "40 Oakview Rd, Newington, CT", message: "", general_notes: "Large home, needs two cleaners.", cleaning_notes: "Hardwood throughout — no wet mopping.", status: "active", created_at: "2026-01-18T15:30:00Z", cleaners: [{ id: "as-601", name: "Maria Alvarez", role: "staff", ref: "s1" }, { id: "as-602", name: "James Okoro", role: "staff", ref: "s2" }] },
  { id: 7, first_name: "Wei", last_name: "Chen", email: "wei.chen@example.com", phone: "(860) 555-0166", address: "17 Pinecrest, Cromwell, CT", message: "", general_notes: "", cleaning_notes: "Focus on kitchen + baths.", status: "active", created_at: "2026-05-11T10:10:00Z", cleaners: [] },
  { id: 8, first_name: "Dana", last_name: "Cole", email: "dana.cole@example.com", phone: "(860) 555-0134", address: "9 Sunset Blvd, Portland, CT", message: "", general_notes: "Paused service after moving, may return.", cleaning_notes: "", status: "inactive", created_at: "2025-11-03T12:00:00Z", cleaners: [] },
  { id: 9, first_name: "Marcus", last_name: "Webb", email: "marcus.webb@example.com", phone: "(203) 555-0188", address: "61 Harbor St, Middletown, CT", message: "", general_notes: "No reply to last 3 messages.", cleaning_notes: "", status: "unresponsive", created_at: "2026-02-27T16:45:00Z", cleaners: [] },
  { id: 10, first_name: "Ivy", last_name: "Nakamura", email: "ivy.nakamura@example.com", phone: "(860) 555-0109", address: "2 Lakeshore Dr, Cromwell, CT", message: "", general_notes: "On hold for the summer, resume in September.", cleaning_notes: "", status: "paused", created_at: "2026-03-14T09:20:00Z", cleaners: [] },
  { id: 11, first_name: "Ron", last_name: "Diaz", email: "ron.diaz@example.com", phone: "(860) 555-0101", address: "77 Old Mill Rd, Berlin, CT", message: "", general_notes: "Closed account 2025.", cleaning_notes: "", status: "archived", created_at: "2025-06-30T08:00:00Z", cleaners: [] },
];
const seedStaff = [
  { id: "s1", name: "Maria Alvarez" },
  { id: "s2", name: "James Okoro" },
  { id: "s3", name: "Aisha Patel" },
  { id: "s4", name: "Diego Santos" },
];
const seedAdmins = [
  { id: "a1", name: "Priya Shah" },
  { id: "a2", name: "Owner" },
];
const __db = { clients: seedClients.map((c) => ({ ...c, cleaners: [...c.cleaners] })), staff: seedStaff, admins: seedAdmins };
const __wait = (ms = 160) => new Promise((r) => setTimeout(r, ms));
const __find = (id) => __db.clients.find((c) => String(c.id) === String(id));
const __mockAxios = {
  async get(url) {
    await __wait();
    if (url === "/clients") return { data: __db.clients };
    if (url === "/staff/all") return { data: __db.staff };
    if (url === "/admin/all") return { data: __db.admins };
    const m = url.match(/^\/clients\/([^/]+)\/assignments$/);
    if (m) return { data: { assignments: __find(m[1])?.cleaners || [] } };
    return { data: [] };
  },
  async patch(url, body) {
    await __wait();
    const m = url.match(/^\/clients\/([^/]+)$/);
    if (m) { const c = __find(m[1]); if (c) Object.assign(c, body); return { data: c }; }
    return { data: {} };
  },
  async post(url, body) {
    await __wait();
    const m = url.match(/^\/clients\/([^/]+)\/assign-one$/);
    if (!m) return { data: {} };
    const c = __find(m[1]);
    if (!c) throw { response: { data: { error: "Client not found" } } };
    c.cleaners = c.cleaners || [];
    if (body.staff_id) {
      const s = __db.staff.find((x) => String(x.id) === String(body.staff_id));
      if (s && !c.cleaners.some((a) => a.ref === s.id && a.role === "staff"))
        c.cleaners.push({ id: `as-${Date.now()}`, name: s.name, role: "staff", ref: s.id });
    }
    if (body.admin_id) {
      const a = __db.admins.find((x) => String(x.id) === String(body.admin_id));
      if (a && !c.cleaners.some((x) => x.ref === a.id && x.role === "admin"))
        c.cleaners.push({ id: `aa-${Date.now()}`, name: a.name, role: "admin", ref: a.id });
    }
    return { data: { assignments: c.cleaners } };
  },
  async delete(url) {
    await __wait();
    const am = url.match(/^\/clients\/([^/]+)\/assignments\/([^/]+)$/);
    if (am) { const c = __find(am[1]); if (c) c.cleaners = (c.cleaners || []).filter((a) => String(a.id) !== String(am[2])); return { data: {} }; }
    const cm = url.match(/^\/clients\/([^/]+)$/);
    if (cm) { __db.clients = __db.clients.filter((c) => String(c.id) !== String(cm[1])); return { data: {} }; }
    return { data: {} };
  },
};
function useAdmin() { return { authAxios: __mockAxios }; }
/* ===================== END DEMO MOCK BACKEND ============================== */

const STATUS_ORDER = [
  "waitlist", "new", "contacted", "active",
  "inactive", "unresponsive", "paused", "archived",
];

// Dark-theme accent per status. Every color is tuned to stay legible on navy.
const STATUS_STYLES = {
  waitlist:     { accent: "#37d6d0", label: "Waitlist" },
  new:          { accent: "#5eb8ff", label: "New" },
  contacted:    { accent: "#8b9bff", label: "Contacted" },
  active:       { accent: "#3ddc9a", label: "Active" },
  inactive:     { accent: "#9fb1d6", label: "Inactive" },
  unresponsive: { accent: "#f5c164", label: "Unresponsive" },
  paused:       { accent: "#c08bff", label: "Paused" },
  archived:     { accent: "#8296c2", label: "Archived" },
  other:        { accent: "#9fb1d6", label: "Other" },
};

const displayName = (p) =>
  p?.name ?? [p?.first_name, p?.last_name].filter(Boolean).join(" ") ?? "Unknown";

const initials = (first, last) =>
  ((first?.[0] || "") + (last?.[0] || "")).toUpperCase() || "•";

/* ---- Ambient sparkles (generated once, stable across renders) ---- */
const SPARKLES = Array.from({ length: 30 }, (_, i) => {
  const star = i % 4 === 0;
  return {
    id: i,
    top: +(Math.random() * 100).toFixed(2),
    left: +(Math.random() * 100).toFixed(2),
    size: star ? 8 + Math.round(Math.random() * 12) : 2 + Math.round(Math.random() * 3),
    dur: (3 + Math.random() * 4).toFixed(2),
    delay: (Math.random() * 6).toFixed(2),
    peak: star ? (0.55 + Math.random() * 0.3).toFixed(2) : (0.28 + Math.random() * 0.32).toFixed(2),
    star,
  };
});

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 C12.6 8 16 11.4 22 12 C16 12.6 12.6 16 12 22 C11.4 16 8 12.6 2 12 C8 11.4 11.4 8 12 2 Z" />
    </svg>
  );
}

function Sparkles() {
  return (
    <div className="mc-sparkles" aria-hidden="true">
      {SPARKLES.map((s) => (
        <span
          key={s.id}
          className={`mc-sparkle ${s.star ? "mc-star" : "mc-dot"}`}
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            "--dur": `${s.dur}s`,
            "--delay": `${s.delay}s`,
            "--peak": s.peak,
          }}
        >
          {s.star && <StarGlyph />}
        </span>
      ))}
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="mc-root">
      <ThemeStyle />
      <Sparkles />
      <div className="mc-content">{children}</div>
    </div>
  );
}

/* --------------------------- small form helpers --------------------------- */
function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="mc-field">
      <span className="mc-label">{label}</span>
      <input
        className="mc-input"
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="mc-field">
      <span className="mc-label">{label}</span>
      <textarea
        className="mc-textarea"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/* ------------------------------ EditClient -------------------------------- */
/* Same prop contract as your file: client, updateClientField, handlePhoneChange, saveClient */
function EditClient({ client, updateClientField, handlePhoneChange, saveClient }) {
  return (
    <div className="mc-sub">
      <div className="mc-sub-title">Client details</div>

      <div className="mc-grid2">
        <Field label="First name" value={client.first_name} onChange={(v) => updateClientField("first_name", v)} />
        <Field label="Last name" value={client.last_name} onChange={(v) => updateClientField("last_name", v)} />
      </div>

      <Field label="Email" type="email" value={client.email} onChange={(v) => updateClientField("email", v)} placeholder="name@example.com" />

      <label className="mc-field">
        <span className="mc-label">Phone</span>
        <input className="mc-input" value={client.phone ?? ""} placeholder="(555) 123-4567" onChange={handlePhoneChange} />
      </label>

      <Field label="Address" value={client.address} onChange={(v) => updateClientField("address", v)} placeholder="Street, City, State" />
      <TextArea label="Message" value={client.message} onChange={(v) => updateClientField("message", v)} placeholder="Their original request" />
      <TextArea label="General notes" value={client.general_notes} onChange={(v) => updateClientField("general_notes", v)} placeholder="Internal notes (not shown to client)" />
      <TextArea label="Cleaning notes" value={client.cleaning_notes} onChange={(v) => updateClientField("cleaning_notes", v)} placeholder="Products, access, pets, priorities…" />

      <label className="mc-field">
        <span className="mc-label">Status</span>
        <select className="mc-select" value={client.status ?? ""} onChange={(e) => updateClientField("status", e.target.value)}>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_STYLES[s]?.label || s}</option>
          ))}
        </select>
      </label>

      <button className="mc-btn mc-btn-primary" onClick={saveClient}>Save changes</button>
    </div>
  );
}

/* ---------------------------- AssignCleaners ------------------------------ */
/* Same prop contract as your file: client, staff, admins, onAssign, onRemove */
function AssignCleaners({ client, staff, admins, onAssign, onRemove }) {
  const [sel, setSel] = useState("");
  const assigned = client.cleaners || [];

  const handleAssign = () => {
    if (!sel) return;
    const [role, id] = sel.split(":");
    onAssign(role === "staff" ? { staff_id: id } : { admin_id: id });
    setSel("");
  };

  return (
    <div className="mc-sub">
      <div className="mc-sub-title">Assigned cleaners</div>

      {assigned.length === 0 ? (
        <p className="mc-empty">No cleaners assigned yet.</p>
      ) : (
        <div className="mc-chips">
          {assigned.map((a) => {
            const name = displayName(a);
            const role = a.role ?? (a.staff_id ? "staff" : "admin");
            return (
              <span className="mc-chip" key={a.id}>
                <span className="mc-chip-name">{name}</span>
                <span className="mc-chip-role">{role}</span>
                <button className="mc-chip-x" onClick={() => onRemove(a.id)} aria-label={`Remove ${name}`}>×</button>
              </span>
            );
          })}
        </div>
      )}

      <div className="mc-assign-row">
        <select className="mc-select" value={sel} onChange={(e) => setSel(e.target.value)}>
          <option value="">Add a cleaner…</option>
          {staff.length > 0 && (
            <optgroup label="Staff">
              {staff.map((s) => (
                <option key={s.id} value={`staff:${s.id}`}>{displayName(s)}</option>
              ))}
            </optgroup>
          )}
          {admins.length > 0 && (
            <optgroup label="Admins">
              {admins.map((a) => (
                <option key={a.id} value={`admin:${a.id}`}>{displayName(a)}</option>
              ))}
            </optgroup>
          )}
        </select>
        <button className="mc-btn mc-btn-primary mc-assign-btn" onClick={handleAssign}>Assign</button>
      </div>
    </div>
  );
}

/* ================================ PAGE ==================================== */
export default function ManageClients() {
  const { authAxios } = useAdmin();

  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const len = digits.length;
    if (len === 0) return "";
    if (len < 4) return `(${digits}`;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (e) =>
    setSelectedClient({ ...selectedClient, phone: formatPhone(e.target.value) });

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [clientsRes, staffRes, adminsRes] = await Promise.all([
        authAxios.get("/clients"),
        authAxios.get("/staff/all"),
        authAxios.get("/admin/all"),
      ]);
      setClients(clientsRes.data || []);
      setStaff(staffRes.data || []);
      setAdmins(adminsRes.data || []);
    } catch (err) {
      setError("Failed to load clients or staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateClientField = (field, value) =>
    setSelectedClient({ ...selectedClient, [field]: value });

  const saveClient = async () => {
    try {
      await authAxios.patch(`/clients/${selectedClient.id}`, {
        first_name: selectedClient.first_name,
        last_name: selectedClient.last_name,
        email: selectedClient.email,
        phone: selectedClient.phone,
        address: selectedClient.address,
        message: selectedClient.message,
        general_notes: selectedClient.general_notes,
        cleaning_notes: selectedClient.cleaning_notes,
        status: selectedClient.status,
      });
      fetchAll();
      alert("Client updated");
    } catch (err) {
      alert("Failed to update client");
    }
  };

  const deleteClient = async () => {
    if (!selectedClient) return;
    const confirmed = window.confirm(
      `Permanently delete ${selectedClient.first_name} ${selectedClient.last_name}?\n\nThis also removes their assignments and schedules. This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await authAxios.delete(`/clients/${selectedClient.id}`);
      setSelectedClient(null);
      await fetchAll();
      alert("Client deleted successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete client");
    }
  };

  const assignCleaner = async ({ staff_id = null, admin_id = null }) => {
    if (!selectedClient) return;
    try {
      await authAxios.post(`/clients/${selectedClient.id}/assign-one`, { staff_id, admin_id });
      const res = await authAxios.get(`/clients/${selectedClient.id}/assignments`);
      setSelectedClient({ ...selectedClient, cleaners: res.data.assignments });
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign cleaner");
    }
  };

  const removeAssignment = async (assignmentId) => {
    try {
      await authAxios.delete(`/clients/${selectedClient.id}/assignments/${assignmentId}`);
      const res = await authAxios.get(`/clients/${selectedClient.id}/assignments`);
      setSelectedClient({ ...selectedClient, cleaners: res.data.assignments });
    } catch (err) {
      alert("Failed to remove assignment");
    }
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    const searchDigits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      const phoneDigits = (c.phone || "").replace(/\D/g, "");
      return (
        c.first_name?.toLowerCase().includes(q) ||
        c.last_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q) ||
        (searchDigits && phoneDigits.includes(searchDigits))
      );
    });
  }, [clients, searchTerm]);

  const groupedClients = useMemo(() => {
    const g = STATUS_ORDER.reduce((acc, status) => {
      acc[status] = filteredClients.filter(
        (c) => (c.status || "").toLowerCase() === status
      );
      return acc;
    }, {});
    g.other = filteredClients.filter(
      (c) => !STATUS_ORDER.includes((c.status || "").toLowerCase())
    );
    return g;
  }, [filteredClients]);

  // Close the panel if the selected client scrolls out of the filtered set.
  useEffect(() => {
    if (selectedClient && !filteredClients.some((c) => c.id === selectedClient.id)) {
      setSelectedClient(null);
    }
  }, [filteredClients, selectedClient]);

  if (loading) {
    return (
      <Shell>
        <div className="mc-state">
          <div className="mc-spinner" />
          <p>Loading clients…</p>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="mc-state">
          <p className="mc-state-title">Something went wrong</p>
          <p className="mc-state-sub">{error}</p>
          <button className="mc-btn mc-btn-primary mc-state-btn" onClick={fetchAll}>Try again</button>
        </div>
      </Shell>
    );
  }

  const sections = [...STATUS_ORDER, "other"];

  return (
    <Shell>
      <header className="mc-header">
        <div className="mc-eyebrow">
          <StarGlyph /> Client roster
        </div>
        <h1 className="mc-title">All Clients</h1>
        <p className="mc-subtitle">Search, organize by pipeline stage, and manage every account.</p>
      </header>

      <div className="mc-controls">
        <div className="mc-search-wrap">
          <svg className="mc-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="mc-search"
            type="text"
            placeholder="Search by name, email, phone, or status…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <p className="mc-count">
          Showing <strong>{filteredClients.length}</strong> of {clients.length} clients
        </p>
      </div>

      {filteredClients.length === 0 ? (
        <div className="mc-state">
          <p className="mc-state-title">No matches</p>
          <p className="mc-state-sub">Nothing matches “{searchTerm}”. Try a different name, email, or status.</p>
        </div>
      ) : (
        <div className="mc-sections">
          {sections.map((status) => {
            const list = groupedClients[status];
            if (!list || list.length === 0) return null;
            const style = STATUS_STYLES[status] || STATUS_STYLES.other;

            return (
              <section key={status} className="mc-section" style={{ "--accent": style.accent }}>
                <div className="mc-section-head">
                  <span className="mc-section-dot" />
                  <span className="mc-section-title">{style.label}</span>
                  <span className="mc-section-count">{list.length}</span>
                </div>

                <div className="mc-grid">
                  {list.map((client) => {
                    const isOpen = selectedClient?.id === client.id;
                    return (
                      <article
                        key={client.id}
                        className={`mc-card${isOpen ? " open" : ""}`}
                        style={{ "--accent": style.accent }}
                      >
                        <button
                          className="mc-card-btn"
                          onClick={() => setSelectedClient(isOpen ? null : client)}
                        >
                          <span className="mc-avatar">{initials(client.first_name, client.last_name)}</span>
                          <span className="mc-card-main">
                            <span className="mc-card-name">
                              {client.first_name} {client.last_name}
                            </span>
                            <span className="mc-card-meta">
                              <span className="mc-status-chip">{STATUS_STYLES[status]?.label || client.status}</span>
                              <span className="mc-card-date">Added {formatDate(client.created_at)}</span>
                            </span>
                          </span>
                          <span className="mc-edit-tag">
                            {isOpen ? "Close" : "Edit"}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`mc-chevron${isOpen ? " up" : ""}`} aria-hidden="true">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </span>
                        </button>

                        {isOpen && (
                          <div className="mc-panel">
                            <EditClient
                              client={selectedClient}
                              updateClientField={updateClientField}
                              handlePhoneChange={handlePhoneChange}
                              saveClient={saveClient}
                            />
                            <AssignCleaners
                              client={selectedClient}
                              staff={staff}
                              admins={admins}
                              onAssign={assignCleaner}
                              onRemove={removeAssignment}
                            />
                            <div className="mc-danger-zone">
                              <button className="mc-btn mc-btn-danger" onClick={deleteClient}>
                                Delete client
                              </button>
                              <p className="mc-note">
                                Permanently removes the client, their assignments, and schedules.
                              </p>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

/* ================================ STYLES ================================== */
function ThemeStyle() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.mc-root *, .mc-root *::before, .mc-root *::after { box-sizing: border-box; }

.mc-root {
  --text: #eef3fb;
  --text-2: #b1c0dc;
  --text-3: #8395ba;
  --surface: rgba(255,255,255,0.045);
  --surface-2: rgba(255,255,255,0.075);
  --border: rgba(150,172,228,0.15);
  position: relative;
  min-height: 100vh;
  margin: 0;
  color: var(--text);
  font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  background:
    radial-gradient(1200px 620px at 50% -12%, rgba(58,120,220,0.24), transparent 60%),
    radial-gradient(900px 520px at 100% 4%, rgba(96,72,196,0.14), transparent 55%),
    radial-gradient(760px 520px at 0% 22%, rgba(40,110,190,0.12), transparent 55%),
    linear-gradient(180deg, #0b1730 0%, #0a1226 46%, #070d1d 100%);
}

/* ---- sparkle field ---- */
.mc-sparkles { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.mc-sparkle { position: absolute; animation: mc-float var(--dur, 4s) ease-in-out var(--delay, 0s) infinite; will-change: transform, opacity; }
.mc-dot {
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.95), rgba(178,214,255,0.35) 55%, transparent 72%);
}
.mc-star { color: rgba(222,236,255,0.92); filter: drop-shadow(0 0 4px rgba(150,200,255,0.55)); }
.mc-star svg { display: block; width: 100%; height: 100%; fill: currentColor; }
@keyframes mc-float {
  0%   { opacity: .12; transform: translateY(0) scale(.7) rotate(0deg); }
  50%  { opacity: var(--peak, .7); transform: translateY(-14px) scale(1) rotate(10deg); }
  100% { opacity: .12; transform: translateY(-28px) scale(.7) rotate(0deg); }
}

.mc-content { position: relative; z-index: 1; padding: 0 16px 72px; }

/* ---- header ---- */
.mc-header { text-align: center; padding: 46px 8px 6px; max-width: 720px; margin: 0 auto; }
.mc-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; letter-spacing: .26em; text-transform: uppercase;
  color: #8ec2ff; margin-bottom: 12px;
}
.mc-eyebrow svg { width: 13px; height: 13px; fill: #8ec2ff; filter: drop-shadow(0 0 5px rgba(120,180,255,.6)); }
.mc-title {
  margin: 0;
  font-size: clamp(30px, 5.2vw, 46px);
  font-weight: 800; letter-spacing: -.025em; line-height: 1.05;
  color: #f6f9ff;
  text-shadow: 0 2px 26px rgba(40,90,180,.5);
}
.mc-subtitle { margin: 12px 0 0; color: var(--text-2); font-size: 15px; }

/* ---- controls ---- */
.mc-controls { max-width: 640px; margin: 26px auto 0; }
.mc-search-wrap { position: relative; }
.mc-search-icon {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  width: 19px; height: 19px; color: var(--text-3); pointer-events: none;
}
.mc-search {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  color: var(--text);
  font: inherit; font-size: 15px;
  padding: 15px 18px 15px 46px;
  outline: none;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.mc-search::placeholder { color: #8295b9; }
.mc-search:focus {
  border-color: rgba(120,182,255,.6);
  background: var(--surface-2);
  box-shadow: 0 0 0 4px rgba(90,162,255,.16);
}
.mc-count { text-align: center; margin: 14px 0 0; font-size: 13px; color: var(--text-3); }
.mc-count strong { color: var(--text); font-weight: 700; }

/* ---- sections ---- */
.mc-sections { max-width: 1180px; margin: 36px auto 0; }
.mc-section + .mc-section { margin-top: 34px; }
.mc-section-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; margin-bottom: 18px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--accent) 9%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  border-left: 3px solid var(--accent);
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.mc-section-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 80%, transparent);
}
.mc-section-title {
  font-size: 14px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
  color: color-mix(in srgb, var(--accent) 80%, white);
}
.mc-section-count {
  margin-left: auto;
  font-size: 12.5px; font-weight: 700;
  padding: 4px 13px; border-radius: 999px;
  color: color-mix(in srgb, var(--accent) 82%, white);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

/* ---- grid + cards ---- */
.mc-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 900px) { .mc-grid { grid-template-columns: 1fr 1fr; } }

.mc-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 12px 34px -22px rgba(0,0,0,.75);
  transition: transform .28s cubic-bezier(.2,.7,.2,1), border-color .28s, box-shadow .28s;
}
.mc-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: 0 20px 44px -22px rgba(0,0,0,.8), 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent);
}
.mc-card.open {
  transform: none;
  border-color: color-mix(in srgb, var(--accent) 52%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent), 0 24px 54px -26px rgba(0,0,0,.85);
}
.mc-card.open:hover { transform: none; }

.mc-card-btn {
  width: 100%; text-align: left; cursor: pointer;
  background: none; border: none; color: inherit; font: inherit;
  padding: 18px 20px; display: flex; align-items: center; gap: 14px;
}
.mc-avatar {
  flex: 0 0 auto; width: 46px; height: 46px; border-radius: 14px;
  display: grid; place-items: center;
  font-weight: 700; font-size: 15px; letter-spacing: .02em;
  color: color-mix(in srgb, var(--accent) 88%, white);
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
.mc-card-main { flex: 1 1 auto; min-width: 0; }
.mc-card-name {
  display: block; font-size: 16.5px; font-weight: 700; letter-spacing: -.01em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mc-card-meta { display: flex; align-items: center; gap: 10px; margin-top: 6px; flex-wrap: wrap; }
.mc-status-chip {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  padding: 3px 10px; border-radius: 999px;
  color: color-mix(in srgb, var(--accent) 88%, white);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent);
}
.mc-card-date { font-size: 12px; color: var(--text-3); }
.mc-edit-tag {
  flex: 0 0 auto; margin-left: 6px;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13.5px; font-weight: 700; color: #8ec2ff;
}
.mc-chevron { width: 15px; height: 15px; transition: transform .28s ease; }
.mc-chevron.up { transform: rotate(180deg); }

/* ---- expanded panel ---- */
.mc-panel {
  border-top: 1px solid var(--border);
  padding: 22px 20px;
  display: flex; flex-direction: column; gap: 24px;
  animation: mc-panel-in .34s ease;
}
@keyframes mc-panel-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

.mc-sub { display: flex; flex-direction: column; gap: 14px; }
.mc-sub-title {
  font-size: 13px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-2);
  padding-bottom: 10px; border-bottom: 1px solid var(--border);
}

.mc-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 520px) { .mc-grid2 { grid-template-columns: 1fr; } }

.mc-field { display: flex; flex-direction: column; gap: 7px; }
.mc-label { font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--text-2); }

.mc-input, .mc-textarea, .mc-select {
  width: 100%;
  background: rgba(8,15,32,.55);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font: inherit; font-size: 14.5px;
  padding: 11px 13px;
  outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.mc-input::placeholder, .mc-textarea::placeholder { color: #7488ad; }
.mc-input:focus, .mc-textarea:focus, .mc-select:focus {
  border-color: rgba(120,182,255,.6);
  background: rgba(11,19,40,.72);
  box-shadow: 0 0 0 3px rgba(90,162,255,.16);
}
.mc-textarea { resize: vertical; min-height: 74px; line-height: 1.5; }
.mc-select {
  appearance: none; -webkit-appearance: none; cursor: pointer;
  padding-right: 36px;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239fb1d6' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat; background-position: right 12px center;
}
.mc-select option, .mc-select optgroup { background: #0f1d3a; color: var(--text); }

/* ---- buttons ---- */
.mc-btn {
  width: 100%; cursor: pointer;
  border: 1px solid transparent; border-radius: 14px;
  font: inherit; font-size: 14.5px; font-weight: 700;
  padding: 12px 16px;
  transition: transform .12s ease, box-shadow .2s, background .2s, border-color .2s, filter .2s;
}
.mc-btn:active { transform: translateY(1px); }
.mc-btn-primary {
  color: #fff;
  background: linear-gradient(180deg, #3f8cf6, #2563eb);
  box-shadow: 0 12px 26px -14px rgba(37,99,235,.95);
}
.mc-btn-primary:hover { filter: brightness(1.07); box-shadow: 0 16px 32px -14px rgba(37,99,235,1); }
.mc-btn-danger {
  color: #ff9aa2;
  background: rgba(220,64,74,.12);
  border-color: rgba(240,84,94,.38);
}
.mc-btn-danger:hover { color: #ffb4ba; background: rgba(220,64,74,.2); border-color: rgba(240,84,94,.58); }

/* ---- assign ---- */
.mc-empty { margin: 0; font-size: 13.5px; color: var(--text-3); font-style: italic; }
.mc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 8px 6px 13px; border-radius: 999px;
  background: var(--surface-2); border: 1px solid var(--border);
  font-size: 13px;
}
.mc-chip-name { font-weight: 600; }
.mc-chip-role { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); }
.mc-chip-x {
  width: 20px; height: 20px; border-radius: 50%; border: none; cursor: pointer;
  display: grid; place-items: center; line-height: 1; font-size: 14px;
  background: rgba(255,255,255,.08); color: var(--text-2);
  transition: background .18s, color .18s;
}
.mc-chip-x:hover { background: rgba(240,84,94,.26); color: #ffb4ba; }
.mc-assign-row { display: flex; gap: 10px; }
.mc-assign-row .mc-select { flex: 1; }
.mc-assign-btn { width: auto; flex: 0 0 auto; padding: 11px 20px; }

/* ---- danger zone ---- */
.mc-danger-zone { border-top: 1px solid var(--border); padding-top: 20px; }
.mc-note { margin: 10px 0 0; text-align: center; font-size: 12px; color: var(--text-3); }

/* ---- states ---- */
.mc-state { min-height: 56vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--text-2); }
.mc-state-title { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); }
.mc-state-sub { margin: 0; font-size: 14px; color: var(--text-3); max-width: 380px; }
.mc-state-btn { width: auto; margin-top: 8px; padding: 11px 22px; }
.mc-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(140,172,232,.22); border-top-color: #5eb8ff;
  animation: mc-spin .9s linear infinite; margin-bottom: 6px;
}
@keyframes mc-spin { to { transform: rotate(360deg); } }

/* ---- scrollbar ---- */
.mc-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.mc-root ::-webkit-scrollbar-thumb { background: rgba(140,168,224,.25); border-radius: 999px; }
.mc-root ::-webkit-scrollbar-track { background: transparent; }

/* ---- accessibility: honor reduced motion ---- */
@media (prefers-reduced-motion: reduce) {
  .mc-sparkle { animation: none !important; opacity: .34 !important; transform: none !important; }
  .mc-card, .mc-panel, .mc-btn, .mc-chevron, .mc-spinner { animation: none !important; transition: none !important; }
}
`}</style>
  );
}