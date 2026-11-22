export interface DestinationItem {
  id: string;
  name: string;
  category: "platform" | "facility" | "exit" | "service";
  iconName: string;
  locationDetails: string;
  floor: string;
  isAccessible: boolean;
  crowdLevel: "Low" | "Moderate" | "High";
}

export interface CrowdSummaryItem {
  location: string;
  peopleCount: number;
  densityLevel: "Low" | "Moderate" | "High";
  trend: "stable" | "increasing" | "decreasing";
}

export interface ServiceDetail {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  eta: string;
  badgeText: string;
}

export const STATION_INFO = {
  name: "Lucknow Junction",
  code: "LJN",
  hindiName: "लखनऊ जंक्शन",
  currentGate: "Main Entrance • Gate 1",
  zone: "North Eastern Railway (NER)",
  totalPlatforms: 6,
};

export const QUICK_DESTINATIONS: DestinationItem[] = [
  {
    id: "platform-5",
    name: "Platform 5",
    category: "platform",
    iconName: "TrainTrack",
    locationDetails: "Eastern Side via FOB B",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Low",
  },
  {
    id: "washroom-main",
    name: "Washroom",
    category: "facility",
    iconName: "Restroom",
    locationDetails: "Near Gate 1 Concourse",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Low",
  },
  {
    id: "exit-gate-2",
    name: "Exit Gate 2",
    category: "exit",
    iconName: "LogOut",
    locationDetails: "North Parking Plaza",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Low",
  },
  {
    id: "lift-fob-a",
    name: "Lift (FOB A)",
    category: "facility",
    iconName: "Elevator",
    locationDetails: "Adjacent to Ticket Counter",
    floor: "All Floors",
    isAccessible: true,
    crowdLevel: "Moderate",
  },
  {
    id: "food-court",
    name: "Food & Snacks",
    category: "facility",
    iconName: "Utensils",
    locationDetails: "Platform 1 Concourse",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Moderate",
  },
  {
    id: "water-kiosk",
    name: "RO Water Point",
    category: "facility",
    iconName: "Droplets",
    locationDetails: "Near Platform 2 Staircase",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Low",
  },
  {
    id: "waiting-room",
    name: "Waiting Room",
    category: "facility",
    iconName: "Armchair",
    locationDetails: "AC & Executive Lounge - P1",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "Low",
  },
  {
    id: "ticket-counter",
    name: "Ticket Counter",
    category: "service",
    iconName: "Ticket",
    locationDetails: "Unreserved Ticket Building",
    floor: "Ground Floor",
    isAccessible: true,
    crowdLevel: "High",
  },
];

export const AI_SUGGESTION_CHIPS = [
  { label: "Platform 5", query: "Take me to Platform 5" },
  { label: "Nearest Washroom", query: "Where is the nearest washroom?" },
  { label: "Nearest Lift", query: "Find a wheelchair accessible lift" },
  { label: "Least Crowded Route", query: "Platform 3 ka least crowded route batao" },
  { label: "Waiting Room", query: "Take me to AC Waiting Room" },
  { label: "Exit Gate", query: "Show route to Main Exit Gate 2" },
];

export const LIVE_CROWD_SUMMARY: CrowdSummaryItem[] = [
  { location: "Platform 1", peopleCount: 24, densityLevel: "Low", trend: "stable" },
  { location: "Platform 3", peopleCount: 67, densityLevel: "Moderate", trend: "increasing" },
  { location: "FOB A", peopleCount: 91, densityLevel: "High", trend: "increasing" },
];

export const CROWD_AI_INSIGHT = {
  text: "FOB A is currently crowded. Route via FOB B may save congestion and reduce walking time by 3 minutes.",
  lastUpdated: "10 seconds ago",
};

export const MY_TRAIN = {
  number: "12554",
  name: "Vaishali Express",
  platform: "Platform 4",
  departureTime: "14:25",
  status: "On Time",
  route: "New Delhi → Barauni Junction",
  coachInfo: "S4-S8 closest to Lift A",
};

export const PASSENGER_SERVICES: ServiceDetail[] = [
  {
    id: "coolie",
    title: "Coolie / Porter",
    subtitle: "Licensed luggage assistance at platform",
    status: "4 Porters Available near Gate 1",
    eta: "2-4 mins arrival",
    badgeText: "Standard Rate ₹150",
  },
  {
    id: "golf-cart",
    title: "Golf Cart",
    subtitle: "Free battery vehicle for seniors & disabled",
    status: "2 Carts Active on Concourse",
    eta: "Pickup at Main Gate 1",
    badgeText: "Priority Service",
  },
];

export const EMERGENCY_CONTACTS = [
  {
    id: "medical",
    title: "Medical Assistance",
    subtitle: "First Aid & Emergency Ambulance",
    contactNumber: "139 / Ext 108",
    badge: "24x7 Ready",
  },
  {
    id: "security",
    title: "Railway Security (RPF)",
    subtitle: "Police & Safety Helpline",
    contactNumber: "139",
    badge: "RPF Station Desk",
  },
  {
    id: "helpdesk",
    title: "Passenger Help Desk",
    subtitle: "Station Master & Enquiry",
    contactNumber: "+91 547 2220139",
    badge: "Gate 1 Office",
  },
];

export const STATION_NODES = [
  "Platform 1",
  "Platform 2",
  "Platform 3",
  "Platform 4",
  "Platform 5",
  "Platform 6",
  "Platform 7",
  "Platform 8",
  "Golf Cart Boarding — Concourse",
  "Golf Cart Stop — Platform 4",
  "Golf Cart Stop — Platform 8",
  "Entry Gate A",
  "Entry Gate B",
  "Exit Gate C",
  "Main Entrance • Gate 1",
  "General Waiting Hall",
  "AC Waiting Lounge",
  "Executive Lounge",
  "Retiring Room / Dormitory",
  "Ticket Counter & Inquiry Desk",
  "Cloak Room",
  "Food Court",
  "Washroom B (Accessible)",
  "Lift 1 (FOB West)",
  "Lift 2 (FOB East)",
  "Ramp 1 (Accessible)",
];
