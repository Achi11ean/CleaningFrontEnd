import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";
import StaffClock from "./StaffClock";
import AdminWeekly from "./AdminWeekly";
import AdminWorkDay from "./AdminWorkDay";
import UserProfile from "./UserProfile";
import AdminAllProfiles from "./AdminAllProfiles";
import ManageClients from "./ManageClients";
import ClientSchedulesAdmin from "./ClientSchedulesAdmin";
import CreateSchedules from "./CreateSchedules";
import ClientSchedulesCalendar from "./ClientSchedulesCalendar";
import CreateServices from "./CreateServices";
import ManageServices from "./ManageServices";

import AdminShifts from "./AdminShifts";
export default function AdminDashboard() {
  const { authAxios, admin } = useAdmin();
const [activeTab, setActiveTab] = useState("clients");
const [profileSubTab, setProfileSubTab] = useState("me"); // "me" | "all"
 const [clientsSubTab, setClientsSubTab] = useState("list"); 
const [shiftsSubTab, setShiftsSubTab] = useState("me"); // "me" | "all"
const [workDaySubTab, setWorkDaySubTab] = useState("workday"); 
const [servicesSubTab, setServicesSubTab] = useState("create"); 
// "create" | "manage"

// "workday" | "staff"

  const [staff, setStaff] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const activateStaff = async (id) => {
  await authAxios.patch(`/staff/${id}/activate`);
  loadStaff();
};

const deactivateStaff = async (id) => {
  await authAxios.patch(`/staff/${id}/deactivate`);
  loadStaff();
};

const deleteStaff = async (id) => {
  const ok = window.confirm("Are you sure you want to permanently delete this staff user?");
  if (!ok) return;

  await authAxios.delete(`/staff/${id}`);
  loadStaff();
};

  // Fetch staff
  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAxios.get("/staff/all");
      setStaff(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  // Fetch admins
  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAxios.get("/admin/all");
      setAdmins(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  // Load default tab on mount
  useEffect(() => {
    if (activeTab === "staff") loadStaff();
    if (activeTab === "admins") loadAdmins();
  }, [activeTab]);


  const updateRole = async (id, role) => {
  await authAxios.patch(`/staff/${id}/role`, { role });
  loadStaff();
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-sky-100 pt-24 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Logged in as <span className="font-semibold">{admin?.username}</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b mb-6">
            <button
  onClick={() => setActiveTab("clients")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "clients"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧾 Clients
</button>
<button
  onClick={() => {
    setActiveTab("workday");
    setWorkDaySubTab("workday"); // default subtab
  }}

  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "workday"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🟢 Work Day
</button>
<button
  onClick={() => {
    setActiveTab("shifts");
    setShiftsSubTab("me");
  }}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "shifts"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧾 Shifts
</button>

            <button
  onClick={() => {
    setActiveTab("profile");
    setProfileSubTab("me");
  }}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "profile"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  👤 Profile
</button>

          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "staff"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Employees
          </button>

          <button
            onClick={() => setActiveTab("admins")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "admins"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Admins
          </button>
          <button
  onClick={() => setActiveTab("time")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "time"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  ⏱️ Staff Time
</button>
<button
  onClick={() => {
    setActiveTab("services");
    setServicesSubTab("create");
  }}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "services"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧰 Services
</button>


        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-10 text-gray-500 font-semibold">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-red-600 font-semibold">
            {error}
          </div>
        )}
{activeTab === "clients" && (
  <>
    {/* Clients Sub Tabs */}
<div className="flex space-x-4 border-b mb-6 mt-4">
  <button
    onClick={() => setClientsSubTab("list")}
    className={`px-3 py-2 font-semibold border-b-2 transition ${
      clientsSubTab === "list"
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    🧾 Client List
  </button>

  <button
    onClick={() => setClientsSubTab("schedules")}
    className={`px-3 py-2 font-semibold border-b-2 transition ${
      clientsSubTab === "schedules"
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    📅 Schedules
  </button>

  <button
    onClick={() => setClientsSubTab("create")}
    className={`px-3 py-2 font-semibold border-b-2 transition ${
      clientsSubTab === "create"
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    ➕ Create Schedule
  </button>
</div>

    {/* Clients Sub Content */}
    {!loading && !error && clientsSubTab === "list" && (
      <ManageClients />
    )}
{!loading && !error && clientsSubTab === "create" && (
  <CreateSchedules />
)}



    {!loading && !error && clientsSubTab === "schedules" && (
      <ClientSchedulesAdmin />
    )}
  </>
)}



{activeTab === "services" && (
  <>
    {/* Services Sub Tabs */}
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
        onClick={() => setServicesSubTab("create")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          servicesSubTab === "create"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        ➕ Create
      </button>

      <button
        onClick={() => setServicesSubTab("manage")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          servicesSubTab === "manage"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🛠️ Manage
      </button>
    </div>

    {/* Services Sub Content */}
    {!loading && !error && servicesSubTab === "create" && (
      <CreateServices />
    )}

    {!loading && !error && servicesSubTab === "manage" && (
      <ManageServices />
    )}
  </>
)}

{activeTab === "workday" && (
  <>
    {/* Work Day Sub Tabs */}
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
        onClick={() => setWorkDaySubTab("workday")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          workDaySubTab === "workday"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🟢 Work Day
      </button>

      <button
        onClick={() => setWorkDaySubTab("staff")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          workDaySubTab === "staff"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        👥 Staff
      </button>
    </div>

    {/* Work Day Sub Content */}
    {!loading && !error && workDaySubTab === "workday" && (
      <ClientSchedulesCalendar />
    )}

    {!loading && !error && workDaySubTab === "staff" && (
      <AdminWorkDay />
    )}
  </>
)}

{activeTab === "shifts" && (
  <>
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
        onClick={() => setShiftsSubTab("me")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          shiftsSubTab === "me"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🙋 My Shifts
      </button>

      <button
        onClick={() => setShiftsSubTab("all")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          shiftsSubTab === "all"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        👥 All Shifts
      </button>

    </div>

    {!loading && !error && shiftsSubTab === "me" && (
      <AdminShifts mode="me" />
    )}

    {!loading && !error && shiftsSubTab === "all" && (
      <AdminShifts mode="all" />
    )}
  </>
)}

{activeTab === "profile" && (
  <div className="flex space-x-4 border-b mb-6 mt-4">
    <button
      onClick={() => setProfileSubTab("me")}
      className={`px-3 py-2 font-semibold border-b-2 transition ${
        profileSubTab === "me"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      🙋 My Profile
    </button>

    <button
      onClick={() => setProfileSubTab("all")}
      className={`px-3 py-2 font-semibold border-b-2 transition ${
        profileSubTab === "all"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      👥 All Profiles
    </button>
  </div>
)}
{activeTab === "profile" && profileSubTab === "me" && <UserProfile />}

{activeTab === "profile" && profileSubTab === "all" && <AdminAllProfiles />}

  {!loading && !error && activeTab === "staff" && (
<StaffTable
  staff={staff}
  onActivate={activateStaff}
  onDeactivate={deactivateStaff}
  onDelete={deleteStaff}
  onUpdateRole={updateRole}   // 👈 NEW
/>

)}


        {!loading && !error && activeTab === "admins" && (
          <AdminTable admins={admins} />
        )}


        {!loading && !error && activeTab === "time" && (
  <AdminWeekly />
)}

      </div>
    </div>
  );
}

/* ===================== */
/* Employees Table */
/* ===================== */

function StaffTable({ staff, onActivate, onDeactivate, onDelete, onUpdateRole }) {
  if (staff.length === 0) {
    return <p className="text-center text-gray-500">No staff found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
       <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
  <tr><th className="px-4 py-3 text-left">Username</th>
    <th className="px-4 py-3 text-left">Email</th>
    <th className="px-4 py-3 text-left">Role</th>
    <th className="px-4 py-3 text-left">Status</th>
    <th className="px-4 py-3 text-left">Created</th>
    <th className="px-4 py-3 text-left">Actions</th>
  </tr>
</thead>

        <tbody className="divide-y">
          {staff.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold">{s.username}</td>
              <td className="px-4 py-3">{s.email}</td>
<td className="px-4 py-3">
  <select
    value={s.role}
    onChange={(e) => onUpdateRole(s.id, e.target.value)}
    className="px-2 py-1 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-blue-400"
  >
    <option value="staff">Staff</option>
    <option value="manager">Manager</option>
  </select>
</td>
        
              <td className="px-4 py-3">
                {s.is_active ? (
                  <span className="text-green-600 font-semibold">✅ Active</span>
                ) : (
                  <span className="text-orange-600 font-semibold">⏳ Pending</span>
                )}
              </td>

              <td className="px-4 py-3 text-sm text-gray-500">
                {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}
              </td>

              {/* 🔧 ACTIONS */}
              <td className="px-4 py-3 space-x-2">
                {s.is_active ? (
                  <button
                    onClick={() => onDeactivate(s.id)}
                    className="px-3 py-1 text-sm rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => onActivate(s.id)}
                    className="px-3 py-1 text-sm rounded bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    Activate
                  </button>
                )}

                <button
                  onClick={() => onDelete(s.id)}
                  className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===================== */
/* Admins Table */
/* ===================== */

function AdminTable({ admins }) {
  if (admins.length === 0) {
    return <p className="text-center text-gray-500">No admins found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
       <thead className="bg-gray-100 text-gray-700 text-sm uppercase">
  <tr><th className="px-4 py-3 text-left">Username</th>
    <th className="px-4 py-3 text-left">Email</th>
    <th className="px-4 py-3 text-left">Active</th>
    <th className="px-4 py-3 text-left">Last Login</th>
    <th className="px-4 py-3 text-left">Created</th>
  </tr>
</thead>

        <tbody className="divide-y">
          {admins.map((a) => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-semibold">{a.username}</td>
              <td className="px-4 py-3">{a.email}</td>
              <td className="px-4 py-3">
                {a.is_active ? "✅ Active" : "❌ Disabled"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "Never"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
