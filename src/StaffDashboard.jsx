import { useState, useEffect } from "react";
import { useStaff } from "./StaffContext";
import StaffClock from "./StaffClock";
import UserProfile from "./UserProfile";
import StaffClients from "./StaffClients";
import ClientSchedulesManagers from "./ClientSchedulesManagers"; // 👈 NEW
import ManagerCreateSchedules from "./ManagerCreateSchedules"; // 👈 NEW
import AllAvailability from "./AllAvailability";
import ManagerBooking from "./ManagerBooking";
import StaffWorkDayCalendar from "./StaffWorkDayCalendar"; // 👈 NEW
import ActiveShiftPanel from "./ActiveShiftPanel";
import CreateTimeOffRequest from "./CreateTimeOffRequest";
import ViewMyTimeOffRequests from "./ViewMyTimeOffRequests";
import BossTimeOff from "./BossTimeOff";
import MyInventory from "./MyInventory";
import CreateInventoryItem from "./CreateInventoryItem";
import ManageInventory from "./ManageInventory";
import ControlStaffInventory from "./ControlStaffInventory";
import StaffInventoryOverview from "./StaffInventoryOverview";
import CreatePurchase from "./CreatePurchase";
import ManagePurchases from "./ManagePurchases";
import ManagerRequests from "./Requests";
import CreateServices from "./CreateServices";
import ManageServices from "./ManageServices";
import Availability from "./Availability";
import ManageReviews from "./ManageReviews";
import ManageAvailability from "./ManageAvailability";
import ManagerAllStaffProfiles from "./ManagerAllStaffProfiles";
import CreateGallery from "./CreateGallery";
import ManageGallery from "./ManageGallery";
import MyShifts from "./MyShifts";
import ClientInquiry from "./ClientInquiry";

export default function StaffDashboard() {
const { staff, authAxios } = useStaff();
const [timeOffSubTab, setTimeOffSubTab] = useState("create");
// "create" | "manage"
const [clockSubTab, setClockSubTab] = useState("timeclock");
// "timeclock" | "staff"
const [profileSubTab, setProfileSubTab] = useState("me");
// "me" | "staff"
const [clientsListMode, setClientsListMode] = useState("all");
// "all" | "requests"
const [servicesSubTab, setServicesSubTab] = useState("create");
// "create" | "manage"
const [newRequestCount, setNewRequestCount] = useState(0);
const [pendingTimeOffCount, setPendingTimeOffCount] = useState(0);
const [pendingReviewCount, setPendingReviewCount] = useState(0);
const [inventoryShortageAlert, setInventoryShortageAlert] = useState(false);

useEffect(() => {
  if (staff?.role !== "manager") return;

  authAxios.get("/client-requests")
    .then(res => {
      const count = res.data.filter(r => r.status === "new").length;
      setNewRequestCount(count);
    })
    .catch(console.error);
}, [staff]);
useEffect(() => {
  if (staff?.role !== "manager") return;

  authAxios.get("/time-off/all?status=pending")
    .then(res => setPendingTimeOffCount(res.data.length))
    .catch(console.error);
}, [staff]);
useEffect(() => {
  if (staff?.role !== "manager") return;

  authAxios.get("/admin/reviews?status=pending")
    .then(res => setPendingReviewCount(res.data.length))
    .catch(console.error);
}, [staff]);
useEffect(() => {
  if (staff?.role !== "manager") return;

  authAxios.get("/inventory/staff")
    .then(res => {
      const hasShortage = res.data.some(staff =>
        staff.items.some(i => i.quantity < i.required_quantity)
      );
      setInventoryShortageAlert(hasShortage);
    })
    .catch(console.error);
}, [staff]);


  const [activeTab, setActiveTab] = useState("clock");
  const [clientSubTab, setClientSubTab] = useState("list"); 
const [inventorySubTab, setInventorySubTab] = useState("my");
const [purchaseSubTab, setPurchaseSubTab] = useState("history"); // for nested purchases
useEffect(() => {
  if (clientSubTab !== "list") {
    setClientsListMode("all");
  }
}, [clientSubTab]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-600 via-black to-slate-700  text-center  pt-20">
      <div className="max-w-6xl mx-auto bg-white pb-4 rounded-none shadow-none border border-gray-200 ">
      <h2
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
        >              Staff Dashboard
            </h2>
        {/* Header */}
        <div className="mb-8 flex  items-center justify-between">
  
            <p className="text-gray-500 text-sm mt-1">
              Logged in as{" "}
              <span className="font-semibold">
                {staff?.username}
              </span>{" "}
              <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs uppercase">
                {staff?.role}
              </span>
            </p>
          </div>



        {/* Main Tabs */}
<div
  className="
    grid grid-cols-3 gap-3
    border-b border-gray-200 pb-4 mb-8
  "
>
  {[
    { key: "clock", label: "Time", color: "cyan" },
    { key: "workday", label: "Work", color: "cyan" },

    {
      key: "clients",
      color: "cyan",
      label: (
        <span className="relative">
          Clients
          {newRequestCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
              {newRequestCount}
            </span>
          )}
        </span>
      ),
    },

    { key: "myshifts", label: "Shifts", color: "emerald" },

    {
      key: "inventory",
      color: "emerald",
      label: (
        <span className="relative">
          Inventory
          {inventoryShortageAlert && (
            <span className="absolute -top-2 -right-4 bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
              !
            </span>
          )}
        </span>
      ),
    },

    {
      key: "timeoff",
      color: "emerald",
      label: (
        <span className="relative">
          Off
          {pendingTimeOffCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
              {pendingTimeOffCount}
            </span>
          )}
        </span>
      ),
    },

    { key: "profile", label: "Profile", color: "cyan" },

    ...(staff?.role === "manager"
      ? [
          { key: "services", label: "Services", color: "cyan" },
          {
            key: "reviews",
            color: "cyan",
            label: (
              <span className="relative">
                Reviews
                {pendingReviewCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow">
                    {pendingReviewCount}
                  </span>
                )}
              </span>
            ),
          },
        ]
      : []),
  ].map(({ key, label, color }) => (
    <button
      key={key}
      onClick={() => {
        setActiveTab(key);
        if (key === "clients") setClientSubTab("list");
        if (key === "timeoff") setTimeOffSubTab("create");
        if (key === "services") setServicesSubTab("create");
      }}
      className={`
        w-full px-4 py-2 text-sm sm:text-base font-semibold rounded-xl
        text-center transition-all duration-200
        ${
          activeTab === key
            ? `bg-gradient-to-br from-${color}-400 via-${color}-500 to-${color}-600 text-white shadow-md`
            : "bg-gradient-to-br from-slate-800 via-slate-800 to-black text-white hover:brightness-110"
        }
      `}
    >
      {label}
    </button>
  ))}
