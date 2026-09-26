import React, { useState, useEffect } from "react";
import { useStaff } from "./StaffContext";
import StaffClock from "./StaffClock";
import UserProfile from "./UserProfile";
import StaffClients from "./StaffClients";
import ClientSchedulesManagers from "./ClientSchedulesManagers"; // 👈 NEW
import ManagerCreateSchedules from "./ManagerCreateSchedules"; // 👈 NEW
import AllAvailability from "./AllAvailability";
import ManualTimeEntry from "./ManualTimeEntry";
import AdminWorkShifts from "./AdminWorkShifts";
import AdminWeekly from "./AdminWeekly";
import ManagerBooking from "./ManagerBooking";
import TodayTasksSlider from "./TodayTasksSlider";
import LiveActiveShiftsManager from "./LiveActiveShiftsManager";
import StaffWorkDayCalendar from "./StaffWorkDayCalendar"; // 👈 NEW
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
import NextShiftBanner from "./NextShiftBanner";
import CreateServices from "./CreateServices";
import ManageServices from "./ManageServices";
import Availability from "./Availability";
import ManageReviews from "./ManageReviews";
import Applications from "./Applications";
import ManageAvailability from "./ManageAvailability";
import ManagerAllStaffProfiles from "./ManagerAllStaffProfiles";
import CreateGallery from "./CreateGallery";
import ManageGallery from "./ManageGallery";
import MyShifts from "./MyShifts";
import ClientInquiry from "./ClientInquiry";
import StaffWeeklyHours from "./StaffWeeklyHours";
import CreateConsultation from "./CreateConsultation";
import CreateSection from "./CreateSection";
import CreateConsultItem from "./CreateConsultItem";
import CreateMultiplier from "./CreateMultiplier";
import WorkDayLive from "./AdminWorkDay";
import ManageConsults from "./ManageConsults";
import ManageSectionsItems from "./ManageSectionsItems";
import ManageMultipliers from "./ManageMultipliers";
import Booking from "./Booking";
import ConsultationSelector from "./ConsultationSelector";
import ConductConsultation from "./ConductConsultation";
import ConsultationList from "./ConsultationList";
import ManageTasks from "./ManageTasks";
import ViewConsultation from "./ViewConsultation";
import CleaningTheme, { CleaningSparkle } from "./CleaningTheme";
export default function StaffDashboard() {
const { staff, authAxios } = useStaff();
const [timeOffSubTab, setTimeOffSubTab] = useState("create");
const [clockSubTab, setClockSubTab] = useState("timeclock");
const [profileSubTab, setProfileSubTab] = useState("me");
const [clientsListMode, setClientsListMode] = useState("all");
const [workSubTab, setWorkSubTab] = useState("active");
const [servicesSubTab, setServicesSubTab] = useState("create");
const [newRequestCount, setNewRequestCount] = useState(0);
const [pendingTimeOffCount, setPendingTimeOffCount] = useState(0);
const [pendingReviewCount, setPendingReviewCount] = useState(0);
const [inventoryShortageAlert, setInventoryShortageAlert] = useState(false);
const [consultationsSubTab, setConsultationsSubTab] = useState("new");
const [consultSetupTab, setConsultSetupTab] = useState("consultation");
const [consultSetupMode, setConsultSetupMode] = useState("create");
const [activeConsultationId, setActiveConsultationId] = useState(null);
const [tasksSubTab, setTasksSubTab] = useState("manage"); // "create" | "manage"
useEffect(() => {
  if (staff?.role !== "manager") return;
  authAxios.get("/client-requests")
    .then(res => {
      const count = res.data.filter(r => r.status === "new").length;
      setNewRequestCount(count);
    })
    .catch(console.error);
}, [staff, authAxios]);
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
  const [shiftsSubTab, setShiftsSubTab] = useState("shifts");
// "shifts" | "week"
  const [clientSubTab, setClientSubTab] = useState("list"); 
const [inventorySubTab, setInventorySubTab] = useState("my");
const [purchaseSubTab, setPurchaseSubTab] = useState("history"); // for nested purchases
useEffect(() => {
  if (clientSubTab !== "list") {
    setClientsListMode("all");
  }
}, [clientSubTab]);
  const isManager = staff?.role === "manager";
  const navigation = [
    { key: "clock", label: "Time", icon: "clock", description: "Clock in, time off & shift history", count: pendingTimeOffCount },
    { key: "workday", label: "Work", icon: "work", description: "Your workday, calendar & supplies", alert: inventoryShortageAlert },
    { key: "clients", label: "Clients", icon: "clients", description: "Client information & scheduling", count: newRequestCount },
    ...(isManager ? [
      { key: "consultations", label: "Consults", icon: "consult", description: "Consultations, estimates & setup" },
      { key: "services", label: "Services", icon: "sparkle", description: "Services & photo gallery" },
      { key: "reviews", label: "Reviews", icon: "review", description: "Review and manage customer feedback", count: pendingReviewCount },
      { key: "tasks", label: "Tasks", icon: "task", description: "Organize the details of a great clean" },
    { key: "applications", label: "Applications", icon: "applications", description: "Review and manage job applications" },
    ] : []),
    { key: "profile", label: "Profile", icon: "profile", description: "Your details & availability" },
  ];
  const selected = navigation.find(item => item.key === activeTab) || navigation[0];
  const selectTab = (key) => {
    setActiveTab(key);
    if (key === "clients") setClientSubTab("list");
    if (key === "tasks") setTasksSubTab("manage");
    if (key === "services") setServicesSubTab("create");
  };
  return (
    <CleaningTheme className="staff-dashboard">
      <style>{dashboardStyles}</style>
      <div className="sd-shell">
        <header className="sd-header">
          <div className="sd-heading-group"><div className="sd-brand-icon"><CleaningSparkle /></div><div><p className="sd-eyebrow">A Breath of Fresh Air · Team workspace</p><h1>Staff dashboard</h1><p className="sd-welcome">Everything you need for a beautifully organized day.</p></div></div>
          <button type="button" className="sd-account" onClick={() => { setProfileSubTab("me"); selectTab("profile"); }} aria-label="Open my profile"><DashboardIcon name="profile"/><span><strong>My profile</strong><small>{isManager ? "Manager" : "Team member"}</small></span><span aria-hidden="true">↗</span></button>
        </header>
        <div className="sd-layout">
          <aside className="sd-sidebar">
            <p className="sd-nav-label">Your workspace</p>
            <nav className="sd-navigation" aria-label="Dashboard sections">{navigation.map(item => <button type="button" key={item.key} className={`sd-nav-button ${activeTab === item.key ? "is-active" : ""}`} onClick={() => selectTab(item.key)} aria-pressed={activeTab === item.key} aria-controls="sd-workspace"><DashboardIcon name={item.icon}/><span>{item.label}</span>{isManager && item.count > 0 && <span className="sd-count" aria-label={`${item.count} pending`}>{item.count > 99 ? "99+" : item.count}</span>}{isManager && item.alert && <span className="sd-warning" aria-label="Inventory needs attention">!</span>}</button>)}</nav>
            <div className="sd-sidebar-note"><CleaningSparkle/><p>A little care.<br/><strong>A sparkling difference.</strong></p></div>
          </aside>
          <main className="sd-main" id="sd-workspace" aria-labelledby="sd-section-title">
            <div className="sd-section-heading"><div><p className="sd-eyebrow">Workspace / {selected.label}</p><h2 id="sd-section-title">{selected.label === "Time" ? "Time & attendance" : selected.label === "Work" ? "Your workday" : selected.label}</h2><p>{selected.description}</p></div><span className="sd-section-icon"><DashboardIcon name={selected.icon}/></span></div>
            {isManager && (newRequestCount > 0 || pendingTimeOffCount > 0 || pendingReviewCount > 0 || inventoryShortageAlert) && <nav className="sd-alerts" aria-label="Items needing attention">
              {newRequestCount > 0 && <button type="button" onClick={() => { setActiveTab("clients"); setClientSubTab("list"); setClientsListMode("requests"); }}><span className="sd-count">{newRequestCount}</span> New requests <span aria-hidden="true">↗</span></button>}
              {pendingTimeOffCount > 0 && <button type="button" onClick={() => { setActiveTab("clock"); setClockSubTab("off"); setTimeOffSubTab("manage"); }}><span className="sd-count">{pendingTimeOffCount}</span> Time off <span aria-hidden="true">↗</span></button>}
              {pendingReviewCount > 0 && <button type="button" onClick={() => setActiveTab("reviews")}><span className="sd-count">{pendingReviewCount}</span> Reviews <span aria-hidden="true">↗</span></button>}
              {inventoryShortageAlert && <button type="button" onClick={() => { setActiveTab("workday"); setWorkSubTab("inventory"); setInventorySubTab("staff"); }}><span className="sd-warning">!</span> Supplies <span aria-hidden="true">↗</span></button>}
            </nav>}
            <div className="sd-module">
        {/* CLIENT SUB-TABS */}
  {activeTab === "clients" && (
  <div className="sd-client-tabs">
    {/* PRIMARY CLIENT TABS */}
    <div className="sd-subnav">
      <button type="button"
        onClick={() => {
          setClientSubTab("list");
          setClientsListMode("all");
        }}
        className={`sd-sub-button ${clientSubTab === "list" ? "is-active" : ""}`} aria-pressed={clientSubTab === "list"}
      >
        Client List
      </button>
{staff?.role === "manager" && (
  <button type="button"
    onClick={() => setClientSubTab("new")}
    className={`sd-sub-button ${clientSubTab === "new" ? "is-active" : ""}`} aria-pressed={clientSubTab === "new"}
  >
    New
  </button>
)}
      {staff?.role === "manager" && (
        <>
          <button type="button"
            onClick={() => setClientSubTab("schedules")}
            className={`sd-sub-button ${clientSubTab === "schedules" ? "is-active" : ""}`} aria-pressed={clientSubTab === "schedules"}
          >
            Schedules
          </button>
          <button type="button"
            onClick={() => setClientSubTab("create")}
            className={`sd-sub-button ${clientSubTab === "create" ? "is-active" : ""}`} aria-pressed={clientSubTab === "create"}
          >
            Create
          </button>
        </>
      )}
    </div>
    {/* 🔽 NESTED TABS UNDER CLIENT LIST (MANAGERS ONLY) */}
    {clientSubTab === "list" && staff?.role === "manager" && (
      <div className="sd-subnav">
        <button type="button"
          onClick={() => setClientsListMode("all")}
          className={`sd-sub-button ${clientsListMode === "all" ? "is-active" : ""}`} aria-pressed={clientsListMode === "all"}
        >
          All
        </button>
        <button type="button"
          onClick={() => setClientsListMode("requests")}
          className={`sd-sub-button ${clientsListMode === "requests" ? "is-active" : ""}`} aria-pressed={clientsListMode === "requests"}
        >
          Requests
        </button>
      </div>
    )}
  </div>
)}
{activeTab === "applications" && isManager && <Applications />}

{activeTab === "tasks" && staff?.role === "manager" && (
  <>
    {/* TASKS SUB TABS */}
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setTasksSubTab("manage")}
        className={`sd-sub-button ${tasksSubTab === "manage" ? "is-active" : ""}`} aria-pressed={tasksSubTab === "manage"}
      >
       Tasks
      </button>
    </div>
    {/* TASKS CONTENT */}
    {tasksSubTab === "manage" && <ManageTasks />}
  </>
)}
{activeTab === "consultations" && isManager && (
  <>
    {/* MAIN SUB TABS */}
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setConsultationsSubTab("new")}
        className={`sd-sub-button ${consultationsSubTab === "new" ? "is-active" : ""}`} aria-pressed={consultationsSubTab === "new"}
      >
        Begin
      </button>
      {staff?.role === "manager" && (
        <button type="button"
          onClick={() => setConsultationsSubTab("create")}
          className={`sd-sub-button ${consultationsSubTab === "create" ? "is-active" : ""}`} aria-pressed={consultationsSubTab === "create"}
        >
          Tools
        </button>
      )}
      <button type="button"
        onClick={() => setConsultationsSubTab("list")}
        className={`sd-sub-button ${consultationsSubTab === "list" ? "is-active" : ""}`} aria-pressed={consultationsSubTab === "list"}
      >
        All
      </button>
    </div>
    {/* ================= BEGIN CONSULT ================= */}
    {consultationsSubTab === "new" && (
      <div className="space-y-6">
        <ConsultationSelector
          value={activeConsultationId}
          onSelect={setActiveConsultationId}
        />
        {activeConsultationId && (
          <ConductConsultation consultationId={activeConsultationId} />
        )}
      </div>
    )}
    {/* ================= TOOLS ================= */}
    {consultationsSubTab === "create" && staff?.role === "manager" && (
      <div className="space-y-6">
        {/* Setup Tabs */}
        <div className="sd-subnav">
          {[
            ["consultation", "Consultation"],
            ["modules", "Modules"],
            ["multipliers", "Multipliers"],
          ].map(([key, label]) => (
            <button type="button"
              key={key}
              onClick={() => {
                setConsultSetupTab(key);
                setConsultSetupMode("create");
              }}
              className={`sd-sub-button ${consultSetupTab === key ? "is-active" : ""}`} aria-pressed={consultSetupTab === key}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Create/Manage toggle */}
        <div className="sd-subnav">
          {["create", "manage"].map((mode) => (
            <button type="button"
              key={mode}
              onClick={() => setConsultSetupMode(mode)}
              className={`sd-sub-button ${consultSetupMode === mode ? "is-active" : ""}`} aria-pressed={consultSetupMode === mode}
            >
              {mode === "create" ? "Create" : "Manage"}
            </button>
          ))}
        </div>
        {/* CONTENT */}
        <div className="pt-4">
          {/* CONSULTATION */}
          {consultSetupTab === "consultation" &&
            consultSetupMode === "create" && (
              <CreateConsultation
                onCreated={(c) => {
                  setActiveConsultationId(c.id);
                  setConsultationsSubTab("new");
                }}
              />
            )}
          {consultSetupTab === "consultation" &&
            consultSetupMode === "manage" && (
              <ManageConsults
                onSelect={(id) => {
                  setActiveConsultationId(id);
                  setConsultationsSubTab("new");
                }}
              />
            )}
          {/* MODULES */}
          {consultSetupTab === "modules" &&
            consultSetupMode === "create" && (
              <>
                <CreateSection />
                <CreateConsultItem />
              </>
            )}
          {consultSetupTab === "modules" &&
            consultSetupMode === "manage" && <ManageSectionsItems />}
          {/* MULTIPLIERS */}
          {consultSetupTab === "multipliers" &&
            consultSetupMode === "create" && <CreateMultiplier />}
          {consultSetupTab === "multipliers" &&
            consultSetupMode === "manage" && <ManageMultipliers />}
        </div>
      </div>
    )}
    {/* ================= ALL CONSULTATIONS ================= */}
    {consultationsSubTab === "list" && (
      <div className="space-y-6">
        <ConsultationList onSelect={setActiveConsultationId} />
        {activeConsultationId && (
          <ViewConsultation consultationId={activeConsultationId} />
        )}
      </div>
    )}
  </>
)}
{activeTab === "services" && staff?.role === "manager" && (
  <>
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setServicesSubTab("create")}
        className={`sd-sub-button ${servicesSubTab === "create" ? "is-active" : ""}`} aria-pressed={servicesSubTab === "create"}
      >
        Create Service
      </button>
      <button type="button"
        onClick={() => setServicesSubTab("manage")}
        className={`sd-sub-button ${servicesSubTab === "manage" ? "is-active" : ""}`} aria-pressed={servicesSubTab === "manage"}
      >
        Manage Services
      </button>
      <button type="button"
        onClick={() => setServicesSubTab("gallery-create")}
        className={`sd-sub-button ${servicesSubTab === "gallery-create" ? "is-active" : ""}`} aria-pressed={servicesSubTab === "gallery-create"}
      >
        Gallery +
      </button>
      <button type="button"
        onClick={() => setServicesSubTab("gallery-manage")}
        className={`sd-sub-button ${servicesSubTab === "gallery-manage" ? "is-active" : ""}`} aria-pressed={servicesSubTab === "gallery-manage"}
      >
        Manage Gallery
      </button>
    </div>
    {/* Services Content */}
    {servicesSubTab === "create" && <CreateServices />}
    {servicesSubTab === "manage" && <ManageServices />}
    {servicesSubTab === "gallery-create" && <CreateGallery />}
    {servicesSubTab === "gallery-manage" && <ManageGallery />}
  </>
)}
{activeTab === "workday" && (
  <>
    {/* WORK SUB TABS */}
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setWorkSubTab("active")}
        className={`sd-sub-button ${workSubTab === "active" ? "is-active" : ""}`} aria-pressed={workSubTab === "active"}
      >
        Work
      </button>
            <button type="button"
        onClick={() => setWorkSubTab("calendar")}
        className={`sd-sub-button ${workSubTab === "calendar" ? "is-active" : ""}`} aria-pressed={workSubTab === "calendar"}
      >
         Calendar
      </button>
      <button type="button"
  onClick={() => setWorkSubTab("inventory")}
  className={`sd-sub-button ${workSubTab === "inventory" ? "is-active" : ""}`} aria-pressed={workSubTab === "inventory"}
>
  Inventory
  {inventoryShortageAlert && (
    <span className="ml-1 text-orange-500 font-bold">!</span>
  )}
</button>
      {staff?.role === "manager" && (
        <button type="button"
          onClick={() => setWorkSubTab("live")}
          className={`sd-sub-button ${workSubTab === "live" ? "is-active" : ""}`} aria-pressed={workSubTab === "live"}
        >
          Live
        </button>
      )}
    </div>
    {/* WORK CONTENT */}
    {workSubTab === "calendar" && <StaffWorkDayCalendar />}
{workSubTab === "active" && (
  <div className="space-y-6">
          <div className="px-4">
          <TodayTasksSlider />
        </div>
    <NextShiftBanner />
  </div>
)}
    {workSubTab === "live" && staff?.role === "manager" && (
      <div>
      <WorkDayLive />
        <LiveActiveShiftsManager />
      </div>
    )}
    {workSubTab === "inventory" && (
  <>
    {staff?.role === "manager" ? (
      <>
        {/* Inventory Sub Tabs */}
        <div className="sd-subnav">
          <button type="button"
            onClick={() => setInventorySubTab("my")}
            className={`sd-sub-button ${inventorySubTab === "my" ? "is-active" : ""}`} aria-pressed={inventorySubTab === "my"}
          >
            My Inventory
          </button>
          <button type="button"
            onClick={() => setInventorySubTab("create")}
            className={`sd-sub-button ${inventorySubTab === "create" ? "is-active" : ""}`} aria-pressed={inventorySubTab === "create"}
          >
            Create
          </button>
          <button type="button"
            onClick={() => setInventorySubTab("manage")}
            className={`sd-sub-button ${inventorySubTab === "manage" ? "is-active" : ""}`} aria-pressed={inventorySubTab === "manage"}
          >
            Manage
          </button>
          <button type="button"
            onClick={() => setInventorySubTab("staff")}
            className={`sd-sub-button ${inventorySubTab === "staff" ? "is-active" : ""}`} aria-pressed={inventorySubTab === "staff"}
          >
            Staff
          </button>
          <button type="button"
            onClick={() => setInventorySubTab("purchases")}
            className={`sd-sub-button ${inventorySubTab === "purchases" ? "is-active" : ""}`} aria-pressed={inventorySubTab === "purchases"}
          >
            Purchases
          </button>
        </div>
        {inventorySubTab === "create" && <CreateInventoryItem />}
        {inventorySubTab === "manage" && <ManageInventory />}
        {inventorySubTab === "staff" && (
          <>
            <ControlStaffInventory />
            <StaffInventoryOverview />
          </>
        )}
   {inventorySubTab === "purchases" && (
  <div className="sd-nested">
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setPurchaseSubTab("create")}
        className={`sd-sub-button ${purchaseSubTab === "create" ? "is-active" : ""}`} aria-pressed={purchaseSubTab === "create"}
      >
        Add Purchase
      </button>
      <button type="button"
        onClick={() => setPurchaseSubTab("history")}
        className={`sd-sub-button ${purchaseSubTab === "history" ? "is-active" : ""}`} aria-pressed={purchaseSubTab === "history"}
      >
        Purchase History
      </button>
    </div>
    {purchaseSubTab === "create" && (
      <CreatePurchase onPurchaseAdded={() => setPurchaseSubTab("history")} />
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
  </>
)}
{activeTab === "reviews" && staff?.role === "manager" && (
  <ManageReviews />
)}
{activeTab === "timeoff" && (
  <div className="sd-subnav">
    <button type="button"
      onClick={() => setTimeOffSubTab("create")}
      className={`sd-sub-button ${timeOffSubTab === "create" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "create"}
    >
      Request 
    </button>
    <button type="button"
      onClick={() => setTimeOffSubTab("my")}
      className={`sd-sub-button ${timeOffSubTab === "my" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "my"}
    >
      Requests
    </button>
    {staff?.role === "manager" && (
      <button type="button"
        onClick={() => setTimeOffSubTab("manage")}
        className={`sd-sub-button ${timeOffSubTab === "manage" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "manage"}
      >
        Approvals
      </button>
    )}
    {staff?.role === "manager" && (
  <button type="button"
    onClick={() => setTimeOffSubTab("availability")}
    className={`sd-sub-button ${timeOffSubTab === "availability" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "availability"}
  >
    Availability
  </button>
)}
  </div>
)}
{/* CLOCK SUB-TABS */}
{activeTab === "clock" && (
  <div className="sd-subnav">
    <button type="button"
      onClick={() => setClockSubTab("timeclock")}
      className={`sd-sub-button ${clockSubTab === "timeclock" ? "is-active" : ""}`} aria-pressed={clockSubTab === "timeclock"}
    >
      Time
    </button>
    <button type="button"
      onClick={() => setClockSubTab("staff")}
      className={`sd-sub-button ${clockSubTab === "staff" ? "is-active" : ""}`} aria-pressed={clockSubTab === "staff"}
    >
      Staff
    </button>
    <button type="button"
      onClick={() => setClockSubTab("off")}
      className={`sd-sub-button ${clockSubTab === "off" ? "is-active" : ""}`} aria-pressed={clockSubTab === "off"}
    >
      Off
      {pendingTimeOffCount > 0 && (
        <span className="sd-count">
          {pendingTimeOffCount}
        </span>
      )}
    </button>
    <button type="button"
  onClick={() => setClockSubTab("shifts")}
  className={`sd-sub-button ${clockSubTab === "shifts" ? "is-active" : ""}`} aria-pressed={clockSubTab === "shifts"}
>
  History
</button>
  </div>
)}
        {/* Content */}
{activeTab === "clock" && (
  <>
    {/* TIME CLOCK */}
   {clockSubTab === "timeclock" && (
  <div className="space-y-6">
    <div className="px-4">
      <TodayTasksSlider />
    </div>
    <StaffClock
      onRequestInventory={() => {
        setActiveTab("workday");
        setWorkSubTab("inventory");
      }}
    />
  </div>
)}
    {/* STAFF AVAILABILITY */}
    {clockSubTab === "staff" && (
      <div className="mt-4">
        <AllAvailability />
      </div>
    )}
    {/* TIME OFF */}
    {clockSubTab === "off" && (
      <>
        <div className="sd-subnav">
          <button type="button"
            onClick={() => setTimeOffSubTab("create")}
            className={`sd-sub-button ${timeOffSubTab === "create" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "create"}
          >
            New
          </button>
          <button type="button"
            onClick={() => setTimeOffSubTab("my")}
            className={`sd-sub-button ${timeOffSubTab === "my" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "my"}
          >
            Requests
          </button>
          {staff?.role === "manager" && (
            <>
              <button type="button"
                onClick={() => setTimeOffSubTab("manage")}
                className={`sd-sub-button ${timeOffSubTab === "manage" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "manage"}
              >
                Approvals
              </button>
              <button type="button"
                onClick={() => setTimeOffSubTab("availability")}
                className={`sd-sub-button ${timeOffSubTab === "availability" ? "is-active" : ""}`} aria-pressed={timeOffSubTab === "availability"}
              >
                Availability
              </button>
            </>
          )}
        </div>
        {timeOffSubTab === "create" && <CreateTimeOffRequest />}
        {timeOffSubTab === "my" && <ViewMyTimeOffRequests />}
        {timeOffSubTab === "manage" && staff?.role === "manager" && <BossTimeOff />}
        {timeOffSubTab === "availability" && staff?.role === "manager" && (
          <ManageAvailability />
        )}
      </>
    )}
    {/* SHIFTS */}
    {clockSubTab === "shifts" && (
      <>
        {/* SHIFTS SUB TABS */}
       {/* HISTORY SUB TABS */}
<div className="sd-subnav">
  <button type="button"
    onClick={() => setShiftsSubTab("shifts")}
    className={`sd-sub-button ${shiftsSubTab === "shifts" ? "is-active" : ""}`} aria-pressed={shiftsSubTab === "shifts"}
  >
    My Shifts
  </button>
  <button type="button"
    onClick={() => setShiftsSubTab("week")}
    className={`sd-sub-button ${shiftsSubTab === "week" ? "is-active" : ""}`} aria-pressed={shiftsSubTab === "week"}
  >
    My Week
  </button>
  {/* {staff?.role === "manager" && (
    <button type="button"
      onClick={() => setShiftsSubTab("manual")}
      className={`sd-sub-button ${shiftsSubTab === "manual" ? "is-active" : ""}`} aria-pressed={shiftsSubTab === "manual"}
    >
      Manual
    </button>
  )} */}
  {staff?.role === "manager" && (
    <button type="button"
      onClick={() => setShiftsSubTab("admin")}
      className={`sd-sub-button ${shiftsSubTab === "admin" ? "is-active" : ""}`} aria-pressed={shiftsSubTab === "admin"}
    >
      Shifts
    </button>
  )}
{staff?.role === "manager" && (
  <button type="button"
    onClick={() => setShiftsSubTab("hours")}
    className={`sd-sub-button ${shiftsSubTab === "hours" ? "is-active" : ""}`} aria-pressed={shiftsSubTab === "hours"}
  >
    Hours
  </button>
)}
</div>
  {shiftsSubTab === "shifts" && <MyShifts mode="staff" />}
{shiftsSubTab === "week" && <StaffWeeklyHours />}
{shiftsSubTab === "manual" && staff?.role === "manager" && (
  <ManualTimeEntry />
)}
{shiftsSubTab === "admin" && staff?.role === "manager" && (
  <AdminWorkShifts />
)}
{shiftsSubTab === "hours" && staff?.role === "manager" && (
  <AdminWeekly />
)}
      </>
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
      <div>
        <Booking/>
      <ClientSchedulesManagers />
   </div> )}
    {clientSubTab === "create" && staff?.role === "manager" && (
      <>
        <ManagerCreateSchedules />
        <ManagerBooking />
      </>
    )}
  </>
)}
{/* TIME OFF CONTENT */}
{activeTab === "profile" && (
  <>
    {/* PROFILE SUB-TABS */}
    <div className="sd-subnav">
      <button type="button"
        onClick={() => setProfileSubTab("me")}
        className={`sd-sub-button ${profileSubTab === "me" ? "is-active" : ""}`} aria-pressed={profileSubTab === "me"}
      >
        My Profile
      </button>
      {staff?.role === "manager" && (
        <button type="button"
          onClick={() => setProfileSubTab("staff")}
          className={`sd-sub-button ${profileSubTab === "staff" ? "is-active" : ""}`} aria-pressed={profileSubTab === "staff"}
        >
          Staff Notes
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
          </main>
        </div>
        <p className="sd-footer">A Breath of Fresh Air Cleaning Services <span>·</span> Team workspace</p>
      </div>
    </CleaningTheme>
  );
}
function DashboardIcon({ name }) {
  const paths = {
    applications: <><path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="6" rx="2"/><path d="M8 12h8M8 16h8"/></>,
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
.staff-dashboard{--sd-panel:#0b192e;--sd-line:#7dd3fc26}.sd-shell{width:min(1500px,calc(100% - 48px));margin:0 auto;padding:110px 0 24px}.sd-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:8px 0 26px}.sd-heading-group{display:flex;align-items:center;gap:15px;min-width:0}.sd-brand-icon{display:grid;place-items:center;width:52px;height:52px;flex-shrink:0;border:1px solid #67e8f94d;border-radius:17px;background:linear-gradient(140deg,#174568,#103238);box-shadow:0 0 28px #38bdf816}.sd-brand-icon svg{width:27px;color:#9bf8e1}.sd-eyebrow{font-size:9px;letter-spacing:.17em;text-transform:uppercase;font-weight:700;color:#8edcea;line-height:1.7}.staff-dashboard .sd-header h1{font-family:inherit;font-size:clamp(24px,3vw,35px);font-weight:700;letter-spacing:-.045em;line-height:1.15;margin:5px 0 7px}.sd-welcome{font-size:12px;color:#a9c0d3;line-height:1.6}.sd-account{display:flex;align-items:center;gap:12px;border:1px solid var(--sd-line);padding:11px 15px;border-radius:15px;background:#0c1d32;color:#e6f6ff;text-align:left;flex-shrink:0}.sd-account>svg{width:20px}.sd-account strong{display:block;font-size:12px;font-weight:650}.sd-account small{display:block;font-size:10px;color:#9bb4c8;margin-top:3px}.sd-account>span:last-child{color:#7dd3fc}.sd-layout{display:grid;grid-template-columns:190px minmax(0,1fr);gap:22px;align-items:start}.sd-sidebar{position:sticky;top:100px;background:linear-gradient(155deg,#0d2239ee,#060f1fee);border:1px solid var(--sd-line);border-radius:20px;padding:16px 10px}.sd-nav-label{font-size:9px;font-weight:750;color:#8aa6bd;text-transform:uppercase;letter-spacing:.18em;padding:0 12px 14px}.sd-navigation{display:flex;flex-direction:column;gap:5px}.sd-nav-button{display:flex;align-items:center;gap:11px;min-height:46px;width:100%;padding:10px 12px;background:transparent;border:1px solid transparent;border-radius:12px;color:#b5cbdc;text-align:left;font-size:12px!important;font-weight:650!important;transition:background .2s,color .2s}.sd-nav-button>svg{width:19px;height:19px;flex-shrink:0}.sd-nav-button:hover{background:#18344e;color:#effcff}.sd-nav-button.is-active{color:#051726;background:linear-gradient(110deg,#7dd3fc,#70efcf);box-shadow:0 4px 18px #38bdf824}.sd-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;min-height:20px;padding:2px 5px;font-size:10px;line-height:1.3;font-weight:750;color:#071828;background:#8ce8fa;border-radius:7px;flex-shrink:0}.sd-nav-button .sd-count,.sd-nav-button .sd-warning{margin-left:auto}.sd-nav-button.is-active .sd-count{background:#092b42;color:#d9fbff}.sd-warning{display:inline-grid;place-items:center;width:20px;height:20px;background:#ffdab0;color:#663600;border-radius:7px;font-size:12px;font-weight:800}.sd-sidebar-note{display:flex;align-items:center;gap:10px;padding:22px 9px 7px;margin-top:20px;border-top:1px solid var(--sd-line)}.sd-sidebar-note svg{width:20px;color:#6ee7b7;flex-shrink:0}.sd-sidebar-note p{font-size:10px;line-height:1.8;color:#8aa9be}.sd-sidebar-note strong{font-weight:500;color:#c5e7ed}.sd-main{min-width:0}.sd-section-heading{display:flex;align-items:center;justify-content:space-between;gap:15px;margin:2px 0 18px}.staff-dashboard .sd-section-heading h2{font-family:inherit;font-size:23px;font-weight:650;letter-spacing:-.025em;line-height:1.2;margin:5px 0 7px}.sd-section-heading>div>p:last-child{font-size:12px;color:#a9c0d3}.sd-section-icon{display:grid;place-items:center;background:#13314a;border:1px solid var(--sd-line);border-radius:14px;width:43px;height:43px;color:#8fedec;flex-shrink:0}.sd-section-icon svg{width:22px}.sd-alerts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px}.sd-alerts button{display:inline-flex;align-items:center;gap:8px;min-height:38px;background:#11263e;border:1px solid #7dd3fc33;border-radius:10px;color:#d4edf6;padding:7px 10px;font-size:10px!important;font-weight:600!important}.sd-alerts button:hover{background:#1d3b54}.sd-module{min-width:0;background:#f8fafc;color:#172c40;border:1px solid #8acfea40;border-radius:18px;padding:16px;box-shadow:0 16px 50px #0003;overflow-wrap:anywhere}.sd-module>div{min-width:0}.sd-subnav{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:#0d2139;border:1px solid #7dd3fc26;border-radius:13px;padding:6px;margin:0 0 16px;max-width:100%}.sd-sub-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:42px;min-width:0;padding:9px 13px;border:1px solid transparent;border-radius:9px;color:#bfd6e4;background:transparent;font-size:12px!important;font-weight:600!important;line-height:1.4;text-align:center;transition:background .2s}.sd-sub-button:hover{background:#20415b;color:#efffff}.sd-sub-button.is-active{background:#d9f7fa;color:#0c4254;border-color:#b5eff3;box-shadow:0 2px 6px #0001}.sd-client-tabs{margin-bottom:14px}.sd-client-tabs .sd-subnav:last-child{margin-bottom:0}.sd-nested{padding:8px;border:1px solid #dbe8ee;border-radius:14px}.sd-footer{font-size:10px;line-height:1.8;color:#799aaf;text-align:center;margin-top:24px!important}.sd-footer span{margin:0 8px}
@media(max-width:1050px){.sd-shell{width:calc(100% - 32px)}.sd-layout{grid-template-columns:160px minmax(0,1fr);gap:16px}.sd-sidebar{padding:12px 7px}.sd-nav-button{padding-inline:9px;gap:8px}.sd-module{padding:12px}.sd-sub-button{padding-inline:10px}}
@media(max-width:760px){.sd-shell{width:calc(100% - 24px);padding-top:98px}.sd-header{gap:10px;padding-bottom:18px}.sd-heading-group{gap:10px}.sd-brand-icon{width:39px;height:39px;border-radius:12px}.sd-brand-icon svg{width:21px}.sd-header .sd-eyebrow{font-size:8px;letter-spacing:.1em;max-width:240px}.staff-dashboard .sd-header h1{font-size:25px}.sd-welcome{display:none}.sd-account{padding:10px;border-radius:12px}.sd-account>span{display:none}.sd-account>svg{width:19px;height:19px}.sd-layout{display:block}.sd-sidebar{position:static;padding:8px;border-radius:16px;margin-bottom:18px}.sd-nav-label,.sd-sidebar-note{display:none}.sd-navigation{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.sd-nav-button{position:relative;flex-direction:column;justify-content:center;gap:5px;padding:9px 3px;min-height:61px;font-size:10px!important;border-radius:10px}.sd-nav-button>svg{width:19px;height:19px}.sd-nav-button .sd-count,.sd-nav-button .sd-warning{position:absolute;top:3px;right:3px;min-width:16px;min-height:16px;height:auto;font-size:8px;padding:1px 3px;border-radius:5px}.sd-section-heading{margin:0 2px 14px}.staff-dashboard .sd-section-heading h2{font-size:21px}.sd-section-heading>div>p:last-child{font-size:11px;line-height:1.5}.sd-section-heading .sd-eyebrow{font-size:8px}.sd-section-icon{width:35px;height:35px;border-radius:10px}.sd-section-icon svg{width:18px}.sd-alerts{gap:6px}.sd-alerts button{flex:1 1 auto;justify-content:center;font-size:10px!important;padding:6px 8px}.sd-module{padding:9px;border-radius:14px}.sd-subnav{gap:4px;padding:5px;margin-bottom:12px;border-radius:11px}.sd-sub-button{flex:1 1 auto;min-height:44px;padding:8px;font-size:11px!important}.sd-nested{padding:5px}.sd-footer{font-size:9px;padding-inline:10px}.sd-module input,.sd-module select,.sd-module textarea{max-width:100%;font-size:16px}.sd-module img{max-width:100%}}
@media(max-width:360px){.sd-shell{width:calc(100% - 16px)}.sd-module{padding:6px}.sd-header .sd-eyebrow{font-size:7px}.staff-dashboard .sd-header h1{font-size:23px}}
`;
