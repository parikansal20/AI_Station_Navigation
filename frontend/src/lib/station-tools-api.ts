import { OPERATIONS_API_URL } from "@/lib/operations-api";

export type FacilityStatus = "working" | "not_working";
export type FacilityStatuses = Record<string, FacilityStatus>;

export interface UnansweredQuestion {
  id: string;
  question: string;
  count: number;
  firstAskedAt: string;
  lastAskedAt: string;
}

export interface OperationsNotification {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  read: boolean;
}

export interface DepartmentAdmin {
  id: string;
  name: string;
  role: string;
  department: string;
  permissions: string[];
  approvalStatus: "Pending" | "Approved";
  createdAt: string;
  approvedAt: string | null;
  lastLogin: string | null;
}

export interface StationAnnouncement {
  id: string;
  message: string;
  publishAt: string;
  languages: string[];
  status: "Scheduled" | "Published";
  createdAt: string;
}

export interface StationOperationsData {
  notifications: OperationsNotification[];
  announcements: StationAnnouncement[];
  departmentAdmins: DepartmentAdmin[];
  reports: Array<{ id: string; name: string; owner: string; updatedAt: string }>;
  feedback: Array<{ id: string; text: string; sentiment: string; createdAt: string }>;
  departments: Array<{ id: string; name: string; status: string; updatedAt: string }>;
  aiUsage: null | Record<string, number | string>;
  aiPerformance: null | Record<string, number | string>;
}

const FACILITY_STORAGE_KEY = "saarthi-facility-statuses";
const defaultFacilityStatuses: FacilityStatuses = {
  lift: "working",
  escalator: "working",
  washroom: "not_working",
  waiting_room: "not_working",
  drinking_water: "working",
  charging_station: "working",
  atm: "not_working",
  ticket_counter: "working",
};

function readLocalFacilityStatuses(): FacilityStatuses {
  if (typeof window === "undefined") return { ...defaultFacilityStatuses };
  try {
    const stored = window.localStorage.getItem(FACILITY_STORAGE_KEY);
    return stored
      ? { ...defaultFacilityStatuses, ...JSON.parse(stored) }
      : { ...defaultFacilityStatuses };
  } catch {
    return { ...defaultFacilityStatuses };
  }
}

function storeLocalFacilityStatuses(statuses: FacilityStatuses) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(statuses));
  }
  return statuses;
}

async function stationToolsRequest<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${OPERATIONS_API_URL}/station-tools${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
  } catch {
    throw new Error("Station operations service is offline. Start the backend service and try again.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Unable to update station tools.");
  }
  return payload.data;
}

export async function fetchFacilityStatuses() {
  try {
    const statuses = await stationToolsRequest<FacilityStatuses>("/facilities");
    return storeLocalFacilityStatuses({ ...defaultFacilityStatuses, ...statuses });
  } catch {
    return readLocalFacilityStatuses();
  }
}

export async function updateFacilityStatus(facility: string, status: FacilityStatus) {
  const localStatuses = storeLocalFacilityStatuses({
    ...readLocalFacilityStatuses(),
    [facility]: status,
  });

  try {
    const statuses = await stationToolsRequest<FacilityStatuses>(`/facilities/${facility}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return storeLocalFacilityStatuses({ ...localStatuses, ...statuses });
  } catch {
    return localStatuses;
  }
}

export function fetchUnansweredQuestions() {
  return stationToolsRequest<UnansweredQuestion[]>("/unanswered-questions");
}

export function logUnansweredQuestion(question: string) {
  return stationToolsRequest<UnansweredQuestion>("/unanswered-questions", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export function fetchStationOperations() {
  return stationToolsRequest<StationOperationsData>("/dashboard");
}

export function createStationAnnouncement(input: {
  message: string;
  publishAt?: string;
  languages?: string[];
}) {
  return stationToolsRequest<StationOperationsData>("/announcements", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createDepartmentAdmin(input: {
  name: string;
  role: string;
  department: string;
  permissions: string[];
}) {
  return stationToolsRequest<StationOperationsData>("/department-admins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function approveDepartmentAdmin(id: string) {
  return stationToolsRequest<StationOperationsData>(`/department-admins/${id}/approve`, {
    method: "PATCH",
  });
}

export function logStationUpdate(input: {
  title: string;
  description: string;
  category?: string;
}) {
  return stationToolsRequest<StationOperationsData>("/updates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
