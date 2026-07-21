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
import AdminNextShiftBanner from "./AdminNextShiftBanner";
import CreateTimeOffRequest from "./CreateTimeOffRequest";
import TodayTasksSlider from "./TodayTasksSlider";
import ViewMyTimeOffRequests from "./ViewMyTimeOffRequests";
import BossTimeOff from "./BossTimeOff";
import ManageAvailability from "./ManageAvailability";
import CreateConsultation from "./CreateConsultation";
import CreateSection from "./CreateSection";
import ManageAppointments from "./ManageAppointments";
import NextShiftBanner from "./NextShiftBanner";
import CreateConsultItem from "./CreateConsultItem";
import CreateMultiplier from "./CreateMultiplier";
import ConductConsultation from "./ConductConsultation";
import CreateAppointment from "./CreateAppointment";
import ConsultationSelector from "./ConsultationSelector";
import ConsultationList from "./ConsultationList";
import ViewConsultation from "./ViewConsultation";
import ManageConsults from "./ManageConsults";
import ManageMultipliers from "./ManageMultipliers";
import AdminWorkShifts from "./AdminWorkShifts";
import ManageSectionsItems from "./ManageSectionsItems";
import Booking from "./Booking";
import CreateInventoryItem from "./CreateInventoryItem";
import ManageInventory from "./ManageInventory";
import ControlStaffInventory from "./ControlStaffInventory";
import StaffInventoryOverview from "./StaffInventoryOverview";
import ManagerRequests from "./Requests";
import CreateGallery from "./CreateGallery";
import ManageGallery from "./ManageGallery";
import CreateTask from "./CreateTask";
import ManageTasks from "./ManageTasks";
import axios from "axios";
import "./App.css";

import CreatePurchase from "./CreatePurchase";
import ManagePurchases from "./ManagePurchases";
import AdminShifts from "./AdminShifts";
import ManualTimeEntry from "./ManualTimeEntry";
import AdminChecklistOverview from "./AdminChecklistOverview";
import ClientInquiry from "./ClientInquiry";
import AllExceptions from "./AllExceptions";
import AdminActiveShiftPanel from "./AdminActiveShiftPanel";
import AdminStartShift from "./AdminStartShift";
import LiveActiveShiftsManager from "./LiveActiveShiftsManager";

