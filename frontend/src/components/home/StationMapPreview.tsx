"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Compass,
  Layers,
  Navigation,
  X,
  ChevronRight,
  Play,
  Maximize2,
  Minimize2,
  ShieldAlert,
  ArrowRightLeft,
  SlidersHorizontal,
  Bot,
  Send,
  Activity,
  Box,
} from "lucide-react";
import { usePassengerStore } from "@/store/usePassengerStore";
import { logNavigationRequest } from "@/lib/operations-api";
import {
  FacilityStatuses,
  fetchFacilityStatuses,
  logUnansweredQuestion,
} from "@/lib/station-tools-api";

const FACILITY_QUERY_TERMS: Record<string, string[]> = {
  lift: ["lift", "elevator"],
  washroom: ["washroom", "toilet", "restroom"],
  ticket_counter: ["ticket counter", "ticket window", "booking counter"],
  escalator: ["escalator"],
  drinking_water: ["drinking water", "water machine", "water"],
  waiting_room: ["waiting room", "waiting hall", "lounge"],
};

const FACILITY_DISPLAY_NAMES: Record<string, string> = {
  lift: "Lift",
  washroom: "Washroom",
  ticket_counter: "Ticket Counter",
  escalator: "Escalator",
  drinking_water: "Drinking Water",
  waiting_room: "Waiting Room",
};

function findFacilityInQuery(query: string) {
  return Object.entries(FACILITY_QUERY_TERMS).find(([, terms]) =>
    terms.some((term) => query.includes(term))
  )?.[0];
}

function facilityReply(facility: string, statuses: FacilityStatuses) {
  const name = FACILITY_DISPLAY_NAMES[facility] || facility;
  return statuses[facility] === "working"
    ? `${name} is currently working and available. I can help you navigate there.`
    : `${name} is currently not working. Please use an alternative facility or contact the station help desk.`;
}

const Interactive3DMapModal = dynamic(
  () => import("@/components/simulation/Interactive3DMapModal").then((m) => m.Interactive3DMapModal),
  { ssr: false }
);

// ── Categories & Icons ────────────────────────────────────────────────────────
const CATS: Record<string, { label: string; color: string; icon: string }> = {
  entry: { label: "Entry / Exit", color: "#475569", icon: "⭆" },
  transport: { label: "External Transport", color: "#334155", icon: "🚕" },
  service: { label: "Passenger Service", color: "#134489", icon: "🛎" },
  safety: { label: "Safety & Medical", color: "#dc2626", icon: "⛑" },
  waiting: { label: "Lounge / Waiting", color: "#2563eb", icon: "🛋" },
  food: { label: "Food & Retail", color: "#059669", icon: "🍽" },
  amenity: { label: "Amenity", color: "#65a30d", icon: "🚻" },
  vertical: { label: "Vertical Access", color: "#9333ea", icon: "⇅" },
  platform: { label: "Platform", color: "#134489", icon: "🚆" },
  cart: { label: "Golf Cart Stop", color: "#db2777", icon: "🛺" },
  assembly: { label: "Assembly Point", color: "#16a34a", icon: "⚑" },
};

export interface Facility {
  id: string;
  name: string;
  cat: string;
  x: number;
  y: number;
  accessible: boolean;
  desc?: string;
}

function getFacilityLabel(facility: Facility) {
  if (facility.cat === "cart") {
    const platform = facility.name.match(/Platform \d+/)?.[0];
    return platform ? ["Cart stop", platform] : ["Golf cart", "Concourse bay"];
  }

  const cleanName = facility.name
    .replace(" (Touchscreen)", "")
    .replace(" (Accessible)", "")
    .replace(" (FOB West Access)", " West")
    .replace(" (FOB East Access)", " East");
  const words = cleanName.split(" ");
  if (cleanName.length <= 18 || words.length === 1) return [cleanName];

  let bestIndex = 1;
  let smallestDifference = Number.POSITIVE_INFINITY;
  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(" ");
    const right = words.slice(index).join(" ");
    const difference = Math.abs(left.length - right.length);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      bestIndex = index;
    }
  }
  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

function getFacilityLabelY(facility: Facility) {
  if (facility.cat === "assembly") return 18;
  if (facility.cat === "platform") return 0;
  if (facility.cat === "cart") return -13;
  if (facility.cat === "safety" || facility.cat === "waiting" || facility.y === 485) return -18;
  return 17;
}