</div>


        {/* CLIENT SUB-TABS */}
  {activeTab === "clients" && (
  <div className="ml-2 space-y-2">

    {/* PRIMARY CLIENT TABS */}
    <div className="flex space-x-4 border-b">
      <button
        onClick={() => {
          setClientSubTab("list");
          setClientsListMode("all");
        }}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          clientSubTab === "list"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        📋 Client List
      </button>
{staff?.role === "manager" && (
  <button
    onClick={() => setClientSubTab("new")}
    className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
      clientSubTab === "new"
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    🆕 New
  </button>
)}

      {staff?.role === "manager" && (
        <>
          <button
            onClick={() => setClientSubTab("schedules")}
            className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
              clientSubTab === "schedules"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            🗓️ Schedules
          </button>

          <button
            onClick={() => setClientSubTab("create")}
            className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
              clientSubTab === "create"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ➕ Create
          </button>
        </>
      )}
    </div>


    {/* 🔽 NESTED TABS UNDER CLIENT LIST (MANAGERS ONLY) */}
    {clientSubTab === "list" && staff?.role === "manager" && (
      <div className="flex space-x-4 border-b pl-1">
        <button
          onClick={() => setClientsListMode("all")}
          className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition ${
            clientsListMode === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All
        </button>

        <button
          onClick={() => setClientsListMode("requests")}
          className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition ${
            clientsListMode === "requests"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Requests
        </button>
      </div>
    )}
  </div>
)}
{activeTab === "services" && staff?.role === "manager" && (
  <>
    <div className="flex flex-wrap gap-3 border-b mb-6 ml-2">
      <button
        onClick={() => setServicesSubTab("create")}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          servicesSubTab === "create"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        ➕ Create Service
      </button>

      <button
        onClick={() => setServicesSubTab("manage")}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          servicesSubTab === "manage"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🛠️ Manage Services
      </button>

      <button
        onClick={() => setServicesSubTab("gallery-create")}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          servicesSubTab === "gallery-create"
            ? "border-cyan-600 text-cyan-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🖼️ Gallery +
      </button>

      <button
        onClick={() => setServicesSubTab("gallery-manage")}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          servicesSubTab === "gallery-manage"
            ? "border-cyan-600 text-cyan-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        🗂️ Manage Gallery
      </button>
    </div>

    {/* Services Content */}
    {servicesSubTab === "create" && <CreateServices />}
    {servicesSubTab === "manage" && <ManageServices />}

    {servicesSubTab === "gallery-create" && <CreateGallery />}
    {servicesSubTab === "gallery-manage" && <ManageGallery />}
  </>
)}

{activeTab === "myshifts" && <MyShifts mode="staff" />}

{activeTab === "workday" && <StaffWorkDayCalendar />}
{activeTab === "workday" && <ActiveShiftPanel />}

{activeTab === "inventory" && (
  <>
    {/* Show custom view for managers */}
    {staff?.role === "manager" ? (
      <>
        {/* Inventory Sub Tabs */}
        <div className="flex space-x-4 border-b mb-6 ml-2">
          <button
  onClick={() => setInventorySubTab("my")}
  className={`px-3 py-2 font-semibold border-b-2 transition ${
    inventorySubTab === "my"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧾 My Inventory
</button>

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
              inventorySubTab === "purchases"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            💰 Purchases
          </button>
        </div>

        {/* SubTab Views */}
        {inventorySubTab === "create" && <CreateInventoryItem />}
        {inventorySubTab === "manage" && <ManageInventory />}
        {inventorySubTab === "staff" && (
          <>
            <ControlStaffInventory />
            <StaffInventoryOverview />
          </>
        )}
        {inventorySubTab === "purchases" && (
          <div className="mt-2 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
            {/* Purchase Nested Sub-Tabs */}
            <div className="flex space-x-8 mb-6 justify-center">
              <button
                onClick={() => setPurchaseSubTab("create")}
                className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition ${
                  purchaseSubTab === "create"
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                🛒 Add Purchase
              </button>
              <button
                onClick={() => setPurchaseSubTab("history")}
                className={`flex items-center gap-2 pb-2 text-sm font-bold uppercase tracking-wider transition ${
                  purchaseSubTab === "history"
                    ? "text-emerald-700 border-b-2 border-emerald-700"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                📜 Purchase History
              </button>
            </div>

            {purchaseSubTab === "create" && (
              <CreatePurchase
                onPurchaseAdded={() => setPurchaseSubTab("history")}
              />
            )}
            {purchaseSubTab === "history" && <ManagePurchases />}
          </div>
        )}
  {inventorySubTab === "my" && <MyInventory />}

      </>
    ) : (
      <MyInventory />
    )}
  </>
)}
{activeTab === "reviews" && staff?.role === "manager" && (
  <ManageReviews />
)}

{activeTab === "timeoff" && (
  <div className="flex space-x-2 border-b mb-6 ml-2">
    <button
      onClick={() => setTimeOffSubTab("create")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        timeOffSubTab === "create"
          ? "border-rose-600 text-rose-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      ➕ Request 
    </button>

    <button
      onClick={() => setTimeOffSubTab("my")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        timeOffSubTab === "my"
          ? "border-rose-600 text-rose-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      📄 Requests
    </button>

    {staff?.role === "manager" && (
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
    )}
    {staff?.role === "manager" && (
  <button
    onClick={() => setTimeOffSubTab("availability")}
    className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
      timeOffSubTab === "availability"
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-gray-500 hover:text-gray-700"
    }`}
  >
    📅 Availability
  </button>
)}
  </div>
)}
{/* CLOCK SUB-TABS */}
{activeTab === "clock" && (
  <div className="flex space-x-4 border-b mb-6 ml-2">
    <button
      onClick={() => setClockSubTab("timeclock")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        clockSubTab === "timeclock"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      ⏱️ Time Clock
    </button>

    <button
      onClick={() => setClockSubTab("staff")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        clockSubTab === "staff"
          ? "border-indigo-600 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      👥 Staff
    </button>
  </div>
)}


        {/* Content */}
{activeTab === "clock" && (
  <>
{clockSubTab === "timeclock" && (
  <StaffClock onRequestInventory={() => setActiveTab("inventory")} />
)}

    {clockSubTab === "staff" && (
      <div className="mt-4">
        <AllAvailability />
      </div>
    )}
  </>
)}

  {activeTab === "clients" && (
  <>
    {clientSubTab === "list" && (
      <>
        {staff?.role === "manager" ? (
          clientsListMode === "all" ? (
            <StaffClients />
          ) : (
            <ManagerRequests />
          )
        ) : (
          <StaffClients />
        )}
        
      </>
    )}
{clientSubTab === "new" && staff?.role === "manager" && (
  <div className="mt-6">
    <ClientInquiry />
  </div>
)}

    {clientSubTab === "schedules" && staff?.role === "manager" && (
      <ClientSchedulesManagers />
    )}

    {clientSubTab === "create" && staff?.role === "manager" && (
      <>
        <ManagerCreateSchedules />
        <ManagerBooking />
      </>
    )}
  </>
)}


{/* TIME OFF CONTENT */}
{activeTab === "timeoff" && (
  <>
    {timeOffSubTab === "create" && <CreateTimeOffRequest />}
    {timeOffSubTab === "my" && <ViewMyTimeOffRequests />}
    {timeOffSubTab === "manage" && staff?.role === "manager" && <BossTimeOff />}
    {timeOffSubTab === "availability" && staff?.role === "manager" && (
      <ManageAvailability />
    )}
  </>
)}



{activeTab === "profile" && (
  <>
    {/* PROFILE SUB-TABS */}
    <div className="flex space-x-4 border-b mb-6 ml-2">
      <button
        onClick={() => setProfileSubTab("me")}
        className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
          profileSubTab === "me"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        👤 My Profile
      </button>

      {staff?.role === "manager" && (
        <button
          onClick={() => setProfileSubTab("staff")}
          className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
            profileSubTab === "staff"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          🗒️ Staff Notes
        </button>
      )}
    </div>

    {/* PROFILE CONTENT */}
    {profileSubTab === "me" && (
      <div className="space-y-8">
        <UserProfile />
        <Availability />
      </div>
    )}

    {profileSubTab === "staff" && staff?.role === "manager" && (
      <ManagerAllStaffProfiles />
    )}
  </>
)}

      </div>
    </div>
  );
}
