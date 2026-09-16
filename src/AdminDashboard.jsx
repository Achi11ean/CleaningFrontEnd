import React, { useEffect, useState } from "react";
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
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";
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
    if (acceptingClients === null || savingIntake) return;

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
    }).catch(err => console.error("Failed to load client count", err));
  }, []);

  useEffect(() => {
    authAxios.get("/client-requests").then((res) => {
      const count = res.data.filter((r) => r.status === "new").length;
      setNewRequestCount(count);
    }).catch(err => console.error("Failed to load request count", err));
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
    { key: "workday", label: "Workday", icon: "work", description: "Today’s schedule, active shifts & checklists" },
    { key: "clients", label: "Clients", icon: "clients", description: "Client care, intake & scheduling", badge: newClientCount + newRequestCount },
    { key: "consultations", label: "Consults", icon: "consult", description: "Consultations, estimates & setup" },
    { key: "employees", label: "Team", icon: "clock", description: "Hours, time off, shifts & supplies", badge: pendingTimeOffCount },
    { key: "services", label: "Services", icon: "sparkle", description: "Your services & photo gallery" },
    { key: "reviews", label: "Reviews", icon: "review", description: "Customer feedback & pending reviews", badge: pendingReviewCount },
    { key: "tasks", label: "Tasks", icon: "task", description: "Keep every detail of your operation organized" },
    { key: "people", label: "Profiles", icon: "profile", description: "Profiles, staff accounts & administrators" },
  ];
  const selectedKey = activeTab === "employees" && employeesSubTab === "profile" ? "people" : activeTab;
  const currentSection = sections.find(item => item.key === selectedKey) || sections[0];
  const selectSection = (key) => {
    if (key === "people") {
      setActiveTab("employees"); setEmployeesSubTab("profile"); setProfileSubTab("me"); return;
    }
    setActiveTab(key);
    if (key === "workday") setWorkDaySubTab("workday");
    if (key === "consultations") setConsultationsSubTab("create");
    if (key === "services") setServicesSubTab("create");
    if (key === "tasks") setTasksSubTab("manage");
    if (key === "employees") { setEmployeesSubTab("hours"); setEmployeesHoursSubTab("weekly"); }
  };
  return (
    <CleaningTheme className="admin-dashboard">
      <style>{dashboardStyles}</style>
      <div className="ad-shell">
        <header className="ad-header"><div className="ad-heading-group"><div className="ad-brand-icon"><CleaningSparkle/></div><div><p className="ad-eyebrow">A Breath of Fresh Air · Administration</p><h1>Admin dashboard</h1><p className="ad-welcome">Your team, your clients, every detail in one place.</p></div></div><button type="button" className="ad-account" aria-label="Open my profile" onClick={() => selectSection("people")}><DashboardIcon name="profile"/><span><strong>{admin?.username || "My profile"}</strong><small>Administrator</small></span><span aria-hidden="true">↗</span></button></header>
        <div className="ad-layout">
          <aside className="ad-sidebar"><p className="ad-nav-label">Your workspace</p><nav className="ad-navigation" aria-label="Admin sections">{sections.map(item => <button type="button" key={item.key} className={`ad-nav-button ${selectedKey === item.key ? "is-active" : ""}`} onClick={() => selectSection(item.key)} aria-pressed={selectedKey === item.key} aria-controls="ad-workspace"><DashboardIcon name={item.icon}/><span>{item.label}</span>{item.badge > 0 && <span className="ad-count" aria-label={`${item.badge} pending`}>{item.badge > 99 ? "99+" : item.badge}</span>}</button>)}</nav><div className="ad-sidebar-note"><CleaningSparkle/><p>A little care.<br/><strong>A sparkling difference.</strong></p></div></aside>
          <main className="ad-main" id="ad-workspace" aria-labelledby="ad-section-title">
            <div className="ad-section-heading"><div><p className="ad-eyebrow">Administration / {currentSection.label}</p><h2 id="ad-section-title">{currentSection.label === "Workday" ? "Your workday" : currentSection.label === "Team" ? "Team operations" : currentSection.label}</h2><p>{currentSection.description}</p></div><span className="ad-section-icon"><DashboardIcon name={currentSection.icon}/></span></div>
            <nav className="ad-alerts" aria-label="Admin shortcuts">
              <button type="button" onClick={() => { setActiveTab("clients"); setClientsSubTab("list"); setClientsListMode("all"); }}><span className={`ad-intake-dot ${acceptingClients ? "is-open" : ""}`}/>{acceptingClients === null ? "Client intake" : acceptingClients ? "Intake open" : "Waitlist mode"} <span aria-hidden="true">↗</span></button>
              {newRequestCount > 0 && <button type="button" onClick={() => { setActiveTab("clients"); setClientsSubTab("list"); setClientsListMode("requests"); }}><span className="ad-count">{newRequestCount}</span> Requests ↗</button>}
              {pendingTimeOffCount > 0 && <button type="button" onClick={() => { setActiveTab("employees"); setEmployeesSubTab("off"); setTimeOffSubTab("manage"); }}><span className="ad-count">{pendingTimeOffCount}</span> Time off ↗</button>}
              {pendingReviewCount > 0 && <button type="button" onClick={() => setActiveTab("reviews")}><span className="ad-count">{pendingReviewCount}</span> Reviews ↗</button>}
              {inventoryShortageAlert && <button type="button" onClick={() => { setActiveTab("employees"); setEmployeesSubTab("inventory"); setInventorySubTab("staff"); }}><span className="ad-warning">!</span> Supplies ↗</button>}
            </nav>
            <div className="ad-module">
          {/* Status */}
          {loading && activeTab === "employees" && employeesSubTab === "profile" && (
            <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
              <span className="text-sm font-medium">Loading…</span>
            </div>
          )}

          {error && activeTab === "employees" && employeesSubTab === "profile" && (
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

              {clientsSubTab === "consultations" && (
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

              {clientsSubTab === "list" && (
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
                        <div className="ad-intake-wrap">
                          <div className="ad-intake-card">
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

                            <button type="button"
                              onClick={toggleIntake}
                              disabled={savingIntake}
                              aria-label="Accept new clients" role="switch" aria-checked={Boolean(acceptingClients)}
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

              {clientsSubTab === "create" && (
                <div className="space-y-8">
                  <CreateSchedules />
                  <Booking />
                </div>
              )}

              {clientsSubTab === "schedules" && (
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

              {tasksSubTab === "manage" && <ManageTasks />}
            </div>
          )}

          {/* ===================== EMPLOYEES ===================== */}
          {activeTab === "employees" && (
            <div className="mt-6">
              {employeesSubTab !== "profile" && <TabBar>
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
              </TabBar>}

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

                  {profileSubTab === "users" && usersSubTab === "staff" && !loading && !error && (
                    <StaffTable
                      staff={staff}
                      onActivate={activateStaff}
                      onDeactivate={deactivateStaff}
                      onDelete={deleteStaff}
                      onUpdateRole={updateRole}
                      onSetPassword={setStaffPassword}
                    />
                  )}

                  {profileSubTab === "users" && usersSubTab === "admins" && !loading && !error && (
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
          {activeTab === "consultations" && consultationsSubTab === "new" && (
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

              {servicesSubTab === "create" && <CreateServices />}
              {servicesSubTab === "manage" && <ManageServices />}
              {servicesSubTab === "gallery" && <CreateGallery />}
              {servicesSubTab === "manage-gallery" && <ManageGallery />}
            </div>
          )}

          {/* ===================== REVIEWS ===================== */}
          {activeTab === "reviews" && (
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

              {workDaySubTab === "checklists" && <AdminChecklistOverview />}

              {workDaySubTab === "workday" && (
                <div className="space-y-6">
                  <div className="px-1">
                    <TodayTasksSlider />
                  </div>
                  <AdminNextShiftBanner />
                </div>
              )}

              {workDaySubTab === "staff" && (
                <div className="space-y-6">
                  <AdminWorkDay />
                  <LiveActiveShiftsManager />
                </div>
              )}
            </div>
          )}

          {/* ===================== INDEPENDENT PANELS ===================== */}
          {activeTab === "employees" && employeesSubTab === "availability" && (
            <div className="mt-6">
              <ManageAvailability />
            </div>
          )}

          {activeTab === "profile" && profileSubTab === "me" && <UserProfile />}
          {activeTab === "profile" && profileSubTab === "users" && usersSubTab === "staff" && !loading && !error && (
            <StaffTable
              staff={staff}
              onActivate={activateStaff}
              onDeactivate={deactivateStaff}
              onDelete={deleteStaff}
              onUpdateRole={updateRole}
              onSetPassword={setStaffPassword}
            />
          )}

          {activeTab === "profile" && profileSubTab === "users" && usersSubTab === "admins" && !loading && !error && (
            <AdminTable admins={admins} />
          )}

          {activeTab === "profile" && profileSubTab === "all" && <AdminAllProfiles />}

          {activeTab === "staff" && (
            <StaffTable
              staff={staff}
              onActivate={activateStaff}
              onDeactivate={deactivateStaff}
              onDelete={deleteStaff}
              onUpdateRole={updateRole}
            />
          )}
            </div>
          </main>
        </div>
        <p className="ad-footer">A Breath of Fresh Air Cleaning Services <span>·</span> Admin workspace</p>
      </div>
    </CleaningTheme>
  );
}


/* ============================================================
   Reusable navigation primitives
   One consistent look for every tab level in the dashboard.
   ============================================================ */

function TabBar({ children }) {
  return <div className="ad-subnav">{children}</div>;
}
function Tab({ active, onClick, children, badge, alert }) {
  return <button type="button" onClick={onClick} className={`ad-sub-button ${active ? "is-active" : ""}`} aria-pressed={active}>{children}{badge > 0 && <span className="ad-count">{badge}</span>}{alert && <span className="ad-warning" aria-label="Needs attention">!</span>}</button>;
}
function Pill({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`ad-pill ${active ? "is-active" : ""}`} aria-pressed={active}>{children}</button>;
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
    <div className="ad-table-wrap">
      <table className="ad-table">
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
              <td data-label="Username" className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                {s.username}
              </td>
              <td data-label="Email" className="whitespace-nowrap px-4 py-3 text-slate-600">{s.email}</td>
              <td data-label="Role" className="px-4 py-3">
                <select
                  aria-label={`Role for ${s.username}`}
                  value={s.role}
                  onChange={(e) => onUpdateRole(s.id, e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </td>

              <td data-label="Status" className="px-4 py-3">
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

              <td data-label="Created" className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}
              </td>

              <td data-label="Actions" className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {s.is_active ? (
                    <button type="button"
                      onClick={() => onDeactivate(s.id)}
                      className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button type="button"
                      onClick={() => onActivate(s.id)}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Activate
                    </button>
                  )}

                  <button type="button"
                    onClick={() => onDelete(s.id)}
                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                  >
                    Delete
                  </button>
                  {onSetPassword && <button type="button"
                    onClick={() => onSetPassword(s.id)}
                    className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                  >
                    Set Password
                  </button>}
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
    <div className="ad-table-wrap">
      <table className="ad-table">
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
              <td data-label="Username" className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                {a.username}
              </td>
              <td data-label="Email" className="whitespace-nowrap px-4 py-3 text-slate-600">{a.email}</td>
              <td data-label="Status" className="px-4 py-3">
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
              <td data-label="Last login" className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "Never"}
              </td>
              <td data-label="Created" className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                {a.created_at ? new Date(a.created_at).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function DashboardIcon({ name }) {
  const paths = {
    clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></>,
    work: <><rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 12q9 5 18 0M10 13h4"/></>,
    clients: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4q3 1 3 6"/></>,
    consult: <><path d="M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><rect x="7" y="2" width="10" height="5" rx="2"/><path d="M7 12h10M7 17h6"/></>,
    sparkle: <><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="M20 2v4m-2-2h4"/></>,
    review: <path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>,
    task: <><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7 12 3 3 7-7"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.sparkle}</svg>;
}

const dashboardStyles = `
.ad-module > .mt-6{margin-top:0}.ad-intake-dot{width:7px;height:7px;border-radius:50%;background:#f6cd8b}.ad-intake-dot.is-open{background:#6ee7b7}.ad-intake-wrap{margin-bottom:18px}.ad-intake-card{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:14px 16px;border:1px solid #d4e6e9;background:#eef8f7;border-radius:14px}.ad-intake-card button{flex-shrink:0}.ad-pill{min-height:44px;padding:9px 15px;background:#e5eef4;border:1px solid #d0e0e9;border-radius:10px;color:#395267;font-size:12px!important;font-weight:650!important}.ad-pill.is-active{background:#123955;color:#d9fcff;border-color:#17657a}.ad-table-wrap{max-width:100%;overflow-x:auto;border:1px solid #dbe6ed;border-radius:14px;background:white}.ad-table{width:100%;font-size:12px;border-collapse:collapse}.ad-table th{font-size:10px!important;white-space:nowrap;background:#ecf3f7}.ad-table td{padding:13px 12px;vertical-align:top}.ad-table td button{min-height:38px}.ad-table select{min-height:40px}.ad-table td[data-label="Email"]{white-space:normal;overflow-wrap:anywhere}.ad-table tbody tr+tr{border-top:1px solid #e3edf2}
@media(max-width:900px){.ad-table-wrap{border:0;background:transparent;overflow:visible}.ad-table,.ad-table tbody{display:block}.ad-table thead{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden}.ad-table tbody{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ad-table tbody tr{display:block;min-width:0;border:1px solid #d5e4ec!important;border-radius:14px;background:white;padding:12px;box-shadow:0 4px 14px #17384b08}.ad-table td{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;white-space:normal!important;overflow-wrap:anywhere;min-width:0;font-size:12px}.ad-table td::before{content:attr(data-label);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#648196;flex-shrink:0}.ad-table td[data-label="Username"]{font-size:16px;font-weight:700;border-bottom:1px solid #e1ebf1;padding:2px 0 12px;margin-bottom:5px}.ad-table td[data-label="Username"]::before{display:none}.ad-table td[data-label="Email"]{display:block}.ad-table td[data-label="Email"]::before{display:block;margin-bottom:4px}.ad-table td[data-label="Actions"]{display:block;border-top:1px solid #e1ebf1;margin-top:5px;padding-top:12px}.ad-table td[data-label="Actions"]::before{display:none}.ad-table td[data-label="Actions"]>div{display:grid;grid-template-columns:1fr 1fr;gap:7px}.ad-table td button{min-height:44px;font-size:11px}.ad-table select{font-size:16px}}
@media(max-width:600px){.ad-table tbody{grid-template-columns:1fr}.ad-intake-card{padding:12px}.ad-intake-card p{font-size:12px}}

.admin-dashboard{--ad-panel:#0b192e;--ad-line:#7dd3fc26}.ad-shell{width:min(1500px,calc(100% - 48px));margin:0 auto;padding:110px 0 24px}.ad-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:8px 0 26px}.ad-heading-group{display:flex;align-items:center;gap:15px;min-width:0}.ad-brand-icon{display:grid;place-items:center;width:52px;height:52px;flex-shrink:0;border:1px solid #67e8f94d;border-radius:17px;background:linear-gradient(140deg,#174568,#103238);box-shadow:0 0 28px #38bdf816}.ad-brand-icon svg{width:27px;color:#9bf8e1}.ad-eyebrow{font-size:9px;letter-spacing:.17em;text-transform:uppercase;font-weight:700;color:#8edcea;line-height:1.7}.admin-dashboard .ad-header h1{font-family:inherit;font-size:clamp(24px,3vw,35px);font-weight:700;letter-spacing:-.045em;line-height:1.15;margin:5px 0 7px}.ad-welcome{font-size:12px;color:#a9c0d3;line-height:1.6}.ad-account{display:flex;align-items:center;gap:12px;border:1px solid var(--ad-line);padding:11px 15px;border-radius:15px;background:#0c1d32;color:#e6f6ff;text-align:left;flex-shrink:0}.ad-account>svg{width:20px}.ad-account strong{display:block;font-size:12px;font-weight:650}.ad-account small{display:block;font-size:10px;color:#9bb4c8;margin-top:3px}.ad-account>span:last-child{color:#7dd3fc}.ad-layout{display:grid;grid-template-columns:190px minmax(0,1fr);gap:22px;align-items:start}.ad-sidebar{position:sticky;top:100px;background:linear-gradient(155deg,#0d2239ee,#060f1fee);border:1px solid var(--ad-line);border-radius:20px;padding:16px 10px}.ad-nav-label{font-size:9px;font-weight:750;color:#8aa6bd;text-transform:uppercase;letter-spacing:.18em;padding:0 12px 14px}.ad-navigation{display:flex;flex-direction:column;gap:5px}.ad-nav-button{display:flex;align-items:center;gap:11px;min-height:46px;width:100%;padding:10px 12px;background:transparent;border:1px solid transparent;border-radius:12px;color:#b5cbdc;text-align:left;font-size:12px!important;font-weight:650!important;transition:background .2s,color .2s}.ad-nav-button>svg{width:19px;height:19px;flex-shrink:0}.ad-nav-button:hover{background:#18344e;color:#effcff}.ad-nav-button.is-active{color:#051726;background:linear-gradient(110deg,#7dd3fc,#70efcf);box-shadow:0 4px 18px #38bdf824}.ad-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;min-height:20px;padding:2px 5px;font-size:10px;line-height:1.3;font-weight:750;color:#071828;background:#8ce8fa;border-radius:7px;flex-shrink:0}.ad-nav-button .ad-count,.ad-nav-button .ad-warning{margin-left:auto}.ad-nav-button.is-active .ad-count{background:#092b42;color:#d9fbff}.ad-warning{display:inline-grid;place-items:center;width:20px;height:20px;background:#ffdab0;color:#663600;border-radius:7px;font-size:12px;font-weight:800}.ad-sidebar-note{display:flex;align-items:center;gap:10px;padding:22px 9px 7px;margin-top:20px;border-top:1px solid var(--ad-line)}.ad-sidebar-note svg{width:20px;color:#6ee7b7;flex-shrink:0}.ad-sidebar-note p{font-size:10px;line-height:1.8;color:#8aa9be}.ad-sidebar-note strong{font-weight:500;color:#c5e7ed}.ad-main{min-width:0}.ad-section-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:2px 0 18px}.admin-dashboard .ad-section-heading h2{font-family:inherit;font-size:23px;font-weight:650;letter-spacing:-.025em;line-height:1.2;margin:5px 0 7px}.ad-section-heading>div>p:last-child{font-size:12px;color:#a9c0d3}.ad-section-icon{display:grid;place-items:center;background:#13314a;border:1px solid var(--ad-line);border-radius:14px;width:43px;height:43px;color:#8fedec;flex-shrink:0}.ad-section-icon svg{width:22px}.ad-alerts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px}.ad-alerts button{display:inline-flex;align-items:center;gap:8px;min-height:38px;background:#11263e;border:1px solid #7dd3fc33;border-radius:10px;color:#d4edf6;padding:7px 10px;font-size:10px!important;font-weight:600!important}.ad-alerts button:hover{background:#1d3b54}.ad-module{min-width:0;background:#f8fafc;color:#172c40;border:1px solid #8acfea40;border-radius:18px;padding:16px;box-shadow:0 16px 50px #0003;overflow-wrap:anywhere}.ad-module>div{min-width:0}.ad-subnav{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#0d2139;border:1px solid #7dd3fc26;border-radius:13px;padding:6px;margin:0 0 16px;max-width:100%}.ad-sub-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;min-width:0;padding:9px 13px;border:1px solid transparent;border-radius:9px;color:#bfd6e4;background:transparent;font-size:12px!important;font-weight:600!important;line-height:1.4;text-align:center;transition:background .2s}.ad-sub-button:hover{background:#20415b;color:#efffff}.ad-sub-button.is-active{background:#d9f7fa;color:#0c4254;border-color:#b5eff3;box-shadow:0 2px 6px #0001}.ad-client-tabs{margin-bottom:14px}.ad-client-tabs .ad-subnav:last-child{margin-bottom:0}.ad-nested{padding:8px;border:1px solid #dbe8ee;border-radius:14px}.ad-footer{font-size:10px;line-height:1.8;color:#799aaf;text-align:center;margin-top:24px!important}.ad-footer span{margin:0 8px}
@media(max-width:1050px){.ad-shell{width:calc(100% - 32px)}.ad-layout{grid-template-columns:160px minmax(0,1fr);gap:16px}.ad-sidebar{padding:12px 7px}.ad-nav-button{padding-inline:9px;gap:8px}.ad-module{padding:12px}.ad-sub-button{padding-inline:10px}}
@media(max-width:760px){.ad-shell{width:calc(100% - 24px);padding-top:98px}.ad-header{gap:10px;padding-bottom:18px}.ad-heading-group{gap:10px}.ad-brand-icon{width:39px;height:39px;border-radius:12px}.ad-brand-icon svg{width:21px}.ad-header .ad-eyebrow{font-size:8px;letter-spacing:.1em;max-width:240px}.admin-dashboard .ad-header h1{font-size:25px}.ad-welcome{display:none}.ad-account{padding:10px;border-radius:12px}.ad-account>span{display:none}.ad-account>svg{width:19px;height:19px}.ad-layout{display:block}.ad-sidebar{position:static;padding:8px;border-radius:16px;margin-bottom:18px}.ad-nav-label,.ad-sidebar-note{display:none}.ad-navigation{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.ad-nav-button{position:relative;flex-direction:column;justify-content:center;gap:5px;padding:9px 3px;min-height:61px;font-size:10px!important;border-radius:10px}.ad-nav-button>svg{width:19px;height:19px}.ad-nav-button .ad-count,.ad-nav-button .ad-warning{position:absolute;top:3px;right:3px;min-width:16px;min-height:16px;height:auto;font-size:8px;padding:1px 3px;border-radius:5px}.ad-section-heading{margin:0 2px 14px}.admin-dashboard .ad-section-heading h2{font-size:21px}.ad-section-heading>div>p:last-child{font-size:11px;line-height:1.5}.ad-section-heading .ad-eyebrow{font-size:8px}.ad-section-icon{width:35px;height:35px;border-radius:10px}.ad-section-icon svg{width:18px}.ad-alerts{gap:6px}.ad-alerts button{flex:1 1 auto;justify-content:center;font-size:10px!important;padding:6px 8px}.ad-module{padding:9px;border-radius:14px}.ad-subnav{gap:4px;padding:5px;margin-bottom:12px;border-radius:11px}.ad-sub-button{flex:1 1 auto;min-height:44px;padding:8px;font-size:11px!important}.ad-nested{padding:5px}.ad-footer{font-size:9px;padding-inline:10px}.ad-module input,.ad-module select,.ad-module textarea{max-width:100%;font-size:16px}.ad-module img{max-width:100%}}
@media(max-width:360px){.ad-shell{width:calc(100% - 16px)}.ad-module{padding:6px}.ad-header .ad-eyebrow{font-size:7px}.admin-dashboard .ad-header h1{font-size:23px}}
`;
