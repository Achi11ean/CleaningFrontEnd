import { useState } from "react";
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

import Availability from "./Availability";
import ManagerAllStaffProfiles from "./ManagerAllStaffProfiles";
import MyShifts from "./MyShifts";
export default function StaffDashboard() {
  const { staff, logout } = useStaff();
const [timeOffSubTab, setTimeOffSubTab] = useState("create");
// "create" | "manage"
const [clockSubTab, setClockSubTab] = useState("timeclock");
// "timeclock" | "staff"
const [profileSubTab, setProfileSubTab] = useState("me");
// "me" | "staff"

  const [activeTab, setActiveTab] = useState("clock");
  const [clientSubTab, setClientSubTab] = useState("list"); 
  // "list" | "schedules"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 text-center via-white to-sky-100 pt-24 ">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-none border border-gray-200 p-2">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Staff Dashboard
            </h1>
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


        </div>

        {/* Main Tabs */}
<div
  className="
    grid grid-cols-3 gap-2
    md:flex md:gap-3
    border-b mb-6
  "
>
          <button
            onClick={() => setActiveTab("clock")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "clock"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Time
          </button>
<button
  onClick={() => setActiveTab("workday")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "workday"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  Work
</button>

          <button
            onClick={() => {
              setActiveTab("clients");
              setClientSubTab("list"); // default sub-tab
            }}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "clients"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Clients
          </button>
          <button
  onClick={() => setActiveTab("myshifts")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "myshifts"
      ? "border-purple-600 text-purple-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
   Shifts
</button>
<button
  onClick={() => setActiveTab("inventory")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "inventory"
      ? "border-emerald-600 text-emerald-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧰 Inventory
</button>

<button
  onClick={() => {
    setActiveTab("timeoff");
    setTimeOffSubTab("create");
  }}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "timeoff"
      ? "border-rose-600 text-rose-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
   Off
</button>


          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "profile"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Profile
          </button>
        </div>

        {/* CLIENT SUB-TABS */}
     {activeTab === "clients" && (
  <div className="flex space-x-4 border-b mb-6 ml-2">

    <button
      onClick={() => setClientSubTab("list")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        clientSubTab === "list"
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      📋 Client List
    </button>

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
)}
{activeTab === "myshifts" && <MyShifts mode="staff" />}

{activeTab === "workday" && <StaffWorkDayCalendar />}
{activeTab === "workday" && <ActiveShiftPanel />}

{activeTab === "inventory" && <MyInventory />}

{activeTab === "timeoff" && (
  <div className="flex space-x-4 border-b mb-6 ml-2">
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

    <button
      onClick={() => setTimeOffSubTab("my")}
      className={`px-3 py-2 text-sm font-semibold border-b-2 transition ${
        timeOffSubTab === "my"
          ? "border-rose-600 text-rose-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      📄 My Requests
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
    {clientSubTab === "list" && <StaffClients />}

    {clientSubTab === "schedules" && staff?.role === "manager" && (
      <ClientSchedulesManagers />
    )}

    {clientSubTab === "create" && staff?.role === "manager" && (
      <ManagerCreateSchedules />
    )}
        {clientSubTab === "create" && staff?.role === "manager" && (
      <ManagerBooking />
    )}
  </>
)}

{/* TIME OFF CONTENT */}
{activeTab === "timeoff" && (
  <>
    {timeOffSubTab === "create" && (
      <CreateTimeOffRequest />
    )}

    {timeOffSubTab === "my" && (
      <ViewMyTimeOffRequests />
    )}

    {timeOffSubTab === "manage" && staff?.role === "manager" && (
      <BossTimeOff />
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