export default function AdminDashboard() {
  const { authAxios, admin } = useAdmin();
  const [tasksSubTab, setTasksSubTab] = useState("manage"); // "create" | "manage"
  const [activeTab, setActiveTab] = useState("workday");
  const [profileSubTab, setProfileSubTab] = useState("me"); // "me" | "all"
  const [clientsSubTab, setClientsSubTab] = useState("list");
  const [shiftsSubTab, setShiftsSubTab] = useState("me"); // "me" | "all"
  const [workDaySubTab, setWorkDaySubTab] = useState("workday");
  const [servicesSubTab, setServicesSubTab] = useState("create");
  const [employeesSubTab, setEmployeesSubTab] = useState("hours");
  const [employeesHoursSubTab, setEmployeesHoursSubTab] = useState("weekly");
  const [usersSubTab, setUsersSubTab] = useState("staff"); // "staff" | "admins"
  const [consultationsSubTab, setConsultationsSubTab] = useState("create");
  const [inventorySubTab, setInventorySubTab] = useState("create");
  const [activeConsultationId, setActiveConsultationId] = useState(null);
  const [clientsListMode, setClientsListMode] = useState("all");
  const [newClientCount, setNewClientCount] = useState(0);
  const [inventoryShortageAlert, setInventoryShortageAlert] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingTimeOffCount, setPendingTimeOffCount] = useState(0);
  const [appointmentsSubTab, setAppointmentsSubTab] = useState("create");
  const [acceptingClients, setAcceptingClients] = useState(null);
  const [savingIntake, setSavingIntake] = useState(false);
  useEffect(() => {
    const loadIntakeStatus = async () => {
      try {
        const res = await authAxios.get("/admin/client-intake");
        setAcceptingClients(res.data.accepting);
      } catch (err) {
        console.error("Failed to load intake status", err);
      }
    };

    loadIntakeStatus();
  }, []);

  useEffect(() => {
    if (activeTab !== "tasks") {
      setTasksSubTab("manage");
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== "employees") {
      setEmployeesSubTab("hours");
      setEmployeesHoursSubTab("weekly");
    }
  }, [activeTab]);
  const toggleIntake = async () => {
    if (acceptingClients === null) return;

    const newValue = !acceptingClients;

    setSavingIntake(true);
    try {
      await authAxios.post("/admin/client-intake", {
        accepting: newValue,
      });

      setAcceptingClients(newValue);
    } catch (err) {
      alert("Failed to update intake status");
    } finally {
      setSavingIntake(false);
    }
  };
  useEffect(() => {
    const fetchPendingTimeOff = async () => {
      try {
        const res = await authAxios.get("/time-off/all?status=pending");
        setPendingTimeOffCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch pending time off requests", err);
      }
    };

    fetchPendingTimeOff();
  }, []);

  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        const res = await authAxios.get("/admin/reviews?status=pending");
        setPendingReviewCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch pending reviews", err);
      }
    };

    fetchPendingReviews();
  }, []);

  useEffect(() => {
    const checkInventoryShortages = async () => {
      try {
        const res = await authAxios.get("/inventory/staff");
        const data = res.data;

        const hasShortage = data.some((staff) =>
          staff.items.some((item) => item.quantity < item.required_quantity),
        );

        setInventoryShortageAlert(hasShortage);
      } catch (err) {
        console.error("Failed to check inventory shortage", err);
      }
    };

    checkInventoryShortages();
  }, []);

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

  const [consultSetupMode, setConsultSetupMode] = useState("create");
  // create | manage

  const [timeOffSubTab, setTimeOffSubTab] = useState("manage");

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
    const ok = window.confirm(
      "Are you sure you want to permanently delete this staff user?",
    );
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
  const setStaffPassword = async (id) => {
    const newPassword = window.prompt(
      "Enter new password for this staff user:",
    );

    if (!newPassword) return;

    try {
      await authAxios.patch(`/staff/${id}/set-password`, {
        password: newPassword,
      });

      alert("✅ Password updated successfully");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to set password");
    }
  };

  const sections = [
    { key: "workday", label: "Workday", subTab: "workday" },
    {
      key: "clients",
      label: "Clients",
      subTab: undefined,
      badge: newClientCount + newRequestCount,
    },
    { key: "consultations", label: "Consults", subTab: "create" },
    {
      key: "employees",
      label: "Employees",
      subTab: undefined,
      badge: pendingTimeOffCount,
    },
    { key: "services", label: "Services", subTab: "create" },
    { key: "reviews", label: "Reviews", subTab: undefined, badge: pendingReviewCount },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 pt-20 lg:pt-24 pb-10 px-3 sm:px-4 lg:px-6">
      {/* Self-contained utilities so the layout never depends on plugins */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-300/40 border border-slate-200 overflow-hidden">
        {/* ================= HEADER ================= */}
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-5 py-7 sm:py-9 text-center">
          {/* Ambient accents */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
          </div>

          <div className="relative">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.3em] text-cyan-300/80 mb-2">
              Admin Dashboard
            </p>
            <h1 className="font-[Aspire] text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Welcome back, Amanda
            </h1>
            <p className="mt-2 text-sm text-blue-100/70">
              Everything is up to date and running smoothly.
            </p>

            {/* Quick jumps */}
            <div className="mt-5 flex justify-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  setActiveTab("employees");
                  setEmployeesSubTab("profile");
                  setProfileSubTab("me");
                }}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/15 backdrop-blur hover:bg-white/20 hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 transition-all duration-200"
              >
                Profiles
              </button>

              <button
                onClick={() => {
                  setActiveTab("tasks");
                  setTasksSubTab("manage");
                }}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/15 backdrop-blur hover:bg-white/20 hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 transition-all duration-200"
              >
                Tasks
              </button>
            </div>
          </div>
        </header>

        {/* ================= BODY ================= */}
        <div className="px-3 sm:px-5 lg:px-6 py-5">
          {/* Primary navigation */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pb-5 border-b border-slate-200">
            {sections.map(({ key, label, subTab, badge }) => (
              <SectionTab
                key={key}
                active={activeTab === key}
                badge={badge}
                onClick={() => {
                  setActiveTab(key);
                  if (key === "workday") setWorkDaySubTab(subTab);
                  if (key === "consultations") setConsultationsSubTab(subTab);
                  if (key === "shifts") setShiftsSubTab(subTab);
                  if (key === "profile") setProfileSubTab(subTab);
                  if (key === "services") setServicesSubTab(subTab);
                  if (key === "tasks") setTasksSubTab(subTab);
                  if (key === "timeoff") setTimeOffSubTab(subTab);
                  if (key === "employees") {
                    setEmployeesSubTab("hours");
                    setEmployeesHoursSubTab("weekly");
                  }
                }}
              >
                {label}
              </SectionTab>
            ))}
          </div>

          {/* Status */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              <span className="text-sm font-medium">Loading…</span>
            </div>
          )}

          {error && (
            <div className="my-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* ===================== CLIENTS ===================== */}
          {activeTab === "clients" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={clientsSubTab === "list"} onClick={() => setClientsSubTab("list")}>
                  Clients
                </Tab>
                <Tab active={clientsSubTab === "schedules"} onClick={() => setClientsSubTab("schedules")}>
                  Schedules
                </Tab>
                <Tab active={clientsSubTab === "create"} onClick={() => setClientsSubTab("create")}>
                  Create
                </Tab>
                <Tab active={clientsSubTab === "consultations"} onClick={() => setClientsSubTab("consultations")}>
                  Consultations
                </Tab>
              </TabBar>

              {!loading && !error && clientsSubTab === "consultations" && (
                <div>
                  <TabBar>
                    <Tab active={appointmentsSubTab === "create"} onClick={() => setAppointmentsSubTab("create")}>
                      Create
                    </Tab>
                    <Tab active={appointmentsSubTab === "manage"} onClick={() => setAppointmentsSubTab("manage")}>
                      Manage
                    </Tab>
                  </TabBar>

                  {appointmentsSubTab === "create" && <CreateAppointment />}
                  {appointmentsSubTab === "manage" && <ManageAppointments />}
                </div>
              )}

              {!loading && !error && clientsSubTab === "list" && (
                <>
                  <TabBar>
                    <Tab active={clientsListMode === "all"} onClick={() => setClientsListMode("all")} badge={newClientCount}>
                      All Clients
                    </Tab>
                    <Tab active={clientsListMode === "inquiry"} onClick={() => setClientsListMode("inquiry")}>
                      New
                    </Tab>
                    <Tab active={clientsListMode === "requests"} onClick={() => setClientsListMode("requests")} badge={newRequestCount}>
                      Requests
                    </Tab>
                    <Tab active={clientsListMode === "exceptions"} onClick={() => setClientsListMode("exceptions")}>
                      Exceptions
                    </Tab>
                  </TabBar>

                  {clientsListMode === "exceptions" && <AllExceptions />}
                  {clientsListMode === "inquiry" && <ClientInquiry />}
                  {clientsListMode === "all" && (
                    <>
                      {acceptingClients !== null && (
                        <div className="mb-6 flex justify-center">
                          <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                            <div className="text-left">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Client Intake
                              </p>
                              <p
                                className={`text-base font-bold ${
                                  acceptingClients ? "text-emerald-600" : "text-rose-600"
                                }`}
                              >
                                {acceptingClients ? "Accepting New Clients" : "Waitlist Mode"}
                              </p>
                            </div>

                            <button
                              onClick={toggleIntake}
                              disabled={savingIntake}
                              aria-label="Toggle client intake"
                              className={`relative w-14 h-8 rounded-full transition-colors duration-300 disabled:opacity-60 ${
                                acceptingClients ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${
                                  acceptingClients ? "translate-x-6" : ""
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      <ManageClients />
                    </>
                  )}
                  {clientsListMode === "requests" && <ManagerRequests />}
                </>
              )}

              {!loading && !error && clientsSubTab === "create" && (
                <div className="space-y-8">
                  <CreateSchedules />
                  <Booking />
                </div>
              )}

              {!loading && !error && clientsSubTab === "schedules" && (
                <div className="space-y-8">
                  <Booking />
                  <ClientSchedulesAdmin />
                </div>
              )}
            </div>
          )}

          {/* ===================== CONSULTATIONS ===================== */}
          {activeTab === "consultations" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={consultationsSubTab === "new"} onClick={() => setConsultationsSubTab("new")}>
                  Begin
                </Tab>
                <Tab active={consultationsSubTab === "create"} onClick={() => setConsultationsSubTab("create")}>
                  Tools
                </Tab>
                <Tab active={consultationsSubTab === "list"} onClick={() => setConsultationsSubTab("list")}>
                  All
                </Tab>
              </TabBar>

              {consultationsSubTab === "create" && (
                <div className="space-y-6">
                  <TabBar>
                    {[
                      ["consultation", "Consultation"],
                      ["modules", "Modules"],
                      ["multipliers", "Multipliers"],
                    ].map(([key, label]) => (
                      <Tab
                        key={key}
                        active={consultSetupTab === key}
                        onClick={() => {
                          setConsultSetupTab(key);
                          setConsultSetupMode("create");
                        }}
                      >
                        {label}
                      </Tab>
                    ))}
                  </TabBar>

                  <div className="flex gap-2">
                    {["create", "manage"].map((mode) => (
                      <Pill key={mode} active={consultSetupMode === mode} onClick={() => setConsultSetupMode(mode)}>
                        {mode === "create" ? "Create" : "Manage"}
                      </Pill>
                    ))}
                  </div>

                  <div className="pt-2">
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
                          setConsultationsSubTab("new");
                        }}
                      />
                    )}

                    {consultSetupTab === "modules" && consultSetupMode === "create" && (
                      <div className="space-y-6">
                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                          <h4 className="font-semibold text-sky-800 mb-1">Module (Section)</h4>
                          <p className="text-sm text-sky-600 mb-3">
                            Create or define a consultation module.
                          </p>
                          <CreateSection />
                        </div>

                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <h4 className="font-semibold text-emerald-800 mb-1">Module Items</h4>
                          <p className="text-sm text-emerald-600 mb-3">
                            Add questions and scoring items to a module.
                          </p>
                          <CreateConsultItem />
                        </div>
                      </div>
                    )}

                    {consultSetupTab === "modules" && consultSetupMode === "manage" && (
                      <ManageSectionsItems />
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
                  <ConsultationList onSelect={(id) => setActiveConsultationId(id)} />
                  {activeConsultationId && <ViewConsultation consultationId={activeConsultationId} />}
                </div>
              )}
            </div>
          )}

          {/* ===================== TASKS ===================== */}
          {activeTab === "tasks" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={tasksSubTab === "manage"} onClick={() => setTasksSubTab("manage")}>
                  Tasks
                </Tab>
              </TabBar>

              {!loading && !error && tasksSubTab === "manage" && <ManageTasks />}
            </div>
          )}

          {/* ===================== EMPLOYEES ===================== */}
          {activeTab === "employees" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={employeesSubTab === "hours"} onClick={() => setEmployeesSubTab("hours")}>
                  Hours
                </Tab>
                <Tab active={employeesSubTab === "off"} onClick={() => setEmployeesSubTab("off")}>
                  Off
                </Tab>
                <Tab active={employeesSubTab === "shifts"} onClick={() => setEmployeesSubTab("shifts")}>
                  Shifts
                </Tab>
                <Tab
                  active={employeesSubTab === "inventory"}
                  onClick={() => setEmployeesSubTab("inventory")}
                  alert={inventoryShortageAlert}
                >
                  Inventory
                </Tab>
                <Tab active={employeesSubTab === "availability"} onClick={() => setEmployeesSubTab("availability")}>
                  Availability
                </Tab>
              </TabBar>

              {/* INVENTORY */}
              {employeesSubTab === "inventory" && (
                <>
                  <TabBar>
                    <Tab active={inventorySubTab === "create"} onClick={() => setInventorySubTab("create")}>
                      Create
                    </Tab>
                    <Tab active={inventorySubTab === "manage"} onClick={() => setInventorySubTab("manage")}>
                      Manage
                    </Tab>
                    <Tab active={inventorySubTab === "staff"} onClick={() => setInventorySubTab("staff")}>
                      Staff
                    </Tab>
                    <Tab active={inventorySubTab === "purchases"} onClick={() => setInventorySubTab("purchases")}>
                      Purchases
                    </Tab>
                  </TabBar>

                  {inventorySubTab === "create" && <CreateInventoryItem />}
                  {inventorySubTab === "manage" && <ManageInventory />}
                  {inventorySubTab === "staff" && (
                    <div className="space-y-8">
                      <ControlStaffInventory />
                      <StaffInventoryOverview />
                    </div>
                  )}
                  {inventorySubTab === "purchases" && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="mb-6 flex justify-center gap-2">
                        <Pill active={purchaseSubTab === "create"} onClick={() => setPurchaseSubTab("create")}>
                          Add Purchase
                        </Pill>
                        <Pill active={purchaseSubTab === "history"} onClick={() => setPurchaseSubTab("history")}>
                          Purchase History
                        </Pill>
                      </div>

                      {purchaseSubTab === "create" && (
                        <CreatePurchase onPurchaseAdded={() => setPurchaseSubTab("history")} />
                      )}
                      {purchaseSubTab === "history" && <ManagePurchases />}
                    </div>
                  )}
                </>
              )}

              {/* SHIFTS */}
              {employeesSubTab === "shifts" && (
                <>
                  <TabBar>
                    <Tab active={shiftsSubTab === "me"} onClick={() => setShiftsSubTab("me")}>
                      My Shifts
                    </Tab>
                    <Tab active={shiftsSubTab === "all"} onClick={() => setShiftsSubTab("all")}>
                      All Shifts
                    </Tab>
                    <Tab active={shiftsSubTab === "manage"} onClick={() => setShiftsSubTab("manage")}>
                      Manage
                    </Tab>
                  </TabBar>

                  {shiftsSubTab === "me" && <AdminShifts mode="me" />}
                  {shiftsSubTab === "all" && <AdminShifts mode="all" />}
                  {shiftsSubTab === "manage" && <AdminWorkShifts />}
                </>
              )}

              {/* PROFILE */}
              {employeesSubTab === "profile" && (
                <>
                  <TabBar>
                    <Tab active={profileSubTab === "me"} onClick={() => setProfileSubTab("me")}>
                      My Profile
                    </Tab>
                    <Tab active={profileSubTab === "all"} onClick={() => setProfileSubTab("all")}>
                      All Profiles
                    </Tab>
                    <Tab
                      active={profileSubTab === "users"}
                      onClick={() => {
                        setProfileSubTab("users");
                        setUsersSubTab("staff");
                        loadStaff();
                      }}
                    >
                      Users
                    </Tab>
                  </TabBar>

                  {profileSubTab === "users" && (
                    <TabBar>
                      <Tab
                        active={usersSubTab === "staff"}
                        onClick={() => {
                          setUsersSubTab("staff");
                          loadStaff();
                        }}
                      >
                        Employees
                      </Tab>
                      <Tab
                        active={usersSubTab === "admins"}
                        onClick={() => {
                          setUsersSubTab("admins");
                          loadAdmins();
                        }}
                      >
                        Admins
                      </Tab>
                    </TabBar>
                  )}

                  {profileSubTab === "me" && <UserProfile />}
                  {profileSubTab === "all" && <AdminAllProfiles />}

                  {profileSubTab === "users" && usersSubTab === "staff" && (
                    <StaffTable
                      staff={staff}
                      onActivate={activateStaff}
                      onDeactivate={deactivateStaff}
                      onDelete={deleteStaff}
                      onUpdateRole={updateRole}
                      onSetPassword={setStaffPassword}
                    />
                  )}

                  {profileSubTab === "users" && usersSubTab === "admins" && (
                    <AdminTable admins={admins} />
                  )}
                </>
              )}

              {/* HOURS */}
              {employeesSubTab === "hours" && (
                <>
                  <TabBar>
                    <Tab active={employeesHoursSubTab === "weekly"} onClick={() => setEmployeesHoursSubTab("weekly")}>
                      Weekly
                    </Tab>
                    <Tab active={employeesHoursSubTab === "manual"} onClick={() => setEmployeesHoursSubTab("manual")}>
                      Manual
                    </Tab>
                  </TabBar>

                  {employeesHoursSubTab === "weekly" && <AdminWeekly />}
                  {employeesHoursSubTab === "manual" && <ManualTimeEntry />}
                </>
              )}

              {/* OFF */}
              {employeesSubTab === "off" && (
                <>
                  <TabBar>
                    <Tab active={timeOffSubTab === "manage"} onClick={() => setTimeOffSubTab("manage")}>
                      Requests
                    </Tab>
                    <Tab active={timeOffSubTab === "create"} onClick={() => setTimeOffSubTab("create")}>
                      New
                    </Tab>
                  </TabBar>

                  {timeOffSubTab === "manage" && <BossTimeOff />}
                  {timeOffSubTab === "create" && <CreateTimeOffRequest />}
                </>
              )}
            </div>
          )}

          {/* ===================== CONDUCT CONSULTATION ===================== */}
          {consultationsSubTab === "new" && (
            <div className="mt-6 space-y-6">
              <ConsultationSelector value={activeConsultationId} onSelect={setActiveConsultationId} />

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

          {/* ===================== SERVICES ===================== */}
          {activeTab === "services" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={servicesSubTab === "create"} onClick={() => setServicesSubTab("create")}>
                  Add Service
                </Tab>
                <Tab active={servicesSubTab === "manage"} onClick={() => setServicesSubTab("manage")}>
                  Services
                </Tab>
                <Tab active={servicesSubTab === "gallery"} onClick={() => setServicesSubTab("gallery")}>
                  Add Gallery
                </Tab>
                <Tab active={servicesSubTab === "manage-gallery"} onClick={() => setServicesSubTab("manage-gallery")}>
                  Gallery
                </Tab>
              </TabBar>

              {!loading && !error && servicesSubTab === "create" && <CreateServices />}
              {!loading && !error && servicesSubTab === "manage" && <ManageServices />}
              {!loading && !error && servicesSubTab === "gallery" && <CreateGallery />}
              {!loading && !error && servicesSubTab === "manage-gallery" && <ManageGallery />}
            </div>
          )}

          {/* ===================== REVIEWS ===================== */}
          {!loading && !error && activeTab === "reviews" && (
            <div className="mt-6">
              <ManageReviews />
            </div>
          )}

          {/* ===================== WORKDAY ===================== */}
          {activeTab === "workday" && (
            <div className="mt-6">
              <TabBar>
                <Tab active={workDaySubTab === "workday"} onClick={() => setWorkDaySubTab("workday")}>
                  Today
                </Tab>
                <Tab active={workDaySubTab === "calendar"} onClick={() => setWorkDaySubTab("calendar")}>
                  Calendar
                </Tab>
                <Tab active={workDaySubTab === "staff"} onClick={() => setWorkDaySubTab("staff")}>
                  Active
                </Tab>
                <Tab active={workDaySubTab === "checklists"} onClick={() => setWorkDaySubTab("checklists")}>
                  Checklists
                </Tab>
              </TabBar>

              {workDaySubTab === "calendar" && <ClientSchedulesCalendar />}

              {!loading && !error && workDaySubTab === "checklists" && <AdminChecklistOverview />}

              {!loading && !error && workDaySubTab === "workday" && (
                <div className="space-y-6">
                  <div className="px-1">
                    <TodayTasksSlider />
                  </div>
                  <AdminNextShiftBanner />
                </div>
              )}

              {!loading && !error && workDaySubTab === "staff" && (
                <div className="space-y-6">
                  <AdminWorkDay />
                  <LiveActiveShiftsManager />
                </div>
              )}
            </div>
          )}

          {/* ===================== INDEPENDENT PANELS ===================== */}
          {!loading && !error && employeesSubTab === "availability" && (
            <div className="mt-6">
              <ManageAvailability />
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
              onSetPassword={setStaffPassword}
            />
          )}

          {activeTab === "profile" && profileSubTab === "users" && usersSubTab === "admins" && (
            <AdminTable admins={admins} />
          )}

          {activeTab === "profile" && profileSubTab === "all" && <AdminAllProfiles />}

          {!loading && !error && activeTab === "staff" && (
            <StaffTable
              staff={staff}
              onActivate={activateStaff}
              onDeactivate={deactivateStaff}
              onDelete={deleteStaff}
              onUpdateRole={updateRole}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Reusable navigation primitives
   One consistent look for every tab level in the dashboard.
   ============================================================ */

/* Top-level section button */
function SectionTab({ active, onClick, children, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center min-h-[44px] w-full px-2 sm:px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        active
          ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/25"
          : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow ring-2 ring-white">
          {badge}
        </span>
      )}
    </button>
  );
}

/* Horizontal, scroll-safe container for a row of sub-tabs */
function TabBar({ children }) {
  return (
    <div className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-slate-200 scrollbar-hide">
      {children}
    </div>
  );
}

/* Underline sub-tab (primary sub-navigation) */
function Tab({ active, onClick, children, badge, alert }) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:text-blue-700 ${
        active
          ? "border-blue-600 text-blue-700"
          : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
      {alert && (
        <span className="absolute top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
          !
        </span>
      )}
    </button>
  );
}

/* Soft pill (secondary create/manage style toggles) */
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/25"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ===================== */
/* Employees Table */
/* ===================== */

function StaffTable({
  staff,
  onActivate,
  onDeactivate,
  onDelete,
  onUpdateRole,
  onSetPassword,
}) {
  if (staff.length === 0) {
    return <p className="py-8 text-center text-slate-400">No staff found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Username</th>
            <th className="px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-left font-semibold">Role</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
            <th className="px-4 py-3 text-left font-semibold">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {staff.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                {s.username}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{s.email}</td>
              <td className="px-4 py-3">
                <select
                  value={s.role}
                  onChange={(e) => onUpdateRole(s.id, e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </td>

              <td className="px-4 py-3">
                {s.is_active ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Pending
                  </span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {s.is_active ? (
                    <button
                      onClick={() => onDeactivate(s.id)}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(s.id)}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Activate
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(s.id)}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onSetPassword(s.id)}
                    className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Set Password
                  </button>
                </div>
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
    return <p className="py-8 text-center text-slate-400">No admins found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Username</th>
            <th className="px-4 py-3 text-left font-semibold">Email</th>
            <th className="px-4 py-3 text-left font-semibold">Active</th>
            <th className="px-4 py-3 text-left font-semibold">Last Login</th>
            <th className="px-4 py-3 text-left font-semibold">Created</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {admins.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-slate-50/70">
              <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                {a.username}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{a.email}</td>
              <td className="px-4 py-3">
                {a.is_active ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Disabled
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "Never"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}