"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  CircleGauge,
  FileText,
  HelpCircle,
  Languages,
  LogOut,
  Megaphone,
  MessageSquareWarning,
  MessageSquareText,
  Navigation,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  UserCog,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";
import { HclTechMark } from "@/components/HclTechMark";
import { fetchOperationsResource } from "@/lib/operations-api";
import {
  FacilityStatus,
  FacilityStatuses,
  UnansweredQuestion,
  StationOperationsData,
  approveDepartmentAdmin,
  createDepartmentAdmin,
  createStationAnnouncement,
  fetchFacilityStatuses,
  fetchStationOperations,
  fetchUnansweredQuestions,
  updateFacilityStatus,
} from "@/lib/station-tools-api";

const facilityLabels: Record<string, string> = {
  lift: "Lift",
  escalator: "Escalator",
  washroom: "Washroom",
  waiting_room: "Waiting Hall",
  drinking_water: "Drinking Water",
  charging_station: "Charging Station",
  atm: "ATM",
  ticket_counter: "Ticket Counter",
};

const emptyOperations: StationOperationsData = {
  notifications: [],
  announcements: [],
  departmentAdmins: [],
  reports: [],
  feedback: [],
  departments: [],
  aiUsage: null,
  aiPerformance: null,
};

const departmentOptions = [
  "Porter Department",
  "Golf Cart Department",
  "Wheelchair Department",
  "Emergency Department",
  "Help Desk",
  "AI Operations",
  "Facility Management",
  "Knowledge Management",
];

const permissionOptions = [
  ["view_analytics", "View analytics"],
  ["manage_facilities", "Manage facilities"],
  ["manage_knowledge", "Manage knowledge base"],
  ["publish_announcements", "Publish announcements"],
  ["manage_feedback", "Manage feedback"],
  ["view_department_status", "View department status"],
];

const todayPerformance = [
  {
    label: "Passenger Queries",
    usageKeys: ["passenger_queries", "queries", "total_queries"],
    icon: HelpCircle,
  },
  {
    label: "Navigation Requests",
    usageKeys: ["navigation_requests", "navigation", "routes_requested"],
    icon: Navigation,
  },
  {
    label: "Facilities Used",
    usageKeys: ["facilities_used", "facility_usage"],
    icon: Building2,
  },
  {
    label: "Announcements Published",
    usageKeys: [],
    icon: Megaphone,
  },
  {
    label: "Complaints Received",
    usageKeys: ["complaints_received", "complaints"],
    icon: MessageSquareWarning,
  },
];