const FACILITIES: Facility[] = [
  // Plaza & external transport
  { id: "ENTRY_A", name: "Entry Gate A (West)", cat: "entry", x: 150, y: 100, accessible: true, desc: "Main North-West Drop-off Porch" },
  { id: "ENTRY_B", name: "Entry Gate B (Central)", cat: "entry", x: 620, y: 100, accessible: true, desc: "Central Station Portico Entrance" },
  { id: "EXIT_C", name: "Exit Gate C (East)", cat: "entry", x: 1180, y: 100, accessible: true, desc: "Eastern Exit & Bus Terminal Walkway" },
  { id: "PARKING", name: "Multi-level Parking", cat: "transport", x: 100, y: 150, accessible: true, desc: "Covered 4-wheel & 2-wheel parking" },
  { id: "TAXI", name: "Prepaid Taxi Stand", cat: "transport", x: 300, y: 150, accessible: true, desc: "24/7 Official Railway Taxi Bay" },
  { id: "BUS", name: "City Bus Stop", cat: "transport", x: 460, y: 150, accessible: true, desc: "Feeder buses to Charbagh & Gomti Nagar" },
  { id: "METRO", name: "Metro Station Link", cat: "transport", x: 760, y: 150, accessible: true, desc: "Direct skywalk to Lucknow Metro" },
  { id: "EVCHG", name: "EV Charging Bay", cat: "transport", x: 940, y: 150, accessible: true, desc: "Fast DC Chargers for electric vehicles" },
  { id: "CYCLE", name: "Bicycle Parking", cat: "transport", x: 1120, y: 150, accessible: true, desc: "Secure bike racks" },

  // Concourse Services
  { id: "TICKET", name: "Unreserved Ticket Counter", cat: "service", x: 200, y: 250, accessible: true, desc: "UTS & General Ticket Booking" },
  { id: "RESV", name: "Reservation Office (PRS)", cat: "service", x: 330, y: 250, accessible: true, desc: "Passenger Reservation System Counters" },
  { id: "INQ", name: "Inquiry Counter (Touchscreen)", cat: "service", x: 460, y: 250, accessible: true, desc: "Live Train Status & Platform Info" },
  { id: "HELP", name: "May I Help You Desk", cat: "service", x: 590, y: 250, accessible: true, desc: "NER Passenger Assistance Desk" },
  { id: "WHEELCTR", name: "Sahayata Wheelchair Counter", cat: "service", x: 720, y: 250, accessible: true, desc: "Free Wheelchair & Coolie Booking" },
  { id: "PARCEL", name: "Parcel Office", cat: "service", x: 850, y: 250, accessible: true, desc: "Luggage & Cargo Booking" },
  { id: "CLOAK", name: "Cloak Room & Lockers", cat: "service", x: 980, y: 250, accessible: true, desc: "24-Hour Luggage Storage Facility" },
  { id: "CURREX", name: "Atmosphere Currency Exch.", cat: "service", x: 1110, y: 250, accessible: true, desc: "Foreign Exchange & Money Transfer" },

  // Safety & Medical
  { id: "POLICE", name: "Railway Police Post (RPF)", cat: "safety", x: 200, y: 390, accessible: true, desc: "Security & Lost Item Registration" },
  { id: "MEDICAL", name: "Emergency Medical Booth", cat: "safety", x: 330, y: 390, accessible: true, desc: "First-aid & Ambulance Bay" },
  { id: "PHARM", name: "Jan Aushadhi Pharmacy", cat: "safety", x: 460, y: 390, accessible: true, desc: "24/7 Medicines & Essentials" },

  // Waiting Halls & Lounges
  { id: "WAIT1", name: "General Waiting Hall", cat: "waiting", x: 610, y: 390, accessible: true, desc: "Free Seating & Charging Points" },
  { id: "ACWAIT", name: "AC Waiting Lounge", cat: "waiting", x: 750, y: 390, accessible: true, desc: "Air Conditioned Comfort Seating" },
  { id: "EXECLNG", name: "IRCTC Executive Lounge", cat: "waiting", x: 880, y: 390, accessible: true, desc: "Premium Buffet, Wi-Fi & Recliners" },
  { id: "PRIVLNG", name: "VIP Protocol Lounge", cat: "waiting", x: 1010, y: 390, accessible: true, desc: "Dignitary & Railway Officer Lounge" },
  { id: "DORM", name: "Retiring Rooms / Dorms", cat: "waiting", x: 1140, y: 390, accessible: true, desc: "Air-conditioned overnight pods" },

  // Food & Retail
  { id: "FOODCT", name: "Main Food Court", cat: "food", x: 330, y: 440, accessible: true, desc: "Multi-vendor hygienic food zone" },
  { id: "RESTO", name: "IRCTC Restaurant", cat: "food", x: 470, y: 440, accessible: true, desc: "Sit-down thali & continental dining" },
  { id: "TEA", name: "Kulhad Tea & Snacks", cat: "food", x: 590, y: 440, accessible: true, desc: "Fresh tea, coffee & samosas" },
  { id: "BOOKS", name: "Higginbothams Books", cat: "food", x: 700, y: 440, accessible: true, desc: "Magazines, books & travel accessories" },
  { id: "GSTORE", name: "General Convenience Store", cat: "food", x: 810, y: 440, accessible: true, desc: "Packed snacks, water & toiletries" },
  { id: "ATM1", name: "SBI / HDFC ATM Bay", cat: "food", x: 920, y: 440, accessible: true, desc: "Cash Withdrawal kiosk" },

  // Amenities
  { id: "WASHA", name: "Washroom Block West", cat: "amenity", x: 200, y: 440, accessible: true, desc: "Clean Gents & Ladies Toilets" },
  { id: "WASHB", name: "Accessible Washroom East", cat: "amenity", x: 1030, y: 440, accessible: true, desc: "Braille signs & ramp entry" },
  { id: "BABYRM", name: "Mother & Baby Care Room", cat: "amenity", x: 1140, y: 440, accessible: true, desc: "Feeding chairs & diaper tables" },
  { id: "CHGSTN", name: "Fast Mobile Charging Hub", cat: "amenity", x: 270, y: 485, accessible: true, desc: "USB-C & Fast Charge Station" },
  { id: "WATER1", name: "RO Water Vending Machine", cat: "amenity", x: 520, y: 485, accessible: true, desc: "Purified Cold Water @ ₹1/L" },

  // Vertical Access
  { id: "LIFT1", name: "Lift 1 (FOB West Access)", cat: "vertical", x: 400, y: 560, accessible: true, desc: "Wheelchair accessible lift to FOB deck" },
  { id: "ESC1", name: "Escalator 1 (FOB Up)", cat: "vertical", x: 600, y: 560, accessible: false, desc: "Moving stairs to FOB Level" },
  { id: "STAIR1", name: "Main Staircase West", cat: "vertical", x: 750, y: 560, accessible: false, desc: "Wide central stairs to FOB deck" },
  { id: "LIFT2", name: "Lift 2 (FOB East Access)", cat: "vertical", x: 950, y: 560, accessible: true, desc: "Wheelchair accessible lift to FOB deck" },
  { id: "RAMP1", name: "Accessible Ramp East", cat: "vertical", x: 1080, y: 560, accessible: true, desc: "Low-gradient ramp to FOB link" },

  // Platforms 1-8
  { id: "PF1", name: "Platform 1", cat: "platform", x: 130, y: 720, accessible: true, desc: "Main Platform — Vande Bharat & Expresses" },
  { id: "PF2", name: "Platform 2", cat: "platform", x: 280, y: 720, accessible: true, desc: "Express & Intercity Trains" },
  { id: "PF3", name: "Platform 3", cat: "platform", x: 430, y: 720, accessible: true, desc: "Shatabdi & Mail Trains" },
  { id: "PF4", name: "Platform 4", cat: "platform", x: 580, y: 720, accessible: true, desc: "Golf Cart Enabled Platform" },
  { id: "PF5", name: "Platform 5", cat: "platform", x: 730, y: 720, accessible: true, desc: "Passenger & MEMU Trains" },
  { id: "PF6", name: "Platform 6", cat: "platform", x: 880, y: 720, accessible: true, desc: "Superfast & Rajdhani Express" },
  { id: "PF7", name: "Platform 7", cat: "platform", x: 1030, y: 720, accessible: true, desc: "Regional Passenger Lines" },
  { id: "PF8", name: "Platform 8", cat: "platform", x: 1180, y: 720, accessible: true, desc: "Eastern Terminal Platform & Cart Stop" },

  // Golf Cart Boarding
  { id: "CART_CONC", name: "Golf Cart Bay — Concourse", cat: "cart", x: 610, y: 490, accessible: true, desc: "Free Senior & Divyangjan Shuttle" },
  { id: "CART_PF1", name: "Golf Cart Stop — Platform 1", cat: "cart", x: 130, y: 655, accessible: true, desc: "Platform 1 shuttle pickup and drop-off" },
  { id: "CART_PF2", name: "Golf Cart Stop — Platform 2", cat: "cart", x: 280, y: 655, accessible: true, desc: "Platform 2 shuttle pickup and drop-off" },
  { id: "CART_PF3", name: "Golf Cart Stop — Platform 3", cat: "cart", x: 430, y: 655, accessible: true, desc: "Platform 3 shuttle pickup and drop-off" },
  { id: "CART_PF4", name: "Golf Cart Stop — Platform 4", cat: "cart", x: 580, y: 655, accessible: true, desc: "Middle Platform Drop-off Point" },
  { id: "CART_PF5", name: "Golf Cart Stop — Platform 5", cat: "cart", x: 730, y: 655, accessible: true, desc: "Platform 5 shuttle pickup and drop-off" },
  { id: "CART_PF6", name: "Golf Cart Stop — Platform 6", cat: "cart", x: 880, y: 655, accessible: true, desc: "Platform 6 shuttle pickup and drop-off" },
  { id: "CART_PF7", name: "Golf Cart Stop — Platform 7", cat: "cart", x: 1030, y: 655, accessible: true, desc: "Platform 7 shuttle pickup and drop-off" },
  { id: "CART_PF8", name: "Golf Cart Stop — Platform 8", cat: "cart", x: 1180, y: 655, accessible: true, desc: "East Terminal Golf Cart Stop" },

  // Assembly Points
  { id: "ASM1", name: "Assembly Point 1 (West Plaza)", cat: "assembly", x: 300, y: 58, accessible: true, desc: "Evacuation Assembly Area North-West" },
  { id: "ASM2", name: "Assembly Point 2 (East Lawn)", cat: "assembly", x: 1100, y: 58, accessible: true, desc: "Evacuation Assembly Area North-East" },
];

const JUNCTIONS: Record<string, { x: number; y: number }> = {
  J_PLAZA_W: { x: 200, y: 150 }, J_PLAZA_M: { x: 620, y: 150 }, J_PLAZA_E: { x: 1030, y: 150 },
  J_CONC_W: { x: 200, y: 290 }, J_CONC_M: { x: 620, y: 290 }, J_CONC_E: { x: 1030, y: 290 },
  J_MID_W: { x: 270, y: 490 }, J_MID_M: { x: 610, y: 490 }, J_MID_E: { x: 1030, y: 490 },
  J_FOB_W: { x: 400, y: 620 }, J_FOB_M: { x: 750, y: 620 }, J_FOB_E: { x: 1080, y: 620 },
  FOB_PF1: { x: 130, y: 655 }, FOB_PF2: { x: 280, y: 655 }, FOB_PF3: { x: 430, y: 655 }, FOB_PF4: { x: 580, y: 655 },
  FOB_PF5: { x: 730, y: 655 }, FOB_PF6: { x: 880, y: 655 }, FOB_PF7: { x: 1030, y: 655 }, FOB_PF8: { x: 1180, y: 655 },
};

const ALLNODES: Record<string, { x: number; y: number }> = {
  ...Object.fromEntries(FACILITIES.map((f) => [f.id, { x: f.x, y: f.y }])),
  ...JUNCTIONS,
};

// Give every Zone 2 concourse node a direct, nearest-node entrance into Zone 3.
const ZONE_2_TO_ZONE_3_EDGES = [
  ["TICKET", "POLICE", "walk"],
  ["RESV", "MEDICAL", "walk"],
  ["INQ", "PHARM", "walk"],
  ["HELP", "WAIT1", "walk"],
  ["WHEELCTR", "ACWAIT", "walk"],
  ["PARCEL", "EXECLNG", "walk"],
  ["CLOAK", "PRIVLNG", "walk"],
  ["CURREX", "DORM", "walk"],
];

