import { create } from "zustand";
import { fetchOperationsResource, OPERATIONS_API_URL } from "@/lib/operations-api";

export type RoutePreference = "Fastest" | "Least Crowded" | "Accessible" | "Avoid Stairs";

export interface AccessibilityPreferences {
  wheelchairFriendly: boolean;
  avoidStairs: boolean;
  preferLift: boolean;
  seniorFriendly: boolean;
  lowWalkingDistance: boolean;
  voiceGuidance: boolean;
}

export type UserRole =
  | "user"
  | "admin"
  | "subadmin_coolie"
  | "subadmin_golfcart"
  | "subadmin_emergency"
  | "subadmin_complaints"
  | "operator"
  | "staff";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: UserRole | string;
}

export type AssistanceService = "porter" | "golf-cart";

export interface AssistanceRequest {
  id: string;
  service: AssistanceService;
  passengerName: string;
  userEmail?: string;
  contact: string;
  destination: string;
  pickup: string;
  status: "Pending" | "Assigned";
  assignedPersonnelId?: string;
  assignedPersonnelName?: string;
  assignedCartId?: string;
  assignedResourceCode?: string;
  assignedCartCode?: string;
  assignedDriverName?: string;
  assignedAt?: string;
  createdAt: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  trackUrl?: string;
  type?: "success" | "info" | "warning";
}

interface PassengerState {
  currentStationCode: string;
  currentStationName: string;
  currentLocation: string;
  selectedDestination: string;
  originLocation: string;
  routePreference: RoutePreference;
  accessibilityPreferences: AccessibilityPreferences;
  aiQuery: string;
  isListening: boolean;
  activeModal: string | null;

  // Toast State
  activeToast: ToastItem | null;

  // Auth State
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  userRole: UserRole | string;
  token: string | null;
  authInitialized: boolean;
  assistanceRequests: AssistanceRequest[];
  requestsInitialized: boolean;

  // Actions
  setSelectedDestination: (dest: string) => void;
  setOriginLocation: (orig: string) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  toggleAccessibilityPreference: (key: keyof AccessibilityPreferences) => void;
  setAiQuery: (query: string) => void;
  setIsListening: (isListening: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  quickNavigateTo: (dest: string) => void;
  showToast: (toast: Omit<ToastItem, "id">) => void;
  hideToast: () => void;

  // Auth Actions
  loginSuccess: (user: UserProfile, token: string) => void;
  updateProfile: (name: string, email: string) => Promise<UserProfile>;
  logout: () => void;
  initAuth: () => void;
  addAssistanceRequest: (
    request: Pick<AssistanceRequest, "service" | "passengerName" | "contact" | "destination" | "pickup"> & { userEmail?: string }
  ) => Promise<AssistanceRequest>;
  initAssistanceRequests: (email?: string) => Promise<void>;
  assignAssistanceRequest: (id: string, resourceId: string) => Promise<void>;
  deleteAssistanceRequest: (id: string) => Promise<void>;
}

function setAuthCookies(user: UserProfile, token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `saarthi_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `saarthi_role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `saarthi_user=${encodeURIComponent(user.name)}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function clearAuthCookies() {
  if (typeof document !== "undefined") {
    document.cookie = `saarthi_token=; path=/; max-age=0`;
    document.cookie = `saarthi_role=; path=/; max-age=0`;
    document.cookie = `saarthi_user=; path=/; max-age=0`;
  }
}

export const usePassengerStore = create<PassengerState>((set, get) => ({
  currentStationCode: "LJN",
  currentStationName: "Lucknow Junction",
  currentLocation: "Main Entrance — Gate 1",
  selectedDestination: "",
  originLocation: "Main Entrance — Gate 1",
  routePreference: "Fastest",
  accessibilityPreferences: {
    wheelchairFriendly: false,
    avoidStairs: false,
    preferLift: false,
    seniorFriendly: false,
    lowWalkingDistance: false,
    voiceGuidance: true,
  },
  aiQuery: "",
  isListening: false,
  activeModal: null,

  // Toast default state
  activeToast: null,

  // Auth defaults
  isLoggedIn: false,
  userName: "",
  userEmail: "",
  userRole: "user",
  token: null,
  authInitialized: false,
  assistanceRequests: [],
  requestsInitialized: false,

  setSelectedDestination: (selectedDestination) => set({ selectedDestination }),
  setOriginLocation: (originLocation) => set({ originLocation }),
  setRoutePreference: (routePreference) => set({ routePreference }),
  toggleAccessibilityPreference: (key) =>
    set((state) => {
      const updated = {
        ...state.accessibilityPreferences,
        [key]: !state.accessibilityPreferences[key],
      };
      let newPref = state.routePreference;
      if ((key === "wheelchairFriendly" || key === "avoidStairs") && updated[key]) {
        newPref = "Accessible";
      }
      return {
        accessibilityPreferences: updated,
        routePreference: newPref,
      };
    }),
  setAiQuery: (aiQuery) => set({ aiQuery }),
  setIsListening: (isListening) => set({ isListening }),
  setActiveModal: (activeModal) => set({ activeModal }),
  quickNavigateTo: (dest) => set({ selectedDestination: dest }),

  showToast: (toast) => {
    const id = Date.now().toString();
    set({ activeToast: { ...toast, id } });
  },

  hideToast: () => {
    set({ activeToast: null });
  },

  loginSuccess: (user, token) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("saarthi_user", JSON.stringify(user));
      localStorage.setItem("saarthi_token", token);
      setAuthCookies(user, token);
    }
    set({
      isLoggedIn: true,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      token,
      authInitialized: true,
    });
  },

  updateProfile: async (name, email) => {
    const token = get().token;
    if (!token) throw new Error("Your session has expired. Please sign in again.");

    const response = await fetch(`${OPERATIONS_API_URL}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Unable to update profile.");
    }

