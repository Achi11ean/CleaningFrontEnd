import { useState } from "react";
import { useStaff } from "./StaffContext";
import StaffClock from "./StaffClock";
import UserProfile from "./UserProfile";
import StaffClients from "./StaffClients";
import ClientSchedulesManagers from "./ClientSchedulesManagers"; // 👈 NEW
import ManagerCreateSchedules from "./ManagerCreateSchedules"; // 👈 NEW
import StaffWorkDayCalendar from "./StaffWorkDayCalendar"; // 👈 NEW
import ActiveShiftPanel from "./ActiveShiftPanel";

import MyShifts from "./MyShifts";
export default function StaffDashboard() {
  const { staff, logout } = useStaff();

  const [activeTab, setActiveTab] = useState("clock");
  const [clientSubTab, setClientSubTab] = useState("list"); 
  // "list" | "schedules"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-sky-100 pt-24 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">

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

          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-sm"
          >
            Logout
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex space-x-4 border-b mb-6">

          <button
            onClick={() => setActiveTab("clock")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "clock"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⏱️ Clock In / Out
          </button>
<button
  onClick={() => setActiveTab("workday")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "workday"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🗓️ Work Day
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
            🗂️ Clients
          </button>
          <button
  onClick={() => setActiveTab("myshifts")}
  className={`px-4 py-2 font-semibold border-b-2 transition ${
    activeTab === "myshifts"
      ? "border-purple-600 text-purple-600"
      : "border-transparent text-gray-500 hover:text-gray-700"
  }`}
>
  🧾 My Shifts
</button>


          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeTab === "profile"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            👤 My Profile
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

        {/* Content */}
        {activeTab === "clock" && <StaffClock />}

   {activeTab === "clients" && (
  <>
    {clientSubTab === "list" && <StaffClients />}

    {clientSubTab === "schedules" && staff?.role === "manager" && (
      <ClientSchedulesManagers />
    )}

    {clientSubTab === "create" && staff?.role === "manager" && (
      <ManagerCreateSchedules />
    )}
  </>
)}


        {activeTab === "profile" && <UserProfile />}

      </div>
    </div>
  );
}