const RAW_EDGES = [
  ["ENTRY_A", "J_PLAZA_W", "walk"], ["PARKING", "J_PLAZA_W", "walk"], ["TAXI", "J_PLAZA_W", "walk"],
  ["J_PLAZA_W", "J_PLAZA_M", "walk"], ["ENTRY_B", "J_PLAZA_M", "walk"], ["BUS", "J_PLAZA_M", "walk"], ["METRO", "J_PLAZA_M", "walk"],
  ["J_PLAZA_M", "J_PLAZA_E", "walk"], ["EVCHG", "J_PLAZA_E", "walk"], ["CYCLE", "J_PLAZA_E", "walk"], ["EXIT_C", "J_PLAZA_E", "walk"],
  ["J_PLAZA_W", "J_CONC_W", "walk"], ["J_PLAZA_M", "J_CONC_M", "walk"], ["J_PLAZA_E", "J_CONC_E", "walk"],
  ["J_CONC_W", "TICKET", "walk"], ["TICKET", "RESV", "walk"], ["RESV", "INQ", "walk"], ["INQ", "HELP", "walk"],
  ["HELP", "J_CONC_M", "walk"], ["J_CONC_M", "WHEELCTR", "walk"], ["WHEELCTR", "PARCEL", "walk"], ["PARCEL", "CLOAK", "walk"],
  ["CLOAK", "CURREX", "walk"], ["CURREX", "J_CONC_E", "walk"],
  ...ZONE_2_TO_ZONE_3_EDGES,
  ["J_CONC_W", "POLICE", "walk"], ["POLICE", "MEDICAL", "walk"], ["MEDICAL", "PHARM", "walk"], ["PHARM", "WAIT1", "walk"],
  ["WAIT1", "ACWAIT", "walk"], ["ACWAIT", "EXECLNG", "walk"], ["EXECLNG", "PRIVLNG", "walk"], ["PRIVLNG", "DORM", "walk"],
  ["DORM", "J_CONC_E", "walk"],
  ["POLICE", "WASHA", "walk"], ["WASHA", "J_MID_W", "walk"], ["J_MID_W", "FOODCT", "walk"], ["FOODCT", "RESTO", "walk"],
  ["RESTO", "J_MID_M", "walk"], ["J_MID_M", "TEA", "walk"], ["TEA", "BOOKS", "walk"], ["BOOKS", "GSTORE", "walk"],
  ["GSTORE", "J_MID_E", "walk"], ["J_MID_E", "ATM1", "walk"], ["ATM1", "WASHB", "walk"], ["WASHB", "BABYRM", "walk"],
  ["BABYRM", "DORM", "walk"],
  ["J_MID_W", "CHGSTN", "walk"], ["J_MID_M", "WATER1", "walk"],
  ["ACWAIT", "J_MID_M", "walk"], ["WAIT1", "J_MID_W", "walk"], ["EXECLNG", "J_MID_E", "walk"],
  ["J_MID_M", "CART_CONC", "walk"],
  ["J_MID_W", "J_FOB_W", "walk"], ["CHGSTN", "LIFT1", "walk"], ["LIFT1", "J_FOB_W", "lift"],
  ["J_MID_M", "J_FOB_M", "walk"], ["WATER1", "ESC1", "walk"], ["ESC1", "J_FOB_M", "escalator"],
  ["J_FOB_M", "STAIR1", "walk"], ["STAIR1", "J_FOB_M", "stairs"],
  ["J_MID_E", "J_FOB_E", "walk"], ["J_FOB_E", "LIFT2", "lift"], ["J_FOB_E", "RAMP1", "ramp"],
  ["J_FOB_W", "J_FOB_M", "walk"], ["J_FOB_M", "J_FOB_E", "walk"],
  ["J_FOB_W", "FOB_PF3", "walk"], ["J_FOB_M", "FOB_PF5", "walk"], ["J_FOB_E", "FOB_PF7", "walk"],
  ["FOB_PF1", "FOB_PF2", "walk"], ["FOB_PF2", "FOB_PF3", "walk"], ["FOB_PF3", "FOB_PF4", "walk"],
  ["FOB_PF4", "FOB_PF5", "walk"], ["FOB_PF5", "FOB_PF6", "walk"], ["FOB_PF6", "FOB_PF7", "walk"],
  ["FOB_PF7", "FOB_PF8", "walk"],
  ["FOB_PF1", "PF1", "lift"], ["FOB_PF1", "PF1", "stairs"],
  ["FOB_PF2", "PF2", "lift"], ["FOB_PF2", "PF2", "stairs"],
  ["FOB_PF3", "PF3", "lift"], ["FOB_PF3", "PF3", "stairs"],
  ["FOB_PF4", "PF4", "lift"], ["FOB_PF4", "PF4", "stairs"],
  ["FOB_PF5", "PF5", "lift"], ["FOB_PF5", "PF5", "stairs"],
  ["FOB_PF6", "PF6", "lift"], ["FOB_PF6", "PF6", "stairs"],
  ["FOB_PF7", "PF7", "lift"], ["FOB_PF7", "PF7", "stairs"],
  ["FOB_PF8", "PF8", "lift"], ["FOB_PF8", "PF8", "stairs"],
  ["CART_CONC", "CART_PF4", "cart"],
  ["CART_PF1", "CART_PF2", "cart"], ["CART_PF2", "CART_PF3", "cart"], ["CART_PF3", "CART_PF4", "cart"],
  ["CART_PF4", "CART_PF5", "cart"], ["CART_PF5", "CART_PF6", "cart"], ["CART_PF6", "CART_PF7", "cart"],
  ["CART_PF7", "CART_PF8", "cart"],
  ["CART_PF1", "PF1", "walk"], ["CART_PF2", "PF2", "walk"], ["CART_PF3", "PF3", "walk"], ["CART_PF4", "PF4", "walk"],
  ["CART_PF5", "PF5", "walk"], ["CART_PF6", "PF6", "walk"], ["CART_PF7", "PF7", "walk"], ["CART_PF8", "PF8", "walk"],
  ["CART_CONC", "J_MID_M", "walk"],
  ["ENTRY_A", "ASM1", "walk"], ["EXIT_C", "ASM2", "walk"],
];

function calcDist(aKey: string, bKey: string) {
  const A = ALLNODES[aKey], B = ALLNODES[bKey];
  if (!A || !B) return 40;
  return Math.round(Math.hypot(A.x - B.x, A.y - B.y) / 6);
}

export interface Edge {
  a: string;
  b: string;
  type: string;
  accessible: boolean;
  d: number;
}

const EDGES: Edge[] = RAW_EDGES.map(([a, b, type]) => ({
  a,
  b,
  type,
  accessible: !(type === "stairs" || type === "escalator"),
  d: Math.max(4, calcDist(a, b)),
}));