    const user: UserProfile = payload.data;
    if (typeof window !== "undefined") {
      localStorage.setItem("saarthi_user", JSON.stringify(user));
      setAuthCookies(user, token);
    }
    set({
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
    });
    return user;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("saarthi_user");
      localStorage.removeItem("saarthi_token");
      clearAuthCookies();
    }
    set({
      isLoggedIn: false,
      userName: "",
      userEmail: "",
      userRole: "user",
      token: null,
      authInitialized: true,
    });
  },

  initAuth: () => {
    if (get().authInitialized) return;
    if (typeof window !== "undefined") {
      try {
        const storedUser = localStorage.getItem("saarthi_user");
        const storedToken = localStorage.getItem("saarthi_token");
        if (storedUser && storedToken) {
          const user: UserProfile = JSON.parse(storedUser);
          setAuthCookies(user, storedToken);
          set({
            isLoggedIn: true,
            userName: user.name,
            userEmail: user.email,
            userRole: user.role,
            token: storedToken,
            authInitialized: true,
          });
          return;
        }
      } catch (err) {
        console.error("Failed to parse stored auth session:", err);
      }
    }
    set({ authInitialized: true });
  },

  addAssistanceRequest: async (request) => {
    const payloadBody = {
      ...request,
      userEmail: request.userEmail || get().userEmail || "",
    };
    const token = get().token;
    const response = await fetch(`${OPERATIONS_API_URL}/operations/assistance-requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payloadBody),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      if (payload.code === "USER_NOT_FOUND_IN_DB" || payload.code === "USER_NOT_FOUND") {
        get().logout();
      }
      throw new Error(payload.message || "Unable to submit assistance request.");
    }
    const newRequest: AssistanceRequest = payload.data;
    const assistanceRequests = [newRequest, ...get().assistanceRequests.filter((item) => item.id !== newRequest.id)];
    set({ assistanceRequests, requestsInitialized: true });

    const serviceName = newRequest.service === "porter" ? "Luggage Porter" : "Golf Cart";
    get().showToast({
      title: "Booking Request Submitted!",
      message: `Your ${serviceName} request has been received and is pending operator assignment.`,
      trackUrl: "/track-requests",
      type: "success",
    });

    return newRequest;
  },

  initAssistanceRequests: async (email?: string) => {
    if (typeof window === "undefined") return;
    try {
      const role = get().userRole;
      const isAdminOrStaff = role && role !== "user";
      const targetEmail = email || (isAdminOrStaff ? "" : get().userEmail);
      const resource = targetEmail ? `assistance-requests?userEmail=${encodeURIComponent(targetEmail)}` : "assistance-requests";
      const assistanceRequests = await fetchOperationsResource<AssistanceRequest>(resource);
      set({
        assistanceRequests,
        requestsInitialized: true,
      });
    } catch (err) {
      console.error("Failed to load assistance requests from database:", err);
      set({ requestsInitialized: true });
    }
  },

  assignAssistanceRequest: async (id, resourceId) => {
    const response = await fetch(`${OPERATIONS_API_URL}/operations/assistance-requests/${id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Unable to assign request.");
    }
    set({
      assistanceRequests: get().assistanceRequests.map((request) =>
        request.id === id ? payload.data : request
      ),
    });
  },

  deleteAssistanceRequest: async (id) => {
    const response = await fetch(`${OPERATIONS_API_URL}/operations/assistance-requests/${id}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) {
      throw new Error(payload.message || "Unable to delete request.");
    }
    set((state) => ({
      assistanceRequests: state.assistanceRequests.filter((request) => request.id !== id),
    }));
  },
}));
