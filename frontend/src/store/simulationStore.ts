import { create } from "zustand";
import { StationFacility, LUCKNOW_STATION_FACILITIES } from "@/data/lucknowStationData";
import { PathResult, calculatePathFromPositionToFacility } from "@/utils/navigationService";

export type ControlMode = "fps" | "orbit";
export type FloorLevel = "G" | "1F";

interface SimulationState {
  controlMode: ControlMode;
  isPointerLocked: boolean;
  playerPosition: [number, number, number];
  playerYaw: number;
  activeFloor: FloorLevel;
  selectedFacility: StationFacility | null;
  teleportTarget: [number, number, number] | null;
  showCrowdHeatmap: boolean;
  isMobile: boolean;
  touchMoveVector: { x: number; y: number };
  touchLookVector: { x: number; y: number };

  // NAVIGATION GRAPH STATE
  navigationSourceFacility: StationFacility | null;
  navigationTargetFacility: StationFacility | null;
  activePathResult: PathResult | null;
  isAccessibleRouteMode: boolean;
  isVoiceEnabled: boolean;
  navigationMode: "guided" | "explore";
  headBobEnabled: boolean;
  isAudioMuted: boolean;

  // LIVE INTERACTIVE NAVIGATION STATE
  isLiveNavigating: boolean;
  currentNavStepIndex: number;
  isNavPaused: boolean;
  hasArrived: boolean;

  // OBSTACLE COLLISION PROXIMITY WARNING STATE
  isNearObstacle: boolean;
  obstacleName: string;

  setControlMode: (mode: ControlMode) => void;
  setIsPointerLocked: (locked: boolean) => void;
  setPlayerState: (position: [number, number, number], yaw: number) => void;
  setObstacleProximity: (near: boolean, name?: string) => void;
  setActiveFloor: (floor: FloorLevel) => void;
  setSelectedFacility: (facility: StationFacility | null) => void;
  teleportTo: (target: [number, number, number] | string) => void;
  clearTeleportTarget: () => void;
  toggleCrowdHeatmap: () => void;
  setIsMobile: (mobile: boolean) => void;
  setTouchMoveVector: (vector: { x: number; y: number }) => void;
  setTouchLookVector: (vector: { x: number; y: number }) => void;
  setNavigationMode: (mode: "guided" | "explore") => void;
  toggleHeadBob: () => void;
  toggleAudioMuted: () => void;

  // NAVIGATION ACTIONS
  setNavigationRoute: (sourceFacilityId: string | null, targetFacilityId: string) => void;
  setNavigationDestination: (facilityId: string) => void;
  setNavigationSource: (facilityId: string | null) => void;
  startLiveNavigation: () => void;
  nextNavStep: () => void;
  prevNavStep: () => void;
  setNavStepIndex: (index: number) => void;
  toggleNavPause: () => void;
  clearNavigation: () => void;
  toggleAccessibleRouteMode: () => void;
  toggleVoiceEnabled: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  controlMode: "orbit",
  isPointerLocked: false,
  playerPosition: [0, 1.6, 26], // Starts at Main Entrance Portico
  playerYaw: 0,
  activeFloor: "G",
  selectedFacility: null,
  teleportTarget: null,
  showCrowdHeatmap: true,
  isMobile: false,
  touchMoveVector: { x: 0, y: 0 },
  touchLookVector: { x: 0, y: 0 },

  // OBSTACLE COLLISION PROXIMITY INITIAL STATE
  isNearObstacle: false,
  obstacleName: "",

  // NAVIGATION INITIAL STATE
  navigationSourceFacility: null,
  navigationTargetFacility: null,
  activePathResult: null,
  isAccessibleRouteMode: false,
  isVoiceEnabled: true,
  navigationMode: "guided",
  headBobEnabled: true,
  isAudioMuted: false,

  // LIVE NAVIGATION INITIAL STATE
  isLiveNavigating: false,
  currentNavStepIndex: 0,
  isNavPaused: false,
  hasArrived: false,

  setControlMode: (mode) => set({ controlMode: mode }),
  setIsPointerLocked: (locked) => set({ isPointerLocked: locked }),
  setObstacleProximity: (near, name = "") => set({ isNearObstacle: near, obstacleName: name }),
  setNavigationMode: (mode) => set({ navigationMode: mode }),
  toggleHeadBob: () => set((s) => ({ headBobEnabled: !s.headBobEnabled })),
  toggleAudioMuted: () => set((s) => ({ isAudioMuted: !s.isAudioMuted })),

  setPlayerState: (position, yaw) => {
    const activeFloor: FloorLevel = position[1] > 4.5 ? "1F" : "G";
    const state = get();
    if (state.navigationTargetFacility && !state.navigationSourceFacility && !state.isLiveNavigating) {
      const activePathResult = calculatePathFromPositionToFacility(
        position,
        state.navigationTargetFacility,
        state.isAccessibleRouteMode
      );
      set({ playerPosition: position, playerYaw: yaw, activeFloor, activePathResult });
    } else {
      set({ playerPosition: position, playerYaw: yaw, activeFloor });
    }
  },
  setActiveFloor: (floor) => set({ activeFloor: floor }),
  setSelectedFacility: (facility) => set({ selectedFacility: facility }),
  teleportTo: (target) => {
    let coords: [number, number, number] | null = null;
    if (typeof target === "string") {
      const facility = LUCKNOW_STATION_FACILITIES.find((f) => f.id === target);
      if (facility) {
        coords = facility.position;
        set({ selectedFacility: facility });
      }
    } else {
      coords = target;
    }
    if (coords) {
      set({ teleportTarget: coords });
    }
  },
  clearTeleportTarget: () => set({ teleportTarget: null }),
  toggleCrowdHeatmap: () => set((state) => ({ showCrowdHeatmap: !state.showCrowdHeatmap })),
  setIsMobile: (mobile) => set({ isMobile: mobile }),
  setTouchMoveVector: (vector) => set({ touchMoveVector: vector }),
  setTouchLookVector: (vector) => set({ touchLookVector: vector }),

