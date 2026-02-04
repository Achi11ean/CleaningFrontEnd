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
import ManageReviews from "./ManageReviews";
import CreateTimeOffRequest from "./CreateTimeOffRequest";
import ViewMyTimeOffRequests from "./ViewMyTimeOffRequests";
import BossTimeOff from "./BossTimeOff";
import ManageAvailability from "./ManageAvailability";
import CreateConsultation from "./CreateConsultation";
import CreateSection from "./CreateSection";
import CreateConsultItem from "./CreateConsultItem";
import CreateMultiplier from "./CreateMultiplier";
import ConductConsultation from "./ConductConsultation";
import ConsultationSelector from "./ConsultationSelector";
import CreateIntensity from "./CreateIntensity";
import ConsultationList from "./ConsultationList";
import ViewConsultation from "./ViewConsultation";
import ManageConsults from "./ManageConsults";
import ManageIntensity from "./ManageIntensity";
import ManageMultipliers from "./ManageMultipliers";
import AdminWorkShifts from "./AdminWorkShifts";
import ManageSectionsItems from "./ManageSectionsItems";
import Booking from "./Booking";
import CreateInventoryItem from "./CreateInventoryItem";
import ManageInventory from "./ManageInventory";
import ControlStaffInventory from "./ControlStaffInventory";
import StaffInventoryOverview from "./StaffInventoryOverview";
import ManagerRequests from "./Requests";
import axios from "axios";
import "./App.css";
import CreatePurchase from "./CreatePurchase";
import ManagePurchases from "./ManagePurchases";
import AdminShifts from "./AdminShifts";
import ManualTimeEntry from "./ManualTimeEntry";

export default function AdminDashboard() {
  const { authAxios, admin } = useAdmin();
const [activeTab, setActiveTab] = useState("clients");
const [profileSubTab, setProfileSubTab] = useState("me"); // "me" | "all"
 const [clientsSubTab, setClientsSubTab] = useState("list"); 
const [shiftsSubTab, setShiftsSubTab] = useState("me"); // "me" | "all"
const [workDaySubTab, setWorkDaySubTab] = useState("workday"); 
const [servicesSubTab, setServicesSubTab] = useState("create");
const [usersSubTab, setUsersSubTab] = useState("staff"); // "staff" | "admins"
const [consultationsSubTab, setConsultationsSubTab] = useState("create");
const [inventorySubTab, setInventorySubTab] = useState("create");
const [activeConsultationId, setActiveConsultationId] = useState(null);
const [clientsListMode, setClientsListMode] = useState("all"); 
const [newClientCount, setNewClientCount] = useState(0);
const [purchaseSubTab, setPurchaseSubTab] = useState("history"); // "create" | "history"

const [newRequestCount, setNewRequestCount] = useState(0);
useEffect(() => {
  authAxios.get("/clients").then((res) => {
    const count = res.data.filter((c) => c.status === "new").length;
    setNewClientCount(count);
  });
}, []);


useEffect(() => {
  authAxios.get("/client-requests").then((res) => {
    const count = res.data.filter((r) => r.status === "new").length;
    setNewRequestCount(count);
  });
}, []);

const [consultSetupTab, setConsultSetupTab] = useState("consultation");
const [timeSubTab, setTimeSubTab] = useState("weekly"); // weekly | manual

const [consultSetupMode, setConsultSetupMode] = useState("create");
// create | manage

const [timeOffSubTab, setTimeOffSubTab] = useState("manage");
useEffect(() => {
  if (activeTab !== "time") {
    setTimeSubTab("weekly");
  }
}, [activeTab]);


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

useEffect(() => {
  if (activeTab !== "workday") {
    setWorkDaySubTab("workday"); // reset to default
        setInventorySubTab("create"); // 👈 reset inventory

  }
}, [activeTab]);

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



  const updateRole = async (id, role) => {
  await authAxios.patch(`/staff/${id}/role`, { role });
  loadStaff();
};




  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-400 via-white to-slate-400 pt-24 ">
      <div className="max-w-6xl text-center mx-auto bg-white rounded-none shadow-2xl border border-gray-200">

        {/* Header */}    <h2
  className="
    pt-4 text-7xl lg:text-8xl
    font-extrabold font-[Aspire]   tracking-tight text-center
    relative
    bg-gradient-to-br from-blue-600 via-cyan-400 to-blue-600
text-white
    drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]
    border-b-2 border-white/70
    shadow-[inset_0_2px_4px_rgba(255,255,255,0.35)]
  "
>Welcome Back, {" "} Amanda!
</h2>

        <div className="mb-8  flex items-center justify-between">
          <div>

          </div>
        </div>