const PERSONAS: Record<string, { label: string; icon: string; excludeInaccessible: boolean; avoidStairs: boolean; preferLift: boolean; slow: boolean }> = {
  standard: { label: "Walking", icon: "🚶", excludeInaccessible: false, avoidStairs: false, preferLift: false, slow: false },
  wheelchair: { label: "Wheelchair", icon: "♿", excludeInaccessible: true, avoidStairs: true, preferLift: true, slow: true },
  blind: { label: "Low Vision", icon: "🦯", excludeInaccessible: false, avoidStairs: false, preferLift: true, slow: true },
  senior: { label: "Senior", icon: "🧓", excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  pregnant: { label: "Pregnant", icon: "🤰", excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  luggage: { label: "Heavy Luggage", icon: "🧳", excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  vip: { label: "VIP / Staff", icon: "⭐", excludeInaccessible: false, avoidStairs: false, preferLift: true, slow: false },
};

export function StationMapPreview() {
  const { selectedDestination, setSelectedDestination, originLocation, accessibilityPreferences } = usePassengerStore();

  // Navigation endpoints & profile state
  const [fromNode, setFromNode] = useState("ENTRY_A");
  const [toNode, setToNode] = useState("PF6");
  const [activePersona, setActivePersona] = useState("standard");
  const [optMode, setOptMode] = useState<"balanced" | "fastest">("balanced");
  const [wantCart, setWantCart] = useState(false);

  // Advanced options accordion
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [avoidStairs, setAvoidStairs] = useState(false);
  const [preferLift, setPreferLift] = useState(false);
  const [preferRamps, setPreferRamps] = useState(false);

  // Layout & Popover states
  const [activeMobileTab, setActiveMobileTab] = useState<"map" | "planner">("map");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [show3DModal, setShow3DModal] = useState(false);
  const [selectedFacilityModal, setSelectedFacilityModal] = useState<Facility | null>(null);
  const [layersPopoverOpen, setLayersPopoverOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [systemInfoOpen, setSystemInfoOpen] = useState(false);

  // AI Drawer state
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    { sender: "ai", text: "Hello! I am SAARTHI AI. Ask me for accessible paths, least crowded routes, or specific platforms at Lucknow Junction." },
  ]);

  // Digital Twin state
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [twinState, setTwinState] = useState<Record<string, { crowd: number; cleanliness: number; operational: boolean }>>({});

  // Map layer controls
  const [layers, setLayers] = useState({
    walk: true,
    wheel: true,
    cart: true,
    crowd: true,
    facilities: true,
    techNodes: false,
  });

  // Map viewport pan
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const touchStart = useRef({ x: 0, y: 0 });

  // Navigation execution state
  const [routeResult, setRouteResult] = useState<{
    path: string[];
    edgesUsed: Edge[];
    cost: number;
    steps: { text: string; node: string; cart?: boolean; arrive?: boolean; icon?: string }[];
    etaMin: number;
    distMeters: number;
  } | null>(null);

  // Turn-by-turn state
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAutoNav, setIsAutoNav] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [voiceEnabled] = useState(true);
  const autoNavSpeedMs = 3500;

  // Auto-sync accessibility preferences from store
  useEffect(() => {
    if (accessibilityPreferences.wheelchairFriendly) {
      setActivePersona("wheelchair");
    } else if (accessibilityPreferences.seniorFriendly) {
      setActivePersona("senior");
    } else if (accessibilityPreferences.avoidStairs) {
      setAvoidStairs(true);
    }
  }, [accessibilityPreferences]);

  // Synchronize store selectedDestination & originLocation
  useEffect(() => {
    if (selectedDestination) {
      const match = FACILITIES.find(
        (f) => f.name.toLowerCase().includes(selectedDestination.toLowerCase()) || f.id.toLowerCase() === selectedDestination.toLowerCase()
      );
      if (match) {
        setToNode(match.id);
      }
    }
  }, [selectedDestination]);

  useEffect(() => {
    if (originLocation) {
      const match = FACILITIES.find(
        (f) => f.name.toLowerCase().includes(originLocation.toLowerCase()) || f.id.toLowerCase() === originLocation.toLowerCase()
      );
      if (match) {
        setFromNode(match.id);
      }
    }
  }, [originLocation]);

  // Fetch / simulate digital twin telemetry
  const fetchBackendTwinData = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/v1/spatial/digital-twin`);
      if (res.ok) {
        const data = await res.json();
        if (data.facility_twin_state) {
          setTwinState(data.facility_twin_state);
          return;
        }
      }
    } catch {
      // Fallback local twin simulation
    }
    const fallback: Record<string, { crowd: number; cleanliness: number; operational: boolean }> = {};
    FACILITIES.forEach((f) => {
      let crowd = 0.15 + Math.random() * 0.25;
      if (f.cat === "platform") crowd = 0.35 + Math.random() * 0.4;
      if (f.id === "TICKET" || f.id === "FOODCT") crowd = 0.55 + Math.random() * 0.3;
      fallback[f.id] = { crowd, cleanliness: 4.8, operational: true };
    });
    setTwinState(fallback);
  }, []);

  useEffect(() => {
    fetchBackendTwinData();
    const interval = setInterval(fetchBackendTwinData, 5000);
    return () => clearInterval(interval);
  }, [fetchBackendTwinData]);

  // Swap From and To nodes
  const handleSwapNodes = () => {
    const temp = fromNode;
    setFromNode(toNode);
    setToNode(temp);
  };

  // Dijkstra Algorithm Engine with multi-modal routing & emergency evacuation support
  const calculateRoute = useCallback(() => {
    const targetDestinationNode = emergencyMode ? (fromNode === "EXIT_C" ? "ASM2" : "ASM1") : toNode;
    const p = PERSONAS[activePersona] || PERSONAS.standard;

    const profile = {
      excludeInaccessible: p.excludeInaccessible,
      avoidStairs: p.avoidStairs || avoidStairs,
      preferLift: p.preferLift || preferLift,
      preferRamps: preferRamps,
      slow: p.slow,
      opt: optMode,
      wantCart,
    };

    // Build Adjacency Graph
    const adj: Record<string, { to: string; e: Edge }[]> = {};
    const addEdge = (a: string, b: string, e: Edge) => {
      if (!adj[a]) adj[a] = [];
      adj[a].push({ to: b, e });
    };

    EDGES.forEach((e) => {
      if (profile.excludeInaccessible && !e.accessible) return;
      addEdge(e.a, e.b, e);
      addEdge(e.b, e.a, e);
    });

    type RouteCandidate = {
      path: string[];
      edges: Edge[];
      cost: number;
      distance: number;
    };

    const edgeKey = (edge: Edge) => [edge.a, edge.b].sort().join("::");

    const findShortestPath = (penalizedEdges = new Set<string>()): RouteCandidate | null => {
      const distances: Record<string, number> = {};
      const previous: Record<string, [string, Edge]> = {};
      const visited = new Set<string>();

      Object.keys(ALLNODES).forEach((node) => (distances[node] = Infinity));
      distances[fromNode] = 0;
      const queue: [number, string][] = [[0, fromNode]];

      while (queue.length > 0) {
        queue.sort((a, b) => a[0] - b[0]);
        const [distance, node] = queue.shift()!;
        if (visited.has(node)) continue;
        visited.add(node);
        if (node === targetDestinationNode) break;

        (adj[node] || []).forEach(({ to, e }) => {
          let weight = e.d;

          // Fastest is strictly the shortest physical route. Balanced retains
          // passenger preferences while searching for a practical alternative.
          if (profile.opt === "balanced") {
            if (profile.wantCart && e.type === "cart") weight *= 0.3;
            if (profile.preferLift && (e.type === "lift" || e.type === "ramp")) weight *= 0.75;
            if (profile.preferRamps && e.type === "ramp") weight *= 0.6;
          }

          if (profile.avoidStairs && e.type === "stairs") weight += 500;
          if (penalizedEdges.has(edgeKey(e))) weight *= 8;

          const nextDistance = distance + weight;
          if (nextDistance < distances[to]) {
            distances[to] = nextDistance;
            previous[to] = [node, e];
            queue.push([nextDistance, to]);
          }
        });
      }

      if (distances[targetDestinationNode] === Infinity) return null;

      const candidatePath = [targetDestinationNode];
      const candidateEdges: Edge[] = [];
      let current = targetDestinationNode;
      while (current !== fromNode && previous[current]) {
        const [previousNode, edge] = previous[current];
        candidateEdges.unshift(edge);
        candidatePath.unshift(previousNode);
        current = previousNode;
      }

      if (candidatePath[0] !== fromNode) return null;
      return {
        path: candidatePath,
        edges: candidateEdges,
        cost: distances[targetDestinationNode],
        distance: candidateEdges.reduce((total, edge) => total + edge.d, 0),
      };
    };

    const shortestRoute = findShortestPath();
    if (!shortestRoute) {
      setRouteResult(null);
      return;
    }

    let selectedRoute = shortestRoute;

    if (profile.opt === "balanced" && shortestRoute.edges.length > 1) {
      const alternatives = shortestRoute.edges
        .map((edge) => findShortestPath(new Set([edgeKey(edge)])))
        .filter((route): route is RouteCandidate => Boolean(route))
        .filter(
          (route, index, routes) =>
            route.distance > shortestRoute.distance &&
            route.distance <= shortestRoute.distance * 2 &&
            routes.findIndex((candidate) => candidate.path.join(">") === route.path.join(">")) === index
        );

      if (alternatives.length > 0) {
        const distances = alternatives.map((route) => route.distance).sort((a, b) => a - b);
        const averageTarget = (shortestRoute.distance + distances[distances.length - 1]) / 2;
        selectedRoute = alternatives.reduce((best, route) =>
          Math.abs(route.distance - averageTarget) < Math.abs(best.distance - averageTarget) ? route : best
        );
      }
    }

    const path = selectedRoute.path;
    const edgesUsed = selectedRoute.edges;

    // Generate Turn-by-Turn Steps
    let accumDist = 0;
    const steps: { text: string; node: string; cart?: boolean; arrive?: boolean; icon?: string }[] = [];
    const speed = p.slow ? 45 : 65;

    const fromFac = FACILITIES.find((f) => f.id === fromNode)?.name || fromNode;
    steps.push({ text: `Start at ${fromFac}. Keep device in hand as navigation auto-advances.`, node: fromNode, icon: "🚩" });

    edgesUsed.forEach((e, idx) => {
      accumDist += e.d;
      const targetNode = path[idx + 1];
      const targetFac = FACILITIES.find((f) => f.id === targetNode)?.name || targetNode;

      if (e.type === "lift") {
        steps.push({ text: `Take Lift to FOB deck toward ${targetFac}.`, node: targetNode, icon: "🛗" });
      } else if (e.type === "stairs") {
        steps.push({ text: `Use stairs toward ${targetFac}.`, node: targetNode, icon: "🪜" });
      } else if (e.type === "ramp") {
        steps.push({ text: `Walk along accessible ramp to ${targetFac}.`, node: targetNode, icon: "♿" });
      } else if (e.type === "cart") {
        steps.push({ text: `Board Golf Cart shuttle heading to ${targetFac}.`, node: targetNode, cart: true, icon: "🛺" });
      } else {
        steps.push({ text: `Walk ${e.d}m straight toward ${targetFac}.`, node: targetNode, icon: "🚶" });
      }
    });

    const destFac = FACILITIES.find((f) => f.id === targetDestinationNode)?.name || targetDestinationNode;
    steps.push({ text: `You have arrived at ${destFac}!`, node: targetDestinationNode, arrive: true, icon: "🎉" });

    setRouteResult({
      path,
      edgesUsed,
      cost: selectedRoute.cost,
      steps,
      etaMin: Math.max(1, Math.round(accumDist / speed)),
      distMeters: accumDist,
    });
  }, [fromNode, toNode, activePersona, optMode, wantCart, avoidStairs, preferLift, preferRamps, twinState, emergencyMode]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  // Audio Speech Synthesis for Turn-by-Turn step transitions
  const speakStep = useCallback(
    (stepText: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(stepText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Audio TTS error:", err);
      }
    },
    [voiceEnabled]
  );

  // AUTOMATIC TURN-BY-TURN STEPPER TIMER
  useEffect(() => {
    if (!isNavigating || !isAutoNav || !routeResult) return;

    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev < routeResult.steps.length - 1) {
          const nextIdx = prev + 1;
          const nextStep = routeResult.steps[nextIdx];
          if (nextStep) speakStep(nextStep.text);
          return nextIdx;
        } else {
          setIsAutoNav(false);
          return prev;
        }
      });
    }, autoNavSpeedMs);

    return () => clearInterval(timer);
  }, [isNavigating, isAutoNav, routeResult, autoNavSpeedMs, speakStep]);

  // Map pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      touchStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - touchStart.current.x, y: e.touches[0].clientY - touchStart.current.y });
  };
  const handleTouchEnd = () => setIsDragging(false);

  const startNav = () => {
    setIsNavigating(true);
    setIsAutoNav(true);
    setCurrentStepIdx(0);
    if (routeResult?.steps[0]) {
      speakStep(`Starting navigation. ${routeResult.steps[0].text}`);
    }
  };

  const stopNav = () => {
    setIsNavigating(false);
    setIsAutoNav(false);
    setCurrentStepIdx(0);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const planNextJourney = () => {
    setFromNode(toNode);
    setIsNavigating(false);
    setIsAutoNav(false);
    setCurrentStepIdx(0);
    window.setTimeout(() => {
      document.getElementById("station-map-destination")?.focus();
    }, 0);
  };

  const navConfirmNext = () => {
    if (routeResult && currentStepIdx < routeResult.steps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      speakStep(routeResult.steps[nextIdx].text);
    }
  };

  const navBack = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      speakStep(routeResult?.steps[prevIdx].text || "");
    }
  };

  // AI Drawer Submit
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const query = aiInput.trim();
    const normalizedQuery = query.toLocaleLowerCase();
    setAiMessages((prev) => [...prev, { sender: "user", text: query }]);
    setAiInput("");

    await new Promise((resolve) => setTimeout(resolve, 500));

    let reply = "";
    let facilityStatuses: FacilityStatuses = {};
    try {
      facilityStatuses = await fetchFacilityStatuses();
    } catch {
      // Navigation answers remain available if live facility status cannot be fetched.
    }

    const requestedFacility = findFacilityInQuery(normalizedQuery);
    if (requestedFacility && facilityStatuses[requestedFacility]) {
      reply = facilityReply(requestedFacility, facilityStatuses);
    } else if (normalizedQuery.includes("wheelchair") || normalizedQuery.includes("accessible")) {
        setActivePersona("wheelchair");
        reply = facilityStatuses.lift === "not_working"
          ? "Wheelchair Accessible routing is enabled. The lift is currently not working, so I will use the step-free ramp route."
          : "Updated route preference to Wheelchair Accessible. Lift and FOB ramp routes are enabled.";
      } else if (normalizedQuery.includes("crowd")) {
        setOptMode("balanced");
        reply = "Balanced routing is enabled with a practical alternate path through the station.";
      } else if (normalizedQuery.includes("golf cart") || normalizedQuery.includes("cart")) {
        setWantCart(true);
        reply = "Golf Cart Shuttle lane prioritized. Free pickup available at Concourse Bay.";
      } else if (normalizedQuery.includes("platform")) {
        setToNode("PF6");
        reply = facilityStatuses.lift === "not_working"
          ? "Set destination to Platform 6. The lift is currently not working, so the route will use the accessible ramp."
          : "Set destination to Platform 6 (8 min walk via Lift 1 and FOB B).";
      } else {
        reply = "I don't have information about that. I've saved your question for the station team.";
        try {
          await logUnansweredQuestion(query);
        } catch {
          reply = "I don't have information about that. The station team could not be notified right now.";
        }
      }
    setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
  };

  // Active step coordinates for marker highlight
  const activeStepNode = routeResult?.steps[currentStepIdx]?.node || fromNode;
  const activeNodeCoords = ALLNODES[activeStepNode] || ALLNODES["ENTRY_A"];
  const hasArrived =
    Boolean(isNavigating && routeResult) &&
    currentStepIdx === routeResult!.steps.length - 1 &&
    Boolean(routeResult!.steps[currentStepIdx]?.arrive);
  const activePathIndex = routeResult
    ? Math.max(0, routeResult.path.indexOf(activeStepNode))
    : 0;
  const coveredRouteNodes =
    isNavigating && routeResult
      ? routeResult.path.slice(0, activePathIndex + 1)
      : [];

  const fromFacName = FACILITIES.find((f) => f.id === fromNode)?.name || fromNode;
  const toFacName = FACILITIES.find((f) => f.id === toNode)?.name || toNode;
  const handleFindBestRoute = () => {
    calculateRoute();
    void logNavigationRequest({
      origin: fromFacName,
      destination: toFacName,
      preference: optMode,
      source: "station-map",
    }).catch((error) => {
      console.error("Unable to record map navigation request:", error);
    });
  };

  return (
    <section className={`w-full flex-1 flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-[#010105] p-2 overflow-hidden" : ""}`} id="station-map">
      <div className="rounded-2xl bg-[#E6E3DB] border border-[#134489]/15 shadow-xl overflow-hidden flex flex-col font-sans flex-1">

        {/* ── 1. DIGITAL TWIN CONTEXT BAR ────────────────────────────────────── */}
        <div className="bg-[#134489] text-[#E6E3DB] px-4 py-2.5 flex items-center justify-between gap-3 border-b border-[#FAC24A]/40 shrink-0">

          {/* Left Context Info */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black tracking-wider uppercase text-[#FAC24A]">Live</span>
            </div>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            <div className="flex min-w-0 items-center gap-3">
              <h2 className="shrink-0 whitespace-nowrap text-xs font-black leading-tight text-white sm:text-sm">
                SAARTHI Digital Twin
              </h2>
              <span className="hidden truncate border-l border-white/20 pl-3 text-[11px] font-semibold text-[#EDEBB9] md:inline-block">
                Lucknow Junction &bull; LJN &bull; North Eastern Railway
              </span>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">

            {/* 3D Interactive Simulation Launch Button */}
            <button
              onClick={() => setShow3DModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 bg-[#FAC24A] hover:bg-amber-300 text-[#010105] border border-[#010105]/20 shadow-md transition-all animate-bounce hover:animate-none"
              title="Launch Interactive 3D Station Simulation"
            >
              <Box className="w-3.5 h-3.5 fill-[#010105]/10" />
              <span>Open 3D Map</span>
            </button>

            {/* Layers Button */}
            <div className="relative">
              <button
                onClick={() => setLayersPopoverOpen(!layersPopoverOpen)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all border ${layersPopoverOpen
                    ? "bg-[#FAC24A] text-[#010105] border-[#010105]"
                    : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  }`}
                title="Toggle Spatial Layers"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Layers</span>
              </button>

              {/* Floating Spatial Layers Popover */}
              {layersPopoverOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#134489]/20 rounded-xl shadow-2xl p-3 text-xs font-bold text-[#010105] z-50 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-black uppercase text-[#134489]">Spatial Layers</span>
                    <button onClick={() => setLayersPopoverOpen(false)} className="text-gray-400 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                    <input type="checkbox" checked={layers.walk} onChange={(e) => setLayers({ ...layers, walk: e.target.checked })} className="accent-[#134489]" />
                    <span>Pedestrian Routes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                    <input type="checkbox" checked={layers.wheel} onChange={(e) => setLayers({ ...layers, wheel: e.target.checked })} className="accent-[#134489]" />
                    <span>Accessible Lifts & Ramps</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                    <input type="checkbox" checked={layers.cart} onChange={(e) => setLayers({ ...layers, cart: e.target.checked })} className="accent-[#134489]" />
                    <span>Golf Cart Shuttle Lane</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                    <input type="checkbox" checked={layers.crowd} onChange={(e) => setLayers({ ...layers, crowd: e.target.checked })} className="accent-[#134489]" />
                    <span>Live Crowd Heatmap</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded-lg">
                    <input type="checkbox" checked={layers.techNodes} onChange={(e) => setLayers({ ...layers, techNodes: e.target.checked })} className="accent-[#134489]" />
                    <span>Graph Nodes (Debug)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Emergency Alert Banner */}
        {emergencyMode && (
          <div className="bg-red-600 text-white px-4 py-2 text-xs font-black flex items-center justify-between animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#FAC24A]" />
              <span>EMERGENCY EVACUATION ACTIVE &bull; Routing to Assembly Points (ASM1 / ASM2)</span>
            </div>
            <button onClick={() => setEmergencyMode(false)} className="text-white hover:text-black font-bold text-xs bg-black/30 px-2.5 py-0.5 rounded-lg">
              Deactivate
            </button>
          </div>
        )}

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden bg-white border-b border-[#134489]/15 p-1 gap-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveMobileTab("map")}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeMobileTab === "map" ? "bg-[#134489] text-white shadow-xs" : "bg-[#EDEBB9]/40 text-[#010105]"
              }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#FAC24A]" />
            <span>Map Workspace</span>
          </button>
          <button
            onClick={() => setActiveMobileTab("planner")}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeMobileTab === "planner" ? "bg-[#134489] text-white shadow-xs" : "bg-[#EDEBB9]/40 text-[#010105]"
              }`}
          >
            <Navigation className="w-3.5 h-3.5 text-[#FAC24A]" />
            <span>Route Planner</span>
          </button>
        </div>

        {/* ── 2. MAIN WORKSPACE AREA ─────────────────────────────────────────── */}
        <div className="relative flex flex-col lg:flex-row flex-1 min-h-[560px] overflow-hidden">

          {/* ── LEFT PANEL: ROUTE PLANNER (~320px) ───────────────────────────── */}
          <div
            className={`w-full lg:w-[320px] bg-white border-r border-[#134489]/15 p-4 space-y-4 shrink-0 overflow-y-auto ${activeMobileTab === "planner" || "hidden lg:flex flex-col"
              }`}
          >
            {/* Title */}
            <div>
              <h3 className="text-sm font-black text-[#134489] tracking-tight">Route Planner</h3>
              <p className="text-[11px] text-[#010105]/60 font-medium">Plan an indoor route through Lucknow Junction.</p>
            </div>

            {/* FROM & TO Controls */}
            <div className="space-y-2 bg-[#EDEBB9]/30 p-3 rounded-xl border border-[#134489]/15 relative">
              <div>
                <label className="text-[10px] font-black uppercase text-[#134489] block mb-1">FROM</label>
                <select
                  value={fromNode}
                  onChange={(e) => setFromNode(e.target.value)}
                  className="w-full bg-white border border-[#134489]/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#010105] focus:outline-none focus:ring-2 focus:ring-[#134489]"
                >
                  {FACILITIES.map((f) => (
                    <option key={f.id} value={f.id}>
                      {CATS[f.cat]?.icon} {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-1 relative z-10">
                <button
                  onClick={handleSwapNodes}
                  className="p-1.5 rounded-full bg-white border border-[#134489]/20 text-[#134489] hover:bg-[#FAC24A] hover:text-[#010105] shadow-xs transition-all"
                  title="Swap Origin & Destination"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#134489] block mb-1">TO</label>
                <select
                  id="station-map-destination"
                  value={toNode}
                  disabled={emergencyMode}
                  onChange={(e) => {
                    setToNode(e.target.value);
                    const f = FACILITIES.find((fac) => fac.id === e.target.value);
                    if (f) setSelectedDestination(f.name);
                  }}
                  className="w-full bg-white border border-[#134489]/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#010105] focus:outline-none focus:ring-2 focus:ring-[#134489] disabled:opacity-50"
                >
                  {emergencyMode ? (
                    <option value="ASM1">🚨 Assembly Point (ASM1 / ASM2)</option>
                  ) : (
                    FACILITIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {CATS[f.cat]?.icon} {f.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {/* Travel Preferences (Mobility Personas Dropdown) */}
              <div>
                <label className="text-[10px] font-black uppercase text-[#134489] tracking-wider block mb-1">
                  Travel Preference
                </label>
                <select
                  value={activePersona}
                  onChange={(e) => setActivePersona(e.target.value)}
                  className="w-full bg-[#EDEBB9]/40 border border-[#134489]/20 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#010105] focus:outline-none focus:ring-2 focus:ring-[#134489]"
                >
                  {Object.entries(PERSONAS).map(([key, p]) => (
                    <option key={key} value={key}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Advanced Accessibility Options */}
              <div className="pt-1">
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-xs font-bold text-[#134489] flex items-center gap-1 hover:underline"
                >
                  <SlidersHorizontal className="w-3 h-3 text-[#134489]" />
                  <span>Accessibility Options</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${showAdvancedOptions ? "rotate-90" : ""}`} />
                </button>

                {showAdvancedOptions && (
                  <div className="mt-2 p-3 bg-[#EDEBB9]/40 rounded-xl border border-[#134489]/15 space-y-2 text-xs font-semibold">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Avoid stairs</span>
                      <input type="checkbox" checked={avoidStairs} onChange={(e) => setAvoidStairs(e.target.checked)} className="accent-[#134489]" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Prefer lifts</span>
                      <input type="checkbox" checked={preferLift} onChange={(e) => setPreferLift(e.target.checked)} className="accent-[#134489]" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Prefer ramps</span>
                      <input type="checkbox" checked={preferRamps} onChange={(e) => setPreferRamps(e.target.checked)} className="accent-[#134489]" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Prefer Golf Cart shuttle</span>
                      <input type="checkbox" checked={wantCart} onChange={(e) => setWantCart(e.target.checked)} className="accent-[#134489]" />
                    </label>
                  </div>
                )}
              </div>

              {/* Optimization Mode */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-extrabold text-[#010105]/70">Mode:</span>
                <div className="flex items-center gap-1">
                  {(["balanced", "fastest"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOptMode(mode)}
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${optMode === mode ? "bg-[#134489] text-[#E6E3DB]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleFindBestRoute}
              className="w-full py-2.5 rounded-xl bg-[#134489] hover:bg-[#0d2f61] text-[#E6E3DB] font-extrabold text-xs flex items-center justify-center gap-2 border border-[#134489] shadow-xs transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-[#FAC24A]" />
              <span>Find Best Route</span>
            </button>

            {/* Route Summary Card */}
            {routeResult && (
              <div className="bg-[#EDEBB9]/30 p-3 rounded-xl border border-[#134489]/15 space-y-3">
                <div className="flex items-center justify-between border-b border-[#134489]/15 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-[#134489] tracking-wider">Calculated Path</span>
                  <span className="text-[10px] font-extrabold text-[#134489] bg-white px-2 py-0.5 rounded-full border border-[#134489]/15">
                    {routeResult.etaMin} min &bull; {routeResult.distMeters} m
                  </span>
                </div>

                {/* Route Nodes Sequence */}
                <div className="text-xs font-extrabold text-[#010105] space-y-1">
                  <div className="flex items-center gap-1 text-[#134489]">
                    <span className="w-2 h-2 rounded-full bg-[#134489]" />
                    <span className="truncate">{fromFacName}</span>
                  </div>
                  <div className="pl-3 text-[10px] text-gray-400 font-mono">↓ Via Concourse & FOB Deck</div>
                  <div className="flex items-center gap-1 text-[#010105]">
                    <span className="w-2 h-2 rounded-full bg-[#FAC24A] border border-[#010105]" />
                    <span className="truncate">{toFacName}</span>
                  </div>
                </div>

                {/* Navigation Button */}
                {!isNavigating ? (
                  <button
                    onClick={startNav}
                    className="w-full py-2.5 rounded-xl bg-[#FAC24A] hover:bg-amber-300 text-[#010105] font-black text-xs flex items-center justify-center gap-2 border border-[#010105]/20 shadow-xs transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#010105]" />
                    <span>Start Turn-by-Turn Nav</span>
                  </button>
                ) : (
                  <div className="space-y-2 bg-white p-2.5 rounded-lg border border-[#134489]/20">
                    {hasArrived ? (
                      <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
                        <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-xl text-white">✓</span>
                        <p className="mt-3 text-sm font-black text-emerald-900">You have arrived</p>
                        <p className="mt-1 text-xs font-bold text-emerald-700">{toFacName}</p>
                        <button onClick={planNextJourney} className="mt-3 w-full rounded-xl bg-[#134489] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#0d2f61]">
                          Plan next journey
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs font-black text-[#134489]">
                          <span>Step {currentStepIdx + 1} of {routeResult.steps.length}</span>
                          <button onClick={stopNav} className="text-xs text-red-600 font-bold underline">
                            Exit
                          </button>
                        </div>
                        <p className="text-xs font-extrabold text-[#010105] leading-snug">
                          {routeResult.steps[currentStepIdx]?.text}
                        </p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <button onClick={navBack} disabled={currentStepIdx === 0} className="px-2 py-1 rounded bg-gray-100 text-xs disabled:opacity-30">
                            Prev
                          </button>
                          <button onClick={() => setIsAutoNav(!isAutoNav)} className="flex-1 py-1 rounded bg-[#134489] text-white text-xs font-bold">
                            {isAutoNav ? "Pause" : "Resume"}
                          </button>
                          <button onClick={navConfirmNext} disabled={currentStepIdx === routeResult.steps.length - 1} className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-bold disabled:opacity-30">
                            Next
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 3. MAP VIEWPORT CANVAS (70–80% DESKTOP WORKSPACE) ────────────── */}
          <div
            className={`flex-1 relative bg-[#e6e3db] min-h-[480px] overflow-hidden select-none ${activeMobileTab === "map" || "hidden lg:block"
              }`}
          >
            {/* Map Canvas SVG */}
            <div
              className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <svg
                viewBox="0 0 1400 820"
                className="w-full h-full transition-transform duration-75"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px)`,
                }}
              >
                <defs>
                  <pattern id="railTrackPattern" width="16" height="8" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="2" x2="16" y2="2" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="0" y1="6" x2="16" y2="6" stroke="#64748b" strokeWidth="1.5" />
                    <line x1="4" y1="0" x2="4" y2="8" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="12" y1="0" x2="12" y2="8" stroke="#cbd5e1" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Perimeter Bounds */}
                <rect x="20" y="20" width="1360" height="780" rx="16" fill="#dedacb" stroke="#134489" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />

                {/* Zone 1: Entry Plaza */}
                <rect x="40" y="40" width="1320" height="140" rx="12" fill="#cbd5e1" fillOpacity="0.3" stroke="#64748b" strokeWidth="1" />
                <text x="60" y="60" fill="#475569" fontSize="10" fontWeight="800" letterSpacing="1">
                  ZONE 1 &bull; EXTERNAL PLAZA & MULTIMODAL TRANSPORT
                </text>

                {/* Zone 2: Concourse */}
                <rect x="40" y="200" width="1320" height="120" rx="12" fill="#134489" fillOpacity="0.06" stroke="#134489" strokeWidth="1.5" />
                <text x="60" y="220" fill="#134489" fontSize="10" fontWeight="800" letterSpacing="1">
                  ZONE 2 &bull; MAIN STATION CONCOURSE & TICKETING
                </text>

                {/* Zone 3: Lounges & Food Court */}
                <rect x="40" y="340" width="1320" height="170" rx="12" fill="#2563eb" fillOpacity="0.04" stroke="#2563eb" strokeWidth="1" />
                <text x="60" y="360" fill="#1e40af" fontSize="10" fontWeight="800" letterSpacing="1">
                  ZONE 3 &bull; WAITING HALLS, FOOD COURT & AMENITIES
                </text>

                {/* Zone 4: FOB Link */}
                <rect x="40" y="530" width="1320" height="110" rx="12" fill="#9333ea" fillOpacity="0.05" stroke="#9333ea" strokeWidth="1" />
                <text x="60" y="550" fill="#7e22ce" fontSize="10" fontWeight="800" letterSpacing="1">
                  ZONE 4 &bull; VERTICAL ACCESS TOWERS & ELEVATED FOB WALKWAY
                </text>

                {/* FOB Deck Structure */}
                <rect x="110" y="610" width="1180" height="28" rx="6" fill="#FAC24A" fillOpacity="0.4" stroke="#010105" strokeWidth="1.5" />
                <text x="700" y="628" textAnchor="middle" fill="#010105" fontSize="10" fontWeight="900" letterSpacing="2">
                  ELEVATED FOOT OVER BRIDGE (FOB WALKWAY DECK)
                </text>

                {/* Rail Tracks */}
                {[...Array(8)].map((_, i) => (
                  <rect key={i} x={100 + i * 150} y={665} width="120" height="35" fill="url(#railTrackPattern)" opacity="0.7" />
                ))}

                {/* Platforms 1-8 */}
                {[
                  { id: "PF1", label: "Platform 1", x: 100 },
                  { id: "PF2", label: "Platform 2", x: 250 },
                  { id: "PF3", label: "Platform 3", x: 400 },
                  { id: "PF4", label: "Platform 4", x: 550 },
                  { id: "PF5", label: "Platform 5", x: 700 },
                  { id: "PF6", label: "Platform 6", x: 850 },
                  { id: "PF7", label: "Platform 7", x: 1000 },
                  { id: "PF8", label: "Platform 8", x: 1150 },
                ].map((pf) => (
                  <g key={pf.id}>
                    <rect x={pf.x} y={700} width="120" height="48" rx="8" fill="#134489" fillOpacity="0.12" stroke="#134489" strokeWidth="1.5" />
                    <text x={pf.x + 58} y={728} textAnchor="start" fill="#010105" fontSize="10.5" fontWeight="800">
                      {pf.label}
                    </text>
                  </g>
                ))}

                {/* Golf Cart Lane Visualization */}
                {layers.cart && (
                  <path
                    d="M 610 490 L 610 655 M 130 655 L 1180 655"
                    fill="none"
                    stroke="#db2777"
                    strokeWidth="3"
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                  />
                )}

                {/* Pedestrian Walkways Edges */}
                {layers.walk &&
                  RAW_EDGES.map(([aKey, bKey], idx) => {
                    const A = ALLNODES[aKey], B = ALLNODES[bKey];
                    if (!A || !B) return null;
                    return (
                      <line
                        key={idx}
                        x1={A.x}
                        y1={A.y}
                        x2={B.x}
                        y2={B.y}
                        stroke="#94a3b8"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.3"
                      />
                    );
                  })}

                {/* Remaining calculated route */}
                {routeResult && routeResult.path.length > 1 && (
                  <path
                    d={routeResult.path.reduce((acc, curr, idx) => {
                      const coords = ALLNODES[curr];
                      if (!coords) return acc;
                      return idx === 0 ? `M ${coords.x} ${coords.y}` : `${acc} L ${coords.x} ${coords.y}`;
                    }, "")}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="10 7"
                    opacity="0.72"
                  />
                )}

                {/* Route already covered by the passenger */}
                {coveredRouteNodes.length > 1 && (
                  <>
                    <path
                      d={coveredRouteNodes.reduce((acc, curr, idx) => {
                        const coords = ALLNODES[curr];
                        if (!coords) return acc;
                        return idx === 0 ? `M ${coords.x} ${coords.y}` : `${acc} L ${coords.x} ${coords.y}`;
                      }, "")}
                      fill="none"
                      stroke="#DCFCE7"
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={coveredRouteNodes.reduce((acc, curr, idx) => {
                        const coords = ALLNODES[curr];
                        if (!coords) return acc;
                        return idx === 0 ? `M ${coords.x} ${coords.y}` : `${acc} L ${coords.x} ${coords.y}`;
                      }, "")}
                      fill="none"
                      stroke="#16A34A"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {/* Facilities Markers */}
                {layers.facilities &&
                  FACILITIES.map((f) => {
                    const isFrom = f.id === fromNode;
                    const isTo = f.id === toNode;
                    const isSelected = isFrom || isTo;
                    const labelLines = getFacilityLabel(f);
                    const labelY = getFacilityLabelY(f);

                    const twinData = twinState[f.id] || { crowd: 0.2 };
                    const crowdVal = twinData.crowd;

                    const heatmapColor =
                      crowdVal > 0.7 ? "#ef4444" : crowdVal > 0.4 ? "#f59e0b" : "#10b981";

                    return (
                      <g
                        key={f.id}
                        transform={`translate(${f.x}, ${f.y})`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedFacilityModal(f)}
                      >
                        {/* Crowd Heatmap Overlay */}
                        {layers.crowd && (
                          <circle
                            r={12 + crowdVal * 14}
                            fill={heatmapColor}
                            fillOpacity="0.2"
                          />
                        )}

                        {/* Node Marker Pin */}
                        <circle
                          r={isSelected ? "11" : "6.5"}
                          fill={isFrom ? "#134489" : isTo ? "#FAC24A" : CATS[f.cat]?.color || "#134489"}
                          stroke="#010105"
                          strokeWidth={isSelected ? "2.5" : "1"}
                        />

                        {/* Platform cards already carry their own labels. Other
                            names are wrapped and haloed to stay legible. */}
                        {f.cat !== "platform" && (
                          <text
                            x="0"
                            y={labelY}
                            textAnchor="middle"
                            fill="#172033"
                            stroke="#F6F4EC"
                            strokeWidth="3"
                            paintOrder="stroke"
                            strokeLinejoin="round"
                            fontSize={f.cat === "cart" ? "7.5" : "8"}
                            fontWeight={isSelected ? "900" : "700"}
                            className="pointer-events-none group-hover:fill-[#134489] transition-colors"
                          >
                            {labelLines.map((line, index) => (
                              <tspan key={line} x="0" dy={index === 0 ? 0 : 9}>
                                {line}
                              </tspan>
                            ))}
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* Active Step Location Ring */}
                {isNavigating && activeNodeCoords && (
                  <g transform={`translate(${activeNodeCoords.x}, ${activeNodeCoords.y})`}>
                    <circle r="23" fill="#22C55E" fillOpacity="0.22" className={hasArrived ? "" : "animate-ping"} />
                    <circle r="13" fill="#16A34A" stroke="#ffffff" strokeWidth="4" />
                    <circle r="4" fill="#ffffff" />
                    <text x="0" y="-21" textAnchor="middle" fill="#166534" stroke="#F6F4EC" strokeWidth="4" paintOrder="stroke" fontSize="9" fontWeight="900">
                      {hasArrived ? "DESTINATION REACHED" : "YOU ARE HERE"}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* ── 4. SAARTHI AI ASSISTANT SIDE DRAWER ─────────────────────────── */}
          {aiDrawerOpen && (
            <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white border-l border-[#134489]/15 shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200">
              <div className="p-3.5 bg-[#134489] text-[#E6E3DB] flex items-center justify-between border-b border-[#FAC24A]/40">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#FAC24A]" />
                  <h3 className="text-xs font-black text-white">SAARTHI AI Assistant</h3>
                </div>
                <button onClick={() => setAiDrawerOpen(false)} className="text-white hover:text-[#FAC24A]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat History */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto bg-[#EDEBB9]/20 text-xs">
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl max-w-[85%] font-medium leading-relaxed ${msg.sender === "user"
                        ? "bg-[#134489] text-white ml-auto rounded-tr-none"
                        : "bg-white text-[#010105] border border-[#134489]/15 rounded-tl-none shadow-2xs"
                      }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAiSubmit} className="p-2.5 border-t border-[#134489]/15 bg-white flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask SAARTHI AI for routes..."
                  className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#134489]"
                />
                <button type="submit" className="p-2 rounded-lg bg-[#134489] text-[#E6E3DB] hover:bg-[#0d2f61]">
                  <Send className="w-3.5 h-3.5 text-[#FAC24A]" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. FACILITY INSPECTOR MODAL ────────────────────────────────────── */}
      {selectedFacilityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#134489]/30 max-w-sm w-full p-4 space-y-3 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-gray-100 pb-2">
              <div>
                <span className="text-[10px] font-black uppercase text-[#134489] bg-[#EDEBB9] px-2 py-0.5 rounded">
                  {CATS[selectedFacilityModal.cat]?.label}
                </span>
                <h3 className="text-sm font-black text-[#010105] mt-1">
                  {selectedFacilityModal.name}
                </h3>
              </div>
              <button onClick={() => setSelectedFacilityModal(null)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#010105]/70 font-medium">
              {selectedFacilityModal.desc || "Official Lucknow Junction Station Spatial Node."}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
              <div className="bg-[#EDEBB9]/40 p-2 rounded-lg border border-[#134489]/15">
                <span className="text-[9px] text-[#010105]/60 block uppercase font-extrabold">Accessibility</span>
                <span className="text-emerald-700">Step-Free Entry</span>
              </div>
              <div className="bg-[#EDEBB9]/40 p-2 rounded-lg border border-[#134489]/15">
                <span className="text-[9px] text-[#010105]/60 block uppercase font-extrabold">Live Density</span>
                <span className="text-[#134489]">
                  {Math.round((twinState[selectedFacilityModal.id]?.crowd || 0.25) * 100)}% Occupancy
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setFromNode(selectedFacilityModal.id);
                  setSelectedFacilityModal(null);
                }}
                className="flex-1 py-2 rounded-lg bg-[#EDEBB9] border border-[#134489]/20 text-[#010105] font-extrabold text-xs"
              >
                Set as Origin
              </button>
              <button
                onClick={() => {
                  setToNode(selectedFacilityModal.id);
                  setSelectedDestination(selectedFacilityModal.name);
                  setSelectedFacilityModal(null);
                }}
                className="flex-1 py-2 rounded-lg bg-[#134489] text-white font-extrabold text-xs"
              >
                Set Destination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. DIJKSTRA TELEMETRY & SYSTEM INFO MODAL ───────────────────────── */}
      {systemInfoOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#134489]/30 max-w-md w-full p-4 space-y-3 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#134489]" />
                <h3 className="text-xs font-black text-[#134489] uppercase tracking-wider">Dijkstra Spatial Telemetry</h3>
              </div>
              <button onClick={() => setSystemInfoOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase">Algorithm</span>
                <span className="text-[#134489]">Dijkstra 2.0 Priority Queue</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase">Graph Nodes</span>
                <span className="text-[#134489]">{FACILITIES.length + Object.keys(JUNCTIONS).length} Active Nodes</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase">Graph Edges</span>
                <span className="text-[#134489]">{EDGES.length} Connected Edges</span>
              </div>
              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase">Route Cost</span>
                <span className="text-[#134489]">{routeResult?.cost || 0} Weight Units</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 italic">
              Multi-modal graph weights automatically factor live CSRNet crowd telemetry, wheelchair ramp slopes, and golf cart shuttle lanes.
            </p>
          </div>
        </div>
      )}

      {/* Interactive 3D Station Simulation Modal */}
      <Interactive3DMapModal
        isOpen={show3DModal}
        onClose={() => setShow3DModal(false)}
        initialDestination={toNode}
      />
    </section>
  );
}