  setNavigationRoute: (sourceFacilityId, targetFacilityId) => {
    const targetFacility = LUCKNOW_STATION_FACILITIES.find((f) => f.id === targetFacilityId);
    if (!targetFacility) return;

    let sourceFacility: StationFacility | null = null;
    let startPos: [number, number, number] = get().playerPosition;

    if (sourceFacilityId && sourceFacilityId !== "current") {
      const foundSource = LUCKNOW_STATION_FACILITIES.find((f) => f.id === sourceFacilityId);
      if (foundSource) {
        sourceFacility = foundSource;
        startPos = foundSource.position;
      }
    }

    const { isAccessibleRouteMode } = get();
    const pathResult = calculatePathFromPositionToFacility(
      sourceFacility ? sourceFacility : startPos,
      targetFacility,
      isAccessibleRouteMode
    );

    const activeFloor: FloorLevel = startPos[1] > 4.5 ? "1F" : "G";
    set({
      navigationSourceFacility: sourceFacility,
      navigationTargetFacility: targetFacility,
      activePathResult: pathResult,
      isLiveNavigating: false,
      currentNavStepIndex: 0,
      isNavPaused: false,
      hasArrived: false,
      teleportTarget: startPos,
      activeFloor,
    });
  },

  setNavigationDestination: (facilityId) => {
    const { navigationSourceFacility } = get();
    get().setNavigationRoute(navigationSourceFacility?.id || null, facilityId);
  },

  setNavigationSource: (sourceId) => {
    const { navigationTargetFacility } = get();
    if (navigationTargetFacility) {
      get().setNavigationRoute(sourceId, navigationTargetFacility.id);
    } else {
      const sourceFacility = LUCKNOW_STATION_FACILITIES.find((f) => f.id === sourceId) || null;
      if (sourceFacility) {
        set({
          navigationSourceFacility: sourceFacility,
          teleportTarget: sourceFacility.position,
          activeFloor: sourceFacility.floor,
        });
      } else {
        set({ navigationSourceFacility: null });
      }
    }
  },

  startLiveNavigation: () => {
    const { activePathResult } = get();
    if (!activePathResult || activePathResult.nodes.length === 0) return;

    const startNodePos = activePathResult.nodes[0].position;
    const activeFloor: FloorLevel = startNodePos[1] > 4.5 ? "1F" : "G";

    set({
      isLiveNavigating: true,
      currentNavStepIndex: 0,
      isNavPaused: false,
      hasArrived: false,
      teleportTarget: startNodePos,
      activeFloor,
    });
  },

  nextNavStep: () => {
    const { activePathResult, currentNavStepIndex } = get();
    if (!activePathResult) return;

    const maxIdx = activePathResult.nodes.length - 1;
    if (currentNavStepIndex >= maxIdx) {
      set({ hasArrived: true, isNavPaused: true });
      return;
    }

    const nextIdx = currentNavStepIndex + 1;
    const nextNodePos = activePathResult.nodes[nextIdx].position;
    const activeFloor: FloorLevel = nextNodePos[1] > 4.5 ? "1F" : "G";

    const isLast = nextIdx >= maxIdx;

    set({
      currentNavStepIndex: nextIdx,
      teleportTarget: nextNodePos,
      activeFloor,
      hasArrived: isLast,
    });
  },

  prevNavStep: () => {
    const { activePathResult, currentNavStepIndex } = get();
    if (!activePathResult || currentNavStepIndex <= 0) return;

    const prevIdx = currentNavStepIndex - 1;
    const prevNodePos = activePathResult.nodes[prevIdx].position;
    const activeFloor: FloorLevel = prevNodePos[1] > 4.5 ? "1F" : "G";

    set({
      currentNavStepIndex: prevIdx,
      teleportTarget: prevNodePos,
      activeFloor,
      hasArrived: false,
    });
  },

  setNavStepIndex: (index) => {
    const { activePathResult } = get();
    if (!activePathResult || index < 0 || index >= activePathResult.nodes.length) return;

    const nodePos = activePathResult.nodes[index].position;
    const activeFloor: FloorLevel = nodePos[1] > 4.5 ? "1F" : "G";
    const isLast = index >= activePathResult.nodes.length - 1;

    set({
      currentNavStepIndex: index,
      teleportTarget: nodePos,
      activeFloor,
      hasArrived: isLast,
    });
  },

  toggleNavPause: () => set((s) => ({ isNavPaused: !s.isNavPaused })),

  clearNavigation: () =>
    set({
      navigationSourceFacility: null,
      navigationTargetFacility: null,
      activePathResult: null,
      isLiveNavigating: false,
      currentNavStepIndex: 0,
      isNavPaused: false,
      hasArrived: false,
    }),

  toggleAccessibleRouteMode: () => {
    const newAccessible = !get().isAccessibleRouteMode;
    const { navigationSourceFacility, navigationTargetFacility, playerPosition } = get();
    let pathResult = null;

    if (navigationTargetFacility) {
      const startPos = navigationSourceFacility ? navigationSourceFacility.position : playerPosition;
      pathResult = calculatePathFromPositionToFacility(startPos, navigationTargetFacility, newAccessible);
    }
    set({ isAccessibleRouteMode: newAccessible, activePathResult: pathResult });
  },

  toggleVoiceEnabled: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
}));