<div className="px-2 py-2">
<div
  className="
    grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-3 
    border-b border-gray-200 pb-4 mb-8
  "
>
  {[
    { key: "clients", label: "Clients", color: "blue" },
    { key: "workday", label: "Work", color: "blue", subTab: "workday" },
    { key: "consultations", label: "Consults", color: "blue", subTab: "create" },
    { key: "shifts", label: "Shifts", color: "blue", subTab: "me" },
    { key: "profile", label: "Profile", color: "blue", subTab: "me" },
    { key: "time", label: "Time", color: "blue" },
    { key: "services", label: "Services", color: "blue", subTab: "create" },
    { key: "reviews", label: "Reviews", color: "blue" },
    { key: "timeoff", label: "Off", color: "rose", subTab: "manage" },
  ].map(({ key, label, color, subTab }) => (
    <button
      key={key}
      onClick={() => {
        setActiveTab(key);
        if (key === "workday") setWorkDaySubTab(subTab);
        if (key === "consultations") setConsultationsSubTab(subTab);
        if (key === "shifts") setShiftsSubTab(subTab);
        if (key === "profile") setProfileSubTab(subTab);
        if (key === "services") setServicesSubTab(subTab);
        if (key === "timeoff") setTimeOffSubTab(subTab);
      }}
      className={`w-full px-4 py-1 text-lg font-semibold rounded-xl text-center transition-all duration-200
        ${
          activeTab === key
            ? `bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 text-white border border-${color}-300 shadow-sm`
            : "bg-gradient-to-br from-slate-700 via-slate-700 to-black text-white hover:brightness-110"
        }
      `}
    >
      {label}
    </button>
  ))}
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
     Clients
  </button>

  <button
    onClick={() => setClientsSubTab("schedules")}
    className={`px-3 py-2 font-semibold border-b-2 transition ${
      clientsSubTab === "schedules"
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    Schedules
  </button>

  <button
    onClick={() => setClientsSubTab("create")}
    className={`px-3 py-2 font-semibold border-b-2 transition ${
      clientsSubTab === "create"
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    Create
  </button>
</div>

    {/* Clients Sub Content */}
   {!loading && !error && clientsSubTab === "list" && (
  <>
    {/* Third-level tabs inside Clients > Clients */}
    <div className="flex space-x-4 border-b mb-4 mt-2">
<button
  onClick={() => setClientsListMode("all")}
  className={`relative px-3 py-2 text-sm font-semibold border-b-2 transition ${
    clientsListMode === "all"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  All Clients
  {newClientCount > 0 && (
    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
      {newClientCount}
    </span>
  )}
</button>


<button
  onClick={() => setClientsListMode("requests")}
  className={`relative px-3 py-2 text-sm font-semibold border-b-2 transition ${
    clientsListMode === "requests"
      ? "border-purple-600 text-purple-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
Requests
  {newRequestCount > 0 && (
    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
      {newRequestCount}
    </span>
  )}
</button>

    </div>

    {/* Content for each */}
    {clientsListMode === "all" && <ManageClients />}
    {clientsListMode === "requests" && <ManagerRequests />}
  </>
)}

{!loading && !error && clientsSubTab === "create" && (
  <>
    <CreateSchedules />
    <br/>
        <Booking />

  </>
)}



    {!loading && !error && clientsSubTab === "schedules" && (
      <ClientSchedulesAdmin />
    )}
  </>
)}




{activeTab === "consultations" && (
  <>
    {/* Consultations Sub Tabs */}
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
  onClick={() => setConsultationsSubTab("new")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    consultationsSubTab === "new"
      ? "border-green-600 text-green-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  Begin
</button>

<button
  onClick={() => setConsultationsSubTab("create")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    consultationsSubTab === "create"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  Tools
</button>


<button
  onClick={() => setConsultationsSubTab("list")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    consultationsSubTab === "list"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  All
</button>

    </div>
{consultationsSubTab === "create" && (
  <div className="space-y-6">

    {/* PRIMARY SETUP TABS */}
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {[
  ["consultation", "Consultation"],
  ["modules", "Modules"],     
  ["intensities", "Intensities"],
  ["multipliers", "Multipliers"],
]
.map(([key, label]) => (
        <button
          key={key}
          onClick={() => {
            setConsultSetupTab(key);
            setConsultSetupMode("create");
          }}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
            consultSetupTab === key
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    {/* CREATE / MANAGE SUB-TABS */}
    <div className="flex gap-3 border-b pb-3">
      {["create", "manage"].map((mode) => (
        <button
          key={mode}
          onClick={() => setConsultSetupMode(mode)}
          className={`px-3 py-1 text-sm rounded transition ${
            consultSetupMode === mode
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {mode === "create" ? "➕ Create" : "🛠️ Manage"}
        </button>
      ))}
    </div>

    {/* CONTENT */}
    <div className="pt-4">
      {consultSetupTab === "consultation" && consultSetupMode === "create" && (
        <CreateConsultation
          onCreated={(consultation) => {
            setActiveConsultationId(consultation.id);
            setConsultationsSubTab("new");
          }}
        />
      )}


{consultSetupTab === "consultation" && consultSetupMode === "manage" && (
<ManageConsults
  onSelect={(id) => {
    setActiveConsultationId(id);
    setConsultationsSubTab("new"); // ❌ wrong for viewing
  }}
/>

)}

{consultSetupTab === "modules" && consultSetupMode === "create" && (
  <div className="space-y-8">

    {/* MODULE (SECTION) */}
    <div className="p-4 rounded border bg-sky-50">
      <h4 className="font-semibold text-sky-800 mb-2">
        📁 Module (Section)
      </h4>
      <p className="text-sm text-sky-600 mb-3">
        Create or define a consultation module.
      </p>
      <CreateSection />
    </div>

    {/* ITEMS */}
    <div className="p-4 rounded border bg-emerald-50">
      <h4 className="font-semibold text-emerald-800 mb-2">
        🧾 Module Items
      </h4>
      <p className="text-sm text-emerald-600 mb-3">
        Add questions / scoring items to a module.
      </p>
      <CreateConsultItem />
    </div>

  </div>
)}


{consultSetupTab === "modules" && consultSetupMode === "manage" && (
  <ManageSectionsItems />   // or whatever you named it
)}

      {consultSetupTab === "intensities" && consultSetupMode === "create" && (
        <CreateIntensity />
      )}

      {consultSetupTab === "intensities" && consultSetupMode === "manage" && (
        <ManageIntensity />
      )}

      {consultSetupTab === "multipliers" && consultSetupMode === "create" && (
        <CreateMultiplier />
      )}

      {consultSetupTab === "multipliers" && consultSetupMode === "manage" && (
        <ManageMultipliers />
      )}
    </div>
  </div>
)}




  {consultationsSubTab === "list" && (
  <div className="space-y-6">
    <ConsultationList
      onSelect={(id) => {
        setActiveConsultationId(id);
      }}
    />

    {activeConsultationId && (
      <ViewConsultation consultationId={activeConsultationId} />
    )}
  </div>
)}

  </>
)}

{consultationsSubTab === "new" && (
  <div className="space-y-6">

    {/* STEP 1: Select Consultation */}
    <ConsultationSelector
      value={activeConsultationId}
      onSelect={setActiveConsultationId}
    />

    {/* STEP 2+: Conduct */}
    {activeConsultationId && (
      <ConductConsultation
        consultationId={activeConsultationId}
        onEntryCreated={(entry) => {
          console.log("Entry added:", entry);
        }}
      />
    )}
  </div>
)}

{activeTab === "timeoff" && (
  <div className="flex space-x-4 border-b mb-6 mt-4">
    <button
      onClick={() => setTimeOffSubTab("manage")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        timeOffSubTab === "manage"
          ? "border-rose-600 text-rose-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      🧠 Approvals
    </button>

 

    <button
      onClick={() => setTimeOffSubTab("create")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        timeOffSubTab === "create"
          ? "border-rose-600 text-rose-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      ➕ Request Time Off
    </button>
  </div>
)}

{activeTab === "timeoff" && (
  <>
    {timeOffSubTab === "manage" && <BossTimeOff />}


    {timeOffSubTab === "create" && <CreateTimeOffRequest />}
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

{!loading && !error && activeTab === "reviews" && (
  <ManageReviews />
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
        🟢 Day
      </button>
<button
  onClick={() => setWorkDaySubTab("employees")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    workDaySubTab === "employees"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🗓️ Employees
</button>

      <button
        onClick={() => setWorkDaySubTab("staff")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          workDaySubTab === "staff"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        👥 Active
      </button>
      <button
  onClick={() => setWorkDaySubTab("inventory")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    workDaySubTab === "inventory"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  📦 Inventory
</button>

    </div>

    {/* Work Day Sub Content */}
    {!loading && !error && workDaySubTab === "workday" && (
      <ClientSchedulesCalendar />
    )}




{!loading && !error && workDaySubTab === "inventory" && (
  <>
    {/* Inventory Sub Tabs */}
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
        onClick={() => setInventorySubTab("create")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          inventorySubTab === "create"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        ➕ Create
      </button>

      <button
        onClick={() => setInventorySubTab("manage")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          inventorySubTab === "manage"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🛠️ Manage
      </button>

      <button
        onClick={() => setInventorySubTab("staff")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          inventorySubTab === "staff"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        👥 Staff
      </button>
      <button
        onClick={() => setInventorySubTab("purchases")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          inventorySubTab === "purchases" ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        💰 Purchases
      </button>
    </div>
{inventorySubTab === "manage" && (
  <ManageInventory />
)}

    {/* Inventory Sub Content */}
    {inventorySubTab === "create" && (
      <CreateInventoryItem />
    )}

    {inventorySubTab === "staff" && (
  <ControlStaffInventory />
)}

    {inventorySubTab === "staff" && (
  <StaffInventoryOverview />
)}

{inventorySubTab === "purchases" && (
      <div className="mt-2 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
        {/* Purchase Nested Sub-Tabs */}
        <div className="flex space-x-8 mb-6 justify-center">
          <button
            onClick={() => setPurchaseSubTab("create")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition ${
              purchaseSubTab === "create" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            🛒 Add Purchase
          </button>
          <button
            onClick={() => setPurchaseSubTab("history")}
            className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition ${
              purchaseSubTab === "history" ? "text-emerald-700 border-b-2 border-emerald-700" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            📜 Purchase History
          </button>
        </div>

        {/* Render actual components */}
        {purchaseSubTab === "create" && (
          <CreatePurchase onPurchaseAdded={() => setPurchaseSubTab("history")} />
        )}
        {purchaseSubTab === "history" && (
          <ManagePurchases />
        )}
      </div>
    )}
  </>
)}

    {!loading && !error && workDaySubTab === "staff" && (
      <AdminWorkDay />
    )}
  </>
)}
{!loading && !error && workDaySubTab === "employees" && (
  <ManageAvailability />
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
        My Shifts
      </button>

      <button
        onClick={() => setShiftsSubTab("all")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          shiftsSubTab === "all"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
       All Shifts
      </button>
<button
  onClick={() => setShiftsSubTab("manage")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    shiftsSubTab === "manage"
      ? "border-purple-600 text-purple-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  Manage
</button>

    </div>

    {!loading && !error && shiftsSubTab === "me" && (
      <AdminShifts mode="me" />
    )}
{!loading && !error && shiftsSubTab === "manage" && (
  <AdminWorkShifts />
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
        <button
      onClick={() => {
        setProfileSubTab("users");
        setUsersSubTab("staff");
        loadStaff();
      }}
      className={`px-3 py-2 font-semibold border-b-2 ${
        profileSubTab === "users"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500"
      }`}
    >
      👥 Users
    </button>
  </div>
)}

{activeTab === "profile" && profileSubTab === "users" && (
  <div className="flex space-x-4 border-b mb-6 mt-2">
    <button
      onClick={() => {
        setUsersSubTab("staff");
        loadStaff();
      }}
      className={`px-3 py-2 text-sm font-semibold border-b-2 ${
        usersSubTab === "staff"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500"
      }`}
    >
      👷 Employees
    </button>

    <button
      onClick={() => {
        setUsersSubTab("admins");
        loadAdmins();
      }}
      className={`px-3 py-2 text-sm font-semibold border-b-2 ${
        usersSubTab === "admins"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500"
      }`}
    >
      🛡️ Admins
    </button>
  </div>
)}

{activeTab === "profile" && profileSubTab === "me" && <UserProfile />}
{activeTab === "profile" && profileSubTab === "users" && usersSubTab === "staff" && (
  <StaffTable
    staff={staff}
    onActivate={activateStaff}
    onDeactivate={deactivateStaff}
    onDelete={deleteStaff}
    onUpdateRole={updateRole}
  />
  
)}

{activeTab === "profile" && profileSubTab === "users" && usersSubTab === "staff" && (
  <AdminTable admins={admins} />
)}

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
{activeTab === "profile" && profileSubTab === "users" && usersSubTab === "admins" && (
  <AdminTable admins={admins} />
)}



{activeTab === "time" && (
  <>
    {/* Time Sub Tabs */}
    <div className="flex space-x-4 border-b mb-6 mt-4">
      <button
        onClick={() => setTimeSubTab("weekly")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          timeSubTab === "weekly"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        📊 Weekly
      </button>

      <button
        onClick={() => setTimeSubTab("manual")}
        className={`px-3 py-2 font-semibold border-b-2 transition ${
          timeSubTab === "manual"
            ? "border-emerald-600 text-emerald-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        ✍️ Manual
      </button>
    </div>

    {/* Time Sub Content */}
    {!loading && !error && timeSubTab === "weekly" && (
      <AdminWeekly />
    )}

    {!loading && !error && timeSubTab === "manual" && (
      <ManualTimeEntry />
    )}
  </>
)}

</div>
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
