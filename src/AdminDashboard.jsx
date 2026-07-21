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
    <div className="min-h-screen   ">
      {/* Self-contained utilities so the layout never depends on plugins */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className=" mx-auto bg-white  shadow-xl shadow-slate-300/40 border border-slate-200 overflow-hidden">
        {/* ================= HEADER ================= */}
       <header
  className="
    relative isolate overflow-hidden
    bg-gradient-to-br
    from-[#071323] via-[#0A2342] to-[#07111F]
    px-3 pb-7 pt-20
    text-center
    sm:px-6 sm:pb-10 sm:pt-24
    lg:px-8 lg:pb-12 lg:pt-24
  "
>
  <style>{`
    @keyframes adminBubbleFloat {
      0% {
        transform: translate3d(0, 20px, 0) scale(0.9);
        opacity: 0;
      }
      12% {
        opacity: var(--bubble-opacity, 0.5);
      }
      50% {
        transform: translate3d(var(--bubble-drift, 20px), -55px, 0)
          scale(1.08);
      }
      100% {
        transform: translate3d(calc(var(--bubble-drift, 20px) * -0.5), -150px, 0)
          scale(0.92);
        opacity: 0;
      }
    }

    @keyframes adminGlowPulse {
      0%, 100% {
        opacity: 0.45;
        transform: scale(1);
      }
      50% {
        opacity: 0.72;
        transform: scale(1.08);
      }
    }

    @keyframes adminShimmer {
      0% {
        transform: translateX(-160%) skewX(-20deg);
      }
      100% {
        transform: translateX(260%) skewX(-20deg);
      }
    }

    @keyframes adminFadeUp {
      from {
        opacity: 0;
        transform: translateY(14px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .admin-header-reveal {
      animation: adminFadeUp 0.7s ease-out both;
    }

    .admin-bubble {
      animation: adminBubbleFloat var(--bubble-duration, 9s)
        var(--bubble-delay, 0s) infinite ease-in-out;
      opacity: 0;
      will-change: transform, opacity;
    }

    .admin-glow {
      animation: adminGlowPulse 7s ease-in-out infinite;
    }

    .admin-action-shimmer::after {
      content: "";
      position: absolute;
      inset: -40% auto -40% -35%;
      width: 28%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.38),
        transparent
      );
      animation: adminShimmer 4.8s ease-in-out infinite;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .admin-bubble,
      .admin-glow,
      .admin-header-reveal,
      .admin-action-shimmer::after {
        animation: none !important;
      }

      .admin-bubble {
        opacity: 0.25;
      }
    }
  `}</style>

  {/* Background atmosphere */}
  <div
    className="pointer-events-none absolute inset-0 -z-20"
    aria-hidden="true"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_38%)]" />

    <div
      className="
        admin-glow
        absolute -left-24 top-4
        h-64 w-64 rounded-full
        bg-cyan-400/15 blur-[80px]
        sm:h-80 sm:w-80
      "
    />

    <div
      className="
        admin-glow
        absolute -right-28 bottom-[-5rem]
        h-72 w-72 rounded-full
        bg-blue-600/20 blur-[90px]
        sm:h-96 sm:w-96
      "
      style={{ animationDelay: "-3s" }}
    />

    <div
      className="
        absolute left-1/2 top-1/2
        h-44 w-[85%] max-w-3xl
        -translate-x-1/2 -translate-y-1/2
        rounded-full bg-sky-300/5 blur-3xl
      "
    />

    {/* Fine grid */}
    <div
      className="
        absolute inset-0 opacity-[0.045]
        [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)]
        [background-size:34px_34px]
        [mask-image:linear-gradient(to_bottom,black,transparent_92%)]
      "
    />
  </div>

  {/* Floating bubbles */}
  <div
    className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    aria-hidden="true"
  >
    {[
      {
        left: "6%",
        bottom: "-18px",
        size: 20,
        duration: "8s",
        delay: "-2s",
        drift: "18px",
        opacity: 0.42,
      },
      {
        left: "15%",
        bottom: "-30px",
        size: 38,
        duration: "11s",
        delay: "-7s",
        drift: "-24px",
        opacity: 0.32,
      },
      {
        left: "27%",
        bottom: "-22px",
        size: 16,
        duration: "7.5s",
        delay: "-4s",
        drift: "30px",
        opacity: 0.5,
      },
      {
        left: "42%",
        bottom: "-38px",
        size: 48,
        duration: "13s",
        delay: "-9s",
        drift: "-18px",
        opacity: 0.22,
      },
      {
        left: "58%",
        bottom: "-20px",
        size: 24,
        duration: "9.5s",
        delay: "-5s",
        drift: "26px",
        opacity: 0.4,
      },
      {
        left: "70%",
        bottom: "-40px",
        size: 54,
        duration: "14s",
        delay: "-11s",
        drift: "-30px",
        opacity: 0.2,
      },
      {
        left: "82%",
        bottom: "-22px",
        size: 18,
        duration: "8.5s",
        delay: "-3s",
        drift: "16px",
        opacity: 0.46,
      },
      {
        left: "92%",
        bottom: "-32px",
        size: 34,
        duration: "12s",
        delay: "-8s",
        drift: "-22px",
        opacity: 0.28,
      },
    ].map((bubble, index) => (
      <span
        key={index}
        className="
          admin-bubble absolute rounded-full
          border border-cyan-100/25
          bg-gradient-to-br
          from-white/20 via-cyan-200/10 to-blue-500/10
          shadow-[inset_0_0_14px_rgba(255,255,255,0.14),0_0_18px_rgba(56,189,248,0.12)]
          backdrop-blur-[2px]
        "
        style={{
          left: bubble.left,
          bottom: bubble.bottom,
          width: bubble.size,
          height: bubble.size,
          "--bubble-duration": bubble.duration,
          "--bubble-delay": bubble.delay,
          "--bubble-drift": bubble.drift,
          "--bubble-opacity": bubble.opacity,
        }}
      />
    ))}
  </div>

  {/* Main glass panel */}
  <div
    className="
      admin-header-reveal
      relative mx-auto w-full max-w-4xl
      overflow-hidden rounded-[1.75rem]
      border border-white/10
      bg-white/[0.055]
      px-4 py-6
      shadow-[0_24px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]
      backdrop-blur-xl
      sm:rounded-[2rem] sm:px-8 sm:py-8
      lg:px-12 lg:py-10
    "
  >
    {/* Panel highlights */}
    <div
      className="
        pointer-events-none absolute inset-x-8 top-0
        h-px bg-gradient-to-r
        from-transparent via-cyan-200/70 to-transparent
      "
      aria-hidden="true"
    />

    <div
      className="
        pointer-events-none absolute -right-16 -top-20
        h-44 w-44 rounded-full
        bg-cyan-300/10 blur-3xl
      "
      aria-hidden="true"
    />

    <div className="relative z-10">
      {/* Dashboard badge */}
      <div className="mb-3 flex justify-center sm:mb-4">
        <div
          className="
            inline-flex items-center gap-2
            rounded-full border border-cyan-200/20
            bg-cyan-300/[0.07]
            px-3 py-1.5
            shadow-[0_8px_30px_rgba(34,211,238,0.08)]
            backdrop-blur-md
          "
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>

          <span
            className="
              text-[9px] font-bold uppercase
              tracking-[0.28em] text-cyan-100/90
              sm:text-[10px] sm:tracking-[0.34em]
            "
          >
            Admin Dashboard
          </span>
        </div>
      </div>

      <h1
        className="
          mx-auto max-w-3xl
          font-[Aspire]
          text-[clamp(2rem,9vw,4rem)]
          font-extrabold leading-[0.95]
          tracking-[-0.035em] text-white
          drop-shadow-[0_5px_24px_rgba(56,189,248,0.18)]
        "
      >
        Welcome back,
        <span
          className="
            mt-1 block
            bg-gradient-to-r
            from-cyan-200 via-white to-blue-200
            bg-clip-text text-transparent
            sm:inline sm:ml-3
          "
        >
          Amanda
        </span>
      </h1>

      <p
        className="
          mx-auto mt-4 max-w-xl
          text-xs leading-relaxed text-blue-100/65
          sm:text-sm lg:text-base
        "
      >
        Everything is up to date and running smoothly.
      </p>

      {/* Status strip */}
      <div
        className="
          mx-auto mt-5 flex w-fit max-w-full
          items-center justify-center gap-2
          rounded-full border border-emerald-300/15
          bg-emerald-300/[0.055]
          px-3 py-1.5
          text-[10px] font-semibold text-emerald-100/85
          sm:text-xs
        "
      >
        <span className="text-emerald-300">●</span>
        All systems operational
      </div>

      {/* Quick actions */}
      <div
        className="
          mt-6 grid grid-cols-2 gap-2.5
          sm:mx-auto sm:mt-7 sm:flex sm:w-fit sm:gap-3
        "
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("employees");
            setEmployeesSubTab("profile");
            setProfileSubTab("me");
          }}
          className="
            admin-action-shimmer
            group relative min-w-0 overflow-hidden
            rounded-2xl border border-cyan-200/20
            bg-gradient-to-br
            from-cyan-300/20 via-blue-400/10 to-white/[0.06]
            px-3 py-3
            text-xs font-bold text-white
            shadow-[0_10px_30px_rgba(8,145,178,0.13)]
            backdrop-blur-md
            transition duration-300
            hover:-translate-y-0.5
            hover:border-cyan-200/40
            hover:bg-cyan-300/20
            hover:shadow-[0_14px_35px_rgba(8,145,178,0.22)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-300
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#071323]
            active:translate-y-0
            sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-sm
          "
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span
              className="
                flex h-7 w-7 items-center justify-center
                rounded-full bg-white/10
                text-sm transition-transform duration-300
                group-hover:scale-110
              "
              aria-hidden="true"
            >
              👤
            </span>
            Profiles
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("tasks");
            setTasksSubTab("manage");
          }}
          className="
            admin-action-shimmer
            group relative min-w-0 overflow-hidden
            rounded-2xl border border-white/15
            bg-white/[0.075]
            px-3 py-3
            text-xs font-bold text-white
            shadow-[0_10px_30px_rgba(0,0,0,0.18)]
            backdrop-blur-md
            transition duration-300
            hover:-translate-y-0.5
            hover:border-white/30
            hover:bg-white/[0.13]
            hover:shadow-[0_14px_35px_rgba(0,0,0,0.28)]
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-300
            focus-visible:ring-offset-2
            focus-visible:ring-offset-[#071323]
            active:translate-y-0
            sm:min-w-[148px] sm:px-6 sm:py-3.5 sm:text-sm
          "
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span
              className="
                flex h-7 w-7 items-center justify-center
                rounded-full bg-white/10
                text-sm transition-transform duration-300
                group-hover:scale-110
              "
              aria-hidden="true"
            >
              ✓
            </span>
            Tasks
          </span>
        </button>
      </div>
    </div>
  </div>

  {/* Bottom transition */}
  <div
    className="
      pointer-events-none absolute inset-x-0 bottom-0
      h-16 bg-gradient-to-t
      from-slate-950/35 to-transparent
    "
    aria-hidden="true"
  />
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