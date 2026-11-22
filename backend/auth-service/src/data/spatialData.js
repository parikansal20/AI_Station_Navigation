const CATS = {
  entry: { label: 'Entry / Exit', color: '#8fa0b8', icon: '⭆' },
  transport: { label: 'External Transport', color: '#8fa0b8', icon: '🚕' },
  service: { label: 'Passenger Service', color: '#fac24a', icon: '🛎' },
  safety: { label: 'Safety & Medical', color: '#ff5a5f', icon: '⛑' },
  waiting: { label: 'Lounge / Waiting', color: '#4f8fd9', icon: '🛋' },
  food: { label: 'Food & Retail', color: '#3ed598', icon: '🍽' },
  amenity: { label: 'Amenity', color: '#c9cf3b', icon: '🚻' },
  vertical: { label: 'Vertical Access', color: '#b98cff', icon: '⇅' },
  platform: { label: 'Platform', color: '#fac24a', icon: '🚆' },
  cart: { label: 'Golf Cart Stop', color: '#b98cff', icon: '🛺' },
  assembly: { label: 'Assembly Point', color: '#3ed598', icon: '⚑' },
};

const FACILITIES = [
  // --- Front plaza / external transport ---
  { id: 'ENTRY_A', name: 'Entry Gate A', cat: 'entry', x: 150, y: 100, accessible: true },
  { id: 'ENTRY_B', name: 'Entry Gate B', cat: 'entry', x: 620, y: 100, accessible: true },
  { id: 'EXIT_C', name: 'Exit Gate C', cat: 'entry', x: 1180, y: 100, accessible: true },
  { id: 'PARKING', name: 'Multi-level Parking', cat: 'transport', x: 100, y: 150, accessible: true },
  { id: 'TAXI', name: 'Taxi Stand', cat: 'transport', x: 300, y: 150, accessible: true },
  { id: 'BUS', name: 'Bus Stop', cat: 'transport', x: 460, y: 150, accessible: true },
  { id: 'METRO', name: 'Metro Station Link', cat: 'transport', x: 760, y: 150, accessible: true },
  { id: 'EVCHG', name: 'EV Charging Bay', cat: 'transport', x: 940, y: 150, accessible: true },
  { id: 'CYCLE', name: 'Bicycle Parking', cat: 'transport', x: 1120, y: 150, accessible: true },

  // --- Concourse services ---
  { id: 'TICKET', name: 'Ticket Counter', cat: 'service', x: 200, y: 250, accessible: true },
  { id: 'RESV', name: 'Reservation Office', cat: 'service', x: 330, y: 250, accessible: true },
  { id: 'INQ', name: 'Inquiry Counter', cat: 'service', x: 460, y: 250, accessible: true },
  { id: 'HELP', name: 'Help Desk', cat: 'service', x: 590, y: 250, accessible: true },
  { id: 'WHEELCTR', name: 'Wheelchair Booking Counter', cat: 'service', x: 720, y: 250, accessible: true },
  { id: 'PARCEL', name: 'Parcel Office', cat: 'service', x: 850, y: 250, accessible: true },
  { id: 'CLOAK', name: 'Cloak Room', cat: 'service', x: 980, y: 250, accessible: true },
  { id: 'CURREX', name: 'Currency Exchange', cat: 'service', x: 1110, y: 250, accessible: true },

  // --- Safety & medical ---
  { id: 'POLICE', name: 'Railway Police Post', cat: 'safety', x: 200, y: 390, accessible: true },
  { id: 'MEDICAL', name: 'Medical Room', cat: 'safety', x: 330, y: 390, accessible: true },
  { id: 'PHARM', name: 'Pharmacy', cat: 'safety', x: 460, y: 390, accessible: true },

  // --- Waiting / lounges ---
  { id: 'WAIT1', name: 'General Waiting Hall', cat: 'waiting', x: 610, y: 390, accessible: true },
  { id: 'ACWAIT', name: 'AC Waiting Lounge', cat: 'waiting', x: 750, y: 390, accessible: true },
  { id: 'EXECLNG', name: 'Executive Lounge', cat: 'waiting', x: 880, y: 390, accessible: true },
  { id: 'PRIVLNG', name: 'Private Lounge (VIP)', cat: 'waiting', x: 1010, y: 390, accessible: true },
  { id: 'DORM', name: 'Retiring Room / Dormitory', cat: 'waiting', x: 1140, y: 390, accessible: true },

  // --- Food & retail ---
  { id: 'FOODCT', name: 'Food Court', cat: 'food', x: 330, y: 430, accessible: true },
  { id: 'RESTO', name: 'Multi-Cuisine Restaurant', cat: 'food', x: 470, y: 430, accessible: true },
  { id: 'TEA', name: 'Tea Stall', cat: 'food', x: 590, y: 430, accessible: true },
  { id: 'BOOKS', name: 'Book Store', cat: 'food', x: 700, y: 430, accessible: true },
  { id: 'GSTORE', name: 'General Store', cat: 'food', x: 810, y: 430, accessible: true },
  { id: 'ATM1', name: 'ATM', cat: 'food', x: 920, y: 430, accessible: true },

  // --- Amenities ---
  { id: 'WASHA', name: 'Washroom A', cat: 'amenity', x: 200, y: 430, accessible: true },
  { id: 'WASHB', name: 'Washroom B (Accessible)', cat: 'amenity', x: 1030, y: 430, accessible: true },
  { id: 'BABYRM', name: 'Baby Feeding Room', cat: 'amenity', x: 1140, y: 430, accessible: true },
  { id: 'CHGSTN', name: 'Mobile Charging Station', cat: 'amenity', x: 270, y: 485, accessible: true },
  { id: 'WATER1', name: 'Water Vending Point', cat: 'amenity', x: 520, y: 485, accessible: true },

  // --- Vertical access to platforms ---
  { id: 'LIFT1', name: 'Lift 1 (FOB West)', cat: 'vertical', x: 400, y: 560, accessible: true },
  { id: 'ESC1', name: 'Escalator 1', cat: 'vertical', x: 600, y: 560, accessible: false },
  { id: 'STAIR1', name: 'Staircase 1', cat: 'vertical', x: 750, y: 560, accessible: false },
  { id: 'LIFT2', name: 'Lift 2 (FOB East)', cat: 'vertical', x: 950, y: 560, accessible: true },
  { id: 'RAMP1', name: 'Ramp 1', cat: 'vertical', x: 1080, y: 560, accessible: true },

  // --- Platforms ---
  { id: 'PF1', name: 'Platform 1', cat: 'platform', x: 130, y: 720, accessible: true },
  { id: 'PF2', name: 'Platform 2', cat: 'platform', x: 280, y: 720, accessible: true },
  { id: 'PF3', name: 'Platform 3', cat: 'platform', x: 430, y: 720, accessible: true },
  { id: 'PF4', name: 'Platform 4', cat: 'platform', x: 580, y: 720, accessible: true },
  { id: 'PF5', name: 'Platform 5', cat: 'platform', x: 730, y: 720, accessible: true },
  { id: 'PF6', name: 'Platform 6', cat: 'platform', x: 880, y: 720, accessible: true },
  { id: 'PF7', name: 'Platform 7', cat: 'platform', x: 1030, y: 720, accessible: true },
  { id: 'PF8', name: 'Platform 8', cat: 'platform', x: 1180, y: 720, accessible: true },

  // --- Golf cart stops ---
  { id: 'CART_CONC', name: 'Golf Cart Boarding — Concourse', cat: 'cart', x: 610, y: 490, accessible: true },
  { id: 'CART_PF1', name: 'Golf Cart Stop — Platform 1', cat: 'cart', x: 130, y: 655, accessible: true },
  { id: 'CART_PF2', name: 'Golf Cart Stop — Platform 2', cat: 'cart', x: 280, y: 655, accessible: true },
  { id: 'CART_PF3', name: 'Golf Cart Stop — Platform 3', cat: 'cart', x: 430, y: 655, accessible: true },
  { id: 'CART_PF4', name: 'Golf Cart Stop — Platform 4', cat: 'cart', x: 580, y: 655, accessible: true },
  { id: 'CART_PF5', name: 'Golf Cart Stop — Platform 5', cat: 'cart', x: 730, y: 655, accessible: true },
  { id: 'CART_PF6', name: 'Golf Cart Stop — Platform 6', cat: 'cart', x: 880, y: 655, accessible: true },
  { id: 'CART_PF7', name: 'Golf Cart Stop — Platform 7', cat: 'cart', x: 1030, y: 655, accessible: true },
  { id: 'CART_PF8', name: 'Golf Cart Stop — Platform 8', cat: 'cart', x: 1180, y: 655, accessible: true },

  // --- Assembly points (outside, emergency) ---
  { id: 'ASM1', name: 'Assembly Point North', cat: 'assembly', x: 300, y: 58, accessible: true },
  { id: 'ASM2', name: 'Assembly Point East', cat: 'assembly', x: 1100, y: 58, accessible: true },
];

const JUNCTIONS = {
  J_PLAZA_W: { x: 200, y: 150 }, J_PLAZA_M: { x: 620, y: 150 }, J_PLAZA_E: { x: 1030, y: 150 },
  J_CONC_W: { x: 200, y: 290 }, J_CONC_M: { x: 620, y: 290 }, J_CONC_E: { x: 1030, y: 290 },
  J_MID_W: { x: 270, y: 490 }, J_MID_M: { x: 610, y: 490 }, J_MID_E: { x: 1030, y: 490 },
  J_FOB_W: { x: 400, y: 620 }, J_FOB_M: { x: 750, y: 620 }, J_FOB_E: { x: 1080, y: 620 },
  FOB_PF1: { x: 130, y: 655 }, FOB_PF2: { x: 280, y: 655 }, FOB_PF3: { x: 430, y: 655 }, FOB_PF4: { x: 580, y: 655 },
  FOB_PF5: { x: 730, y: 655 }, FOB_PF6: { x: 880, y: 655 }, FOB_PF7: { x: 1030, y: 655 }, FOB_PF8: { x: 1180, y: 655 },
};

const RAW_EDGES = [
  ['ENTRY_A', 'J_PLAZA_W', 'walk'], ['PARKING', 'J_PLAZA_W', 'walk'], ['TAXI', 'J_PLAZA_W', 'walk'],
  ['J_PLAZA_W', 'J_PLAZA_M', 'walk'], ['ENTRY_B', 'J_PLAZA_M', 'walk'], ['BUS', 'J_PLAZA_M', 'walk'], ['METRO', 'J_PLAZA_M', 'walk'],
  ['J_PLAZA_M', 'J_PLAZA_E', 'walk'], ['EVCHG', 'J_PLAZA_E', 'walk'], ['CYCLE', 'J_PLAZA_E', 'walk'], ['EXIT_C', 'J_PLAZA_E', 'walk'],
  ['J_PLAZA_W', 'J_CONC_W', 'walk'], ['J_PLAZA_M', 'J_CONC_M', 'walk'], ['J_PLAZA_E', 'J_CONC_E', 'walk'],
  ['J_CONC_W', 'TICKET', 'walk'], ['TICKET', 'RESV', 'walk'], ['RESV', 'INQ', 'walk'], ['INQ', 'HELP', 'walk'],
  ['HELP', 'J_CONC_M', 'walk'], ['J_CONC_M', 'WHEELCTR', 'walk'], ['WHEELCTR', 'PARCEL', 'walk'], ['PARCEL', 'CLOAK', 'walk'],
  ['CLOAK', 'CURREX', 'walk'], ['CURREX', 'J_CONC_E', 'walk'],
  ['J_CONC_W', 'POLICE', 'walk'], ['POLICE', 'MEDICAL', 'walk'], ['MEDICAL', 'PHARM', 'walk'], ['PHARM', 'WAIT1', 'walk'],
  ['WAIT1', 'ACWAIT', 'walk'], ['ACWAIT', 'EXECLNG', 'walk'], ['EXECLNG', 'PRIVLNG', 'walk'], ['PRIVLNG', 'DORM', 'walk'],
  ['DORM', 'J_CONC_E', 'walk'],
  ['POLICE', 'WASHA', 'walk'], ['WASHA', 'J_MID_W', 'walk'], ['J_MID_W', 'FOODCT', 'walk'], ['FOODCT', 'RESTO', 'walk'],
  ['RESTO', 'J_MID_M', 'walk'], ['J_MID_M', 'TEA', 'walk'], ['TEA', 'BOOKS', 'walk'], ['BOOKS', 'GSTORE', 'walk'],
  ['GSTORE', 'J_MID_E', 'walk'], ['J_MID_E', 'ATM1', 'walk'], ['ATM1', 'WASHB', 'walk'], ['WASHB', 'BABYRM', 'walk'],
  ['BABYRM', 'DORM', 'walk'],
  ['J_MID_W', 'CHGSTN', 'walk'], ['J_MID_M', 'WATER1', 'walk'],
  ['ACWAIT', 'J_MID_M', 'walk'], ['WAIT1', 'J_MID_W', 'walk'], ['EXECLNG', 'J_MID_E', 'walk'],
  ['J_MID_M', 'CART_CONC', 'walk'],
  ['J_MID_W', 'J_FOB_W', 'walk'], ['CHGSTN', 'LIFT1', 'walk'], ['LIFT1', 'J_FOB_W', 'lift'],
  ['J_MID_M', 'J_FOB_M', 'walk'], ['WATER1', 'ESC1', 'walk'], ['ESC1', 'J_FOB_M', 'escalator'],
  ['J_FOB_M', 'STAIR1', 'walk'], ['STAIR1', 'J_FOB_M', 'stairs'],
  ['J_MID_E', 'J_FOB_E', 'walk'], ['J_FOB_E', 'LIFT2', 'lift'], ['J_FOB_E', 'RAMP1', 'ramp'],
  ['J_FOB_W', 'J_FOB_M', 'walk'], ['J_FOB_M', 'J_FOB_E', 'walk'],
  ['J_FOB_W', 'FOB_PF3', 'walk'], ['J_FOB_M', 'FOB_PF5', 'walk'], ['J_FOB_E', 'FOB_PF7', 'walk'],
  ['FOB_PF1', 'FOB_PF2', 'walk'], ['FOB_PF2', 'FOB_PF3', 'walk'], ['FOB_PF3', 'FOB_PF4', 'walk'],
  ['FOB_PF4', 'FOB_PF5', 'walk'], ['FOB_PF5', 'FOB_PF6', 'walk'], ['FOB_PF6', 'FOB_PF7', 'walk'],
  ['FOB_PF7', 'FOB_PF8', 'walk'],
  ['FOB_PF1', 'PF1', 'stairs'], ['FOB_PF1', 'PF1', 'lift'],
  ['FOB_PF2', 'PF2', 'stairs'], ['FOB_PF2', 'PF2', 'lift'],
  ['FOB_PF3', 'PF3', 'stairs'], ['FOB_PF3', 'PF3', 'lift'],
  ['FOB_PF4', 'PF4', 'stairs'], ['FOB_PF4', 'PF4', 'lift'],
  ['FOB_PF5', 'PF5', 'stairs'], ['FOB_PF5', 'PF5', 'lift'],
  ['FOB_PF6', 'PF6', 'stairs'], ['FOB_PF6', 'PF6', 'lift'],
  ['FOB_PF7', 'PF7', 'stairs'], ['FOB_PF7', 'PF7', 'lift'],
  ['FOB_PF8', 'PF8', 'stairs'], ['FOB_PF8', 'PF8', 'lift'],
  ['CART_CONC', 'CART_PF4', 'cart'],
  ['CART_PF1', 'CART_PF2', 'cart'], ['CART_PF2', 'CART_PF3', 'cart'], ['CART_PF3', 'CART_PF4', 'cart'],
  ['CART_PF4', 'CART_PF5', 'cart'], ['CART_PF5', 'CART_PF6', 'cart'], ['CART_PF6', 'CART_PF7', 'cart'],
  ['CART_PF7', 'CART_PF8', 'cart'],
  ['CART_PF1', 'PF1', 'walk'], ['CART_PF2', 'PF2', 'walk'], ['CART_PF3', 'PF3', 'walk'], ['CART_PF4', 'PF4', 'walk'],
  ['CART_PF5', 'PF5', 'walk'], ['CART_PF6', 'PF6', 'walk'], ['CART_PF7', 'PF7', 'walk'], ['CART_PF8', 'PF8', 'walk'],
  ['CART_CONC', 'J_MID_M', 'walk'],
  ['ENTRY_A', 'ASM1', 'walk'], ['EXIT_C', 'ASM2', 'walk'],
];

const PERSONAS = {
  standard: { label: 'Standard', icon: '🚶', excludeInaccessible: false, avoidStairs: false, preferLift: false, slow: false },
  wheelchair: { label: 'Wheelchair', icon: '♿', excludeInaccessible: true, avoidStairs: true, preferLift: true, slow: true },
  blind: { label: 'Low-vision', icon: '🦯', excludeInaccessible: false, avoidStairs: false, preferLift: true, slow: true },
  senior: { label: 'Senior Citizen', icon: '🧓', excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  pregnant: { label: 'Pregnant', icon: '🤰', excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  luggage: { label: 'Heavy Luggage', icon: '🧳', excludeInaccessible: false, avoidStairs: true, preferLift: true, slow: true },
  vip: { label: 'VIP / Staff', icon: '⭐', excludeInaccessible: false, avoidStairs: false, preferLift: true, slow: false },
};

module.exports = {
  CATS,
  FACILITIES,
  JUNCTIONS,
  RAW_EDGES,
  PERSONAS,
};