type RecordedActivity = {
  id: string;
  createdAt: string;
};

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-blue-100/90 bg-white/80 shadow-[0_12px_34px_rgba(30,64,175,.07)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

function PanelTitle({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="font-extrabold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "Active" || status === "Positive" || status === "Working"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : status === "Busy" || status === "Neutral" || status === "Limited"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";
  return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ring-1 ${style}`}>{status}</span>;
}

function TodayPerformance({
  operations,
  questions,
  navigationRequests,
  complaints,
}: {
  operations: StationOperationsData;
  questions: UnansweredQuestion[];
  navigationRequests: RecordedActivity[];
  complaints: RecordedActivity[];
}) {
  const readUsageMetric = (keys: string[]) => {
    for (const key of keys) {
      const value = operations.aiUsage?.[key];
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
        return Number(value);
      }
    }
    return 0;
  };

  const isToday = (date: string) => {
    const value = new Date(date);
    const today = new Date();
    return (
      value.getFullYear() === today.getFullYear() &&
      value.getMonth() === today.getMonth() &&
      value.getDate() === today.getDate()
    );
  };

  const publishedToday = operations.announcements.filter(
    (announcement) => announcement.status === "Published" && isToday(announcement.publishAt)
  ).length;
  const queryActivityToday = questions
    .filter((question) => isToday(question.lastAskedAt))
    .reduce((total, question) => total + question.count, 0);
  const navigationActivityToday = navigationRequests.filter((request) => isToday(request.createdAt)).length;
  const facilityActivityToday = operations.notifications.filter(
    (notification) => notification.category === "Facility" && isToday(notification.createdAt)
  ).length;
  const complaintsToday = complaints.filter((complaint) => isToday(complaint.createdAt)).length;

  const recordedValues: Record<string, number> = {
    "Passenger Queries": readUsageMetric(todayPerformance[0].usageKeys) || queryActivityToday,
    "Navigation Requests": readUsageMetric(todayPerformance[1].usageKeys) || navigationActivityToday,
    "Facilities Used": readUsageMetric(todayPerformance[2].usageKeys) || facilityActivityToday,
    "Announcements Published": publishedToday,
    "Complaints Received": readUsageMetric(todayPerformance[4].usageKeys) || complaintsToday,
  };

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-blue-100 px-5 py-5 sm:px-6">
        <PanelTitle
          icon={BarChart3}
          title="Today's Performance"
          subtitle="Live station operations compared with yesterday"
        />
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-blue-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
          Live Today
        </span>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        {todayPerformance.map((metric) => {
          const Icon = metric.icon;
          const value = recordedValues[metric.label];

          return (
            <article
              key={metric.label}
              className="group rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-4 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(37,99,235,.12)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition group-hover:bg-blue-700 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500">
                  <ArrowRight className="h-3 w-3" />
                  No comparison
                </span>
              </div>
              <p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">
                {value.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-[11px] font-bold text-slate-500">{metric.label}</p>
              <p className="mt-1.5 text-[9px] font-semibold text-slate-400">Recorded today</p>
            </article>
          );
        })}
      </div>

      <footer className="flex items-center justify-between border-t border-blue-100 bg-blue-50/35 px-5 py-3 text-[10px] font-semibold text-slate-500 sm:px-6">
        <span>Last updated: Just now</span>
        <span className="hidden items-center gap-1.5 text-blue-700 sm:inline-flex">
          <Activity className="h-3.5 w-3.5" />
          Operations data live
        </span>
      </footer>
    </Panel>
  );
}

export function StationOperationsDashboard() {
  const { userRole, logout } = usePassengerStore();
  const [facilities, setFacilities] = useState<FacilityStatuses>({});
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [operations, setOperations] = useState<StationOperationsData>(emptyOperations);
  const [navigationRequests, setNavigationRequests] = useState<RecordedActivity[]>([]);
  const [complaints, setComplaints] = useState<RecordedActivity[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [savingFacility, setSavingFacility] = useState("");
  const [activeReport, setActiveReport] = useState("7 days");
  const [announcement, setAnnouncement] = useState("");
  const [announcementTime, setAnnouncementTime] = useState("");
  const [minimumAnnouncementTime] = useState(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  );
  const [announcementLanguage, setAnnouncementLanguage] = useState("English");
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: "",
    role: "",
    department: "",
    permissions: [] as string[],
  });
  const [activityNotice, setActivityNotice] = useState("");

  const loadStationTools = async () => {
    setLoadingTools(true);
    try {
      const [facilityData, questionData, operationsData, navigationData, complaintData] = await Promise.all([
        fetchFacilityStatuses(),
        fetchUnansweredQuestions(),
        fetchStationOperations(),
        fetchOperationsResource<RecordedActivity>("navigation-requests"),
        fetchOperationsResource<RecordedActivity>("complaints"),
      ]);
      setFacilities(facilityData);
      setQuestions(questionData);
      setOperations(operationsData);
      setNavigationRequests(navigationData);
      setComplaints(complaintData);
    } catch {
      setActivityNotice("Live station tools are temporarily unavailable.");
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchFacilityStatuses(),
      fetchUnansweredQuestions(),
      fetchStationOperations(),
      fetchOperationsResource<RecordedActivity>("navigation-requests"),
      fetchOperationsResource<RecordedActivity>("complaints"),
    ])
      .then(([facilityData, questionData, operationsData, navigationData, complaintData]) => {
        if (!active) return;
        setFacilities(facilityData);
        setQuestions(questionData);
        setOperations(operationsData);
        setNavigationRequests(navigationData);
        setComplaints(complaintData);
      })
      .catch(() => {
        if (active) setActivityNotice("Live station tools are temporarily unavailable.");
      })
      .finally(() => {
        if (active) setLoadingTools(false);
      });

    const announcementTimer = window.setInterval(() => {
      Promise.all([
        fetchStationOperations(),
        fetchUnansweredQuestions(),
        fetchOperationsResource<RecordedActivity>("navigation-requests"),
        fetchOperationsResource<RecordedActivity>("complaints"),
      ])
        .then(([operationsData, questionData, navigationData, complaintData]) => {
          if (!active) return;
          setOperations(operationsData);
          setQuestions(questionData);
          setNavigationRequests(navigationData);
          setComplaints(complaintData);
        })
        .catch(() => {
          // Keep the last synchronized dashboard state during a temporary outage.
        });
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(announcementTimer);
    };
  }, []);

  const facilityEntries = useMemo(
    () => Object.entries(facilityLabels).map(([key, label]) => ({
      key,
      label,
      status: facilities[key] || "working",
    })),
    [facilities]
  );
  const workingFacilities = facilityEntries.filter((item) => item.status === "working").length;
  const scheduledAnnouncements = operations.announcements
    .filter((item) => item.status === "Scheduled")
    .sort((first, second) => new Date(first.publishAt).getTime() - new Date(second.publishAt).getTime());
  const publishedAnnouncements = operations.announcements.filter((item) => item.status === "Published");

  const toggleFacility = async (facility: string, status: FacilityStatus) => {
    setSavingFacility(facility);
    try {
      const nextStatus = status === "working" ? "not_working" : "working";
      const updatedFacilities = await updateFacilityStatus(facility, nextStatus);
      setFacilities(updatedFacilities);
      fetchStationOperations()
        .then(setOperations)
        .catch(() => {
          // The facility update is independent from dashboard activity history.
        });
      setActivityNotice(
        `${facilityLabels[facility]} marked as ${nextStatus === "working" ? "working" : "under maintenance"}.`
      );
    } catch (error) {
      setActivityNotice(
        error instanceof Error ? error.message : `Could not update ${facilityLabels[facility]}.`
      );
    } finally {
      setSavingFacility("");
    }
  };

  const publishAnnouncement = async () => {
    if (!announcement.trim()) {
      setActivityNotice("Write an announcement before publishing.");
      return;
    }
    try {
      const scheduledDate = announcementTime ? new Date(announcementTime) : null;
      if (scheduledDate && (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date())) {
        setActivityNotice("Choose a future date and time to schedule this announcement.");
        return;
      }
      const publishAt = scheduledDate?.toISOString();
      setOperations(await createStationAnnouncement({
        message: announcement.trim(),
        publishAt,
        languages: [announcementLanguage],
      }));
      setActivityNotice(announcementTime ? "Announcement scheduled." : "Announcement published.");
      setAnnouncement("");
      setAnnouncementTime("");
      setAnnouncementLanguage("English");
    } catch {
      setActivityNotice("Could not save the announcement.");
    }
  };

  const submitDepartmentAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAdmin(true);
    try {
      setOperations(await createDepartmentAdmin(adminForm));
      setAdminModalOpen(false);
      setAdminForm({ name: "", role: "", department: "", permissions: [] });
      setActivityNotice("Department admin created and sent for permission approval.");
    } catch (error) {
      setActivityNotice(error instanceof Error ? error.message : "Could not create department admin.");
    } finally {
      setSavingAdmin(false);
    }
  };

  const approveAdmin = async (id: string) => {
    try {
      setOperations(await approveDepartmentAdmin(id));
      setActivityNotice("Department admin permissions approved.");
    } catch {
      setActivityNotice("Could not approve department admin permissions.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dbeafe_0,_transparent_28%),linear-gradient(135deg,#f8fbff_0%,#eef4ff_48%,#f8fafc_100%)] px-3 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
        <header className="sticky top-3 z-30 flex flex-col gap-4 rounded-[24px] border border-white/80 bg-white/75 px-5 py-4 shadow-[0_14px_40px_rgba(30,64,175,.1)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-950 text-white shadow-lg shadow-blue-900/20">
              <Bot className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-black tracking-[-.02em] text-slate-950">SARTHI Operations Center</p>
                <span className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 sm:inline">Systems online</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-blue-700">Station Operations Manager &bull; {userRole}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/crowd-analyze" className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-3 text-xs font-black text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Crowd Analyzer</span>
              <ArrowRight className="hidden h-3.5 w-3.5 lg:block" />
            </Link>
            <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-xs font-black text-blue-800 transition hover:bg-blue-50">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Passenger Home</span>
            </Link>
            <button onClick={logout} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-blue-950">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </button>
            <HclTechMark />
          </div>
        </header>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-blue-700">{new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date())}</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-slate-950 sm:text-4xl">Station intelligence overview</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">Manage passenger-visible facility availability, publish station announcements, and control department access.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => document.getElementById("announcement-input")?.focus()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
              <Megaphone className="h-4 w-4" /> New announcement
            </button>
          </div>
        </div>

        {activityNotice && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">
            <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" />{activityNotice}</span>
            <button onClick={() => setActivityNotice("")} className="text-blue-500" aria-label="Dismiss notification"><XCircle className="h-4 w-4" /></button>
          </div>
        )}

        <section className="hidden">
          <Panel className="p-5">
            <PanelTitle icon={Activity} title="AI Assistant Usage" subtitle="Live passenger engagement" />
            {operations.aiUsage ? (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {Object.entries(operations.aiUsage).map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-3 ring-1 ring-blue-100">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <p className="mt-3 text-xl font-black tracking-tight text-slate-950">{value}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label.replaceAll("_", " ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-blue-200 p-8 text-center">
                <Activity className="mx-auto h-6 w-6 text-blue-300" />
                <p className="mt-3 text-xs font-black text-slate-600">No AI usage recorded yet</p>
                <p className="mt-1 text-[10px] font-medium text-slate-400">Metrics will appear after real passenger interactions.</p>
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <PanelTitle icon={CircleGauge} title="AI Performance" subtitle="Response and navigation quality" />
            {operations.aiPerformance ? (
              <div className="mt-5 space-y-4">
                {Object.entries(operations.aiPerformance).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-blue-50 p-3 text-[11px]">
                    <span className="font-bold capitalize text-slate-600">{label.replaceAll("_", " ")}</span>
                    <span className="font-black text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-blue-200 p-8 text-center">
                <CircleGauge className="mx-auto h-6 w-6 text-blue-300" />
                <p className="mt-3 text-xs font-black text-slate-600">No performance sample yet</p>
                <p className="mt-1 text-[10px] font-medium text-slate-400">Accuracy is calculated only from recorded AI sessions.</p>
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <PanelTitle icon={BookOpen} title="Knowledge Base" subtitle="Content health and approvals" />
            <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
              <div className="flex items-end justify-between"><div><p className="text-3xl font-black">{questions.length}</p><p className="text-[10px] font-bold text-white/55">Recorded unanswered questions</p></div><Sparkles className="h-6 w-6 text-cyan-300" /></div>
              <p className="mt-4 text-[10px] font-semibold leading-4 text-white/55">Coverage will be calculated when verified FAQ and document records are available.</p>
            </div>
          </Panel>

          <Panel className="p-5">
            <PanelTitle icon={Building2} title="Facility Management" subtitle="Live availability overview" action={<button onClick={loadStationTools} aria-label="Refresh facility status" className="text-slate-400 hover:text-blue-700"><RefreshCw className={`h-4 w-4 ${loadingTools ? "animate-spin" : ""}`} /></button>} />
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2563eb 0 ${(workingFacilities / Math.max(facilityEntries.length, 1)) * 100}%, #e2e8f0 0 100%)` }}><div className="grid h-14 w-14 place-items-center rounded-full bg-white text-center"><span className="text-xl font-black">{workingFacilities}/{facilityEntries.length}</span></div></div>
              <div><p className="text-sm font-black text-slate-950">Facilities available</p><p className="mt-1 text-xs font-medium text-slate-500">{facilityEntries.length - workingFacilities} under maintenance</p><span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">Live JSON sync</span></div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2">{facilityEntries.slice(0, 8).map((item) => <div key={item.key} title={item.label} className={`h-2 rounded-full ${item.status === "working" ? "bg-blue-600" : "bg-rose-400"}`} />)}</div>
          </Panel>
        </section>

        <section className="hidden">
          <Panel className="overflow-hidden">
            <div className="border-b border-blue-100 p-5 sm:p-6">
              <PanelTitle icon={BarChart3} title="Reports & Analytics" subtitle="Cross-functional station intelligence" action={<div className="flex rounded-xl bg-slate-100 p-1">{["24 hours", "7 days", "30 days"].map((period) => <button key={period} onClick={() => setActiveReport(period)} className={`rounded-lg px-2.5 py-1.5 text-[9px] font-black ${activeReport === period ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{period}</button>)}</div>} />
              {operations.reports.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-blue-200 p-10 text-center"><BarChart3 className="mx-auto h-7 w-7 text-blue-300" /><p className="mt-3 text-xs font-black text-slate-600">No analytics reports created yet</p><p className="mt-1 text-[10px] font-medium text-slate-400">Only generated reports will be displayed here.</p></div>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[.14em] text-slate-400"><tr><th className="px-6 py-3">Report</th><th className="px-4 py-3">Owner</th><th className="px-6 py-3 text-right">Updated</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{operations.reports.map((report) => <tr key={report.id} className="transition hover:bg-blue-50/40"><td className="px-6 py-4"><button onClick={() => setActivityNotice(`${report.name} opened.`)} className="flex items-center gap-3 text-xs font-black text-slate-900"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-4 w-4" /></span>{report.name}</button></td><td className="px-4 py-4 text-[11px] font-semibold text-slate-500">{report.owner}</td><td className="px-6 py-4 text-right text-[10px] font-semibold text-slate-400">{new Date(report.updatedAt).toLocaleString()}</td></tr>)}</tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-4">
            <Panel className="p-5">
              <PanelTitle icon={Building2} title="Department Overview" subtitle="Read-only readiness status" />
              <div className="mt-4 space-y-2">{operations.departments.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200 p-6 text-center text-xs font-bold text-slate-400">No department status submitted yet.</div> : operations.departments.map((department) => <div key={department.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div><p className="text-xs font-black text-slate-900">{department.name}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{new Date(department.updatedAt).toLocaleString()}</p></div><StatusBadge status={department.status} /></div>)}</div>
            </Panel>

            <Panel className="p-5">
              <PanelTitle icon={MessageSquareText} title="Passenger Feedback" subtitle="Sentiment from recent interactions" />
              <div className="mt-4 space-y-2">{operations.feedback.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200 p-7 text-center"><MessageSquareText className="mx-auto h-6 w-6 text-blue-300" /><p className="mt-3 text-xs font-black text-slate-600">No passenger feedback recorded yet</p></div> : operations.feedback.map((item) => <div key={item.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between"><StatusBadge status={item.sentiment} /><span className="text-[9px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-2 text-[10px] font-semibold leading-4 text-slate-600">{item.text}</p></div>)}</div>
            </Panel>
          </div>
        </section>

        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <div className="grid gap-5">
            <Panel className="p-5 sm:p-6">
              <PanelTitle icon={Wrench} title="Facility Status Center" subtitle="Update passenger-visible availability and maintenance state" action={<span className="rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-blue-700">{workingFacilities} operational</span>} />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {facilityEntries.map((facility) => {
                  const working = facility.status === "working";
                  return <div key={facility.key} className={`rounded-2xl border p-4 transition ${working ? "border-blue-100 bg-blue-50/45" : "border-rose-200 bg-rose-50/60"}`}><div className="flex items-start justify-between gap-2"><span className={`grid h-9 w-9 place-items-center rounded-xl ${working ? "bg-white text-blue-700" : "bg-white text-rose-600"}`}><Settings2 className="h-4 w-4" /></span><button role="switch" aria-checked={working} disabled={savingFacility === facility.key} onClick={() => toggleFacility(facility.key, facility.status)} className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${working ? "bg-blue-600" : "bg-rose-500"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${working ? "left-6" : "left-1"}`} /></button></div><p className="mt-4 text-xs font-black">{facility.label}</p><div className="mt-2 flex items-center justify-between"><StatusBadge status={working ? "Working" : "Maintenance"} /><span className="text-[9px] font-semibold text-slate-400">Live</span></div></div>;
                })}
              </div>
            </Panel>

            <TodayPerformance
              operations={operations}
              questions={questions}
              navigationRequests={navigationRequests}
              complaints={complaints}
            />
          </div>

          <div className="h-full">
            <Panel className="flex h-full flex-col p-5 sm:p-6">
              <PanelTitle icon={Megaphone} title="Announcements & Notices" subtitle="Publish station-wide passenger updates" />
              <textarea id="announcement-input" value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Write a passenger announcement or maintenance notice…" className="mt-4 min-h-24 w-full resize-none rounded-2xl border border-blue-100 bg-blue-50/35 p-3 text-xs font-semibold outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Publish time
                  <input
                    type="datetime-local"
                    value={announcementTime}
                    min={minimumAnnouncementTime}
                    onChange={(event) => setAnnouncementTime(event.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-[10px] font-bold outline-none focus:border-blue-400"
                  />
                </label>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-500">Language
                  <select value={announcementLanguage} onChange={(event) => setAnnouncementLanguage(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-[10px] font-bold outline-none focus:border-blue-400">
                    <option>English</option><option>Hindi</option><option>Urdu</option>
                  </select>
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={publishAnnouncement} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-[10px] font-black text-white"><Megaphone className="h-3.5 w-3.5" /> {announcementTime ? "Save schedule" : "Publish now"}</button>
                <span className="inline-flex items-center gap-2 rounded-xl border border-blue-100 px-3 py-2.5 text-[10px] font-bold text-slate-500"><Languages className="h-3.5 w-3.5" /> {announcementLanguage}</span>
              </div>

              <div className="mt-5 flex-1 border-t border-blue-100 pt-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-black text-amber-950">Upcoming scheduled notices</h3>
                      <p className="mt-0.5 text-[10px] font-medium text-amber-800/60">
                        These become visible on the passenger homepage at the selected time.
                      </p>
                    </div>
                    <span className="grid h-7 min-w-7 place-items-center rounded-full bg-amber-200 px-2 text-[10px] font-black text-amber-900">
                      {scheduledAnnouncements.length}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {scheduledAnnouncements.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-amber-300 p-3 text-center text-[10px] font-bold text-amber-800/55">
                        No announcements are scheduled.
                      </p>
                    ) : (
                      scheduledAnnouncements.slice(0, 4).map((notice) => (
                        <article key={notice.id} className="rounded-xl border border-amber-200 bg-white/80 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-[11px] font-bold leading-4 text-slate-700">{notice.message}</p>
                            <span className="shrink-0 rounded-full bg-amber-200 px-2 py-1 text-[8px] font-black uppercase text-amber-900">
                              Scheduled
                            </span>
                          </div>
                          <p className="mt-2 text-[10px] font-black text-amber-800">
                            {new Date(notice.publishAt).toLocaleString()}
                          </p>
                          <p className="mt-1 text-[9px] font-semibold text-slate-400">
                            Language: {notice.languages.join(", ")}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="mt-4">
                    <h3 className="text-xs font-black text-slate-900">Published notices</h3>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">Passenger notices already sent to the homepage</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-700">
                    {publishedAnnouncements.length}
                  </span>
                </div>

                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {publishedAnnouncements.length === 0 ? (
                    <div className="grid min-h-28 place-items-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/25 p-5 text-center">
                      <div>
                        <Megaphone className="mx-auto h-5 w-5 text-blue-300" />
                        <p className="mt-2 text-[11px] font-bold text-slate-400">No notices published yet.</p>
                      </div>
                    </div>
                  ) : (
                    publishedAnnouncements.slice(0, 4).map((notice) => (
                      <article key={notice.id} className="rounded-xl border border-blue-100 bg-blue-50/35 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[11px] font-bold leading-4 text-slate-700">{notice.message}</p>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase text-emerald-700">
                            Published
                          </span>
                        </div>
                        <p className="mt-2 text-[9px] font-semibold text-slate-400">
                          {new Date(notice.publishAt).toLocaleString()} &bull; {notice.languages.join(", ")}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </Panel>
          </div>
        </section>

        <Panel className="mt-5 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-blue-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <PanelTitle icon={UserCog} title="User & Role Management" subtitle="Department admin accounts, permissions, and access history" />
            <button onClick={() => setAdminModalOpen(true)} className="inline-flex items-center gap-2 self-start rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-black text-white"><UserCog className="h-4 w-4" /> Add department admin</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[.14em] text-slate-400"><tr><th className="px-6 py-3">Administrator</th><th className="px-4 py-3">Role & permissions</th><th className="px-4 py-3">Last login</th><th className="px-4 py-3">Access</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {operations.departmentAdmins.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-slate-400">No department admin accounts created yet.</td></tr>}
                {operations.departmentAdmins.map((admin) => <tr key={admin.id} className="hover:bg-blue-50/30"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-[10px] font-black text-blue-800">{admin.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><p className="text-xs font-black">{admin.name}</p><p className="mt-0.5 text-[9px] font-semibold text-slate-400">{admin.department}</p></div></div></td><td className="px-4 py-4"><p className="text-[11px] font-bold text-slate-600">{admin.role}</p><p className="mt-1 max-w-xs text-[9px] font-medium text-slate-400">{admin.permissions.map((permission) => permission.replaceAll("_", " ")).join(", ")}</p></td><td className="px-4 py-4 text-[10px] font-semibold text-slate-500">{admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"}</td><td className="px-4 py-4"><StatusBadge status={admin.approvalStatus} /></td><td className="px-6 py-4 text-right">{admin.approvalStatus === "Pending" ? <button onClick={() => approveAdmin(admin.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-[9px] font-black text-white"><ShieldCheck className="h-3.5 w-3.5" />Approve permissions</button> : <span className="text-[9px] font-bold text-emerald-600">Approved {admin.approvedAt ? new Date(admin.approvedAt).toLocaleDateString() : ""}</span>}</td></tr>)}
              </tbody>
            </table>
          </div>
        </Panel>

        {adminModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <div role="dialog" aria-modal="true" aria-labelledby="new-admin-title" className="w-full max-w-xl rounded-[26px] border border-blue-100 bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-700">User & role management</p><h2 id="new-admin-title" className="mt-1 text-xl font-black text-slate-950">Create department admin</h2><p className="mt-1 text-xs font-medium text-slate-500">The account remains pending until its permissions are approved.</p></div>
                <button onClick={() => setAdminModalOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500" aria-label="Close department admin form"><X className="h-4 w-4" /></button>
              </div>
              <form onSubmit={submitDepartmentAdmin} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Full name<input required value={adminForm.name} onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-blue-100 px-3 text-sm font-semibold normal-case tracking-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="Enter full name" /></label>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Role<input required value={adminForm.role} onChange={(event) => setAdminForm({ ...adminForm, role: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-blue-100 px-3 text-sm font-semibold normal-case tracking-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="e.g. Facility Supervisor" /></label>
                </div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Department<select required value={adminForm.department} onChange={(event) => setAdminForm({ ...adminForm, department: event.target.value })} className="mt-2 h-11 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold normal-case tracking-normal outline-none focus:border-blue-400"><option value="">Select department</option>{departmentOptions.map((department) => <option key={department}>{department}</option>)}</select></label>
                <fieldset>
                  <legend className="text-[10px] font-black uppercase tracking-wider text-slate-500">Requested permissions</legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {permissionOptions.map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-100 p-3 text-xs font-bold text-slate-600"><input type="checkbox" checked={adminForm.permissions.includes(value)} onChange={(event) => setAdminForm({ ...adminForm, permissions: event.target.checked ? [...adminForm.permissions, value] : adminForm.permissions.filter((permission) => permission !== value) })} className="accent-blue-700" />{label}</label>)}
                  </div>
                </fieldset>
                <div className="flex gap-3 pt-2"><button type="button" onClick={() => setAdminModalOpen(false)} className="flex-1 rounded-xl border border-blue-200 py-3 text-xs font-black text-blue-700">Cancel</button><button disabled={savingAdmin || adminForm.permissions.length === 0} type="submit" className="flex-1 rounded-xl bg-blue-700 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{savingAdmin ? "Creating…" : "Create for approval"}</button></div>
              </form>
            </div>
          </div>
        )}

        <footer className="py-7 text-center text-[10px] font-semibold text-slate-400">SARTHI AI Station Operations Center &bull; Lucknow Junction &bull; Last synchronized just now</footer>
      </div>
    </main>
  );
}
