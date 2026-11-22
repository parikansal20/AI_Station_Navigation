export interface GraphNode {
  id: string;
  labelEnglish: string;
  labelHindi: string;
  position: [number, number, number]; // [X, Y, Z] world position
  floor: "G" | "1F";
  accessible: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;
  accessible: boolean; // true = ramp/elevator/flat floor, false = steep stairs without ramp
  instructionEnglish: string;
  instructionHindi: string;
}

export const STATION_NODES: GraphNode[] = [
  // GROUND FLOOR CORRIDOR & AISLE NODES
  { id: "parking-area", labelEnglish: "Parking Plaza & Auto Stand", labelHindi: "पार्किंग प्लाजा एवं ऑटो स्टैंड", position: [0, 0.1, 36], floor: "G", accessible: true },
  { id: "main-entrance", labelEnglish: "Main Station Entrance Portico", labelHindi: "मुख्य स्टेशन प्रवेश द्वार", position: [0, 0.1, 26], floor: "G", accessible: true },
  { id: "coolie-point", labelEnglish: "Coolie Stand", labelHindi: "कुली स्टैंड", position: [10, 0.1, 25], floor: "G", accessible: true },
  { id: "concourse-front", labelEnglish: "Front Concourse Hall", labelHindi: "मुख्य कॉनकोर्स हॉल", position: [0, 0.1, 20], floor: "G", accessible: true },
  { id: "concourse-center", labelEnglish: "Central Concourse Hallway", labelHindi: "केंद्रीय कॉनकोर्स गलियारा", position: [0, 0.1, 8], floor: "G", accessible: true },

  // WEST AISLE WAYPOINTS
  { id: "west-aisle-north", labelEnglish: "West Concourse North Aisle", labelHindi: "पश्चिमी कॉनकोर्स उत्तरी गलियारा", position: [-6, 0.1, 20], floor: "G", accessible: true },
  { id: "west-aisle-ticket", labelEnglish: "Ticket Counters Aisle", labelHindi: "टिकट काउंटर गलियारा", position: [-6, 0.1, 16], floor: "G", accessible: true },
  { id: "west-aisle-cloak", labelEnglish: "Cloak Room Aisle", labelHindi: "क्लॉक रूम गलियारा", position: [-6, 0.1, 14], floor: "G", accessible: true },
  { id: "west-aisle-mid", labelEnglish: "West Concourse Mid Aisle", labelHindi: "पश्चिमी मध्य गलियारा", position: [-6, 0.1, 8], floor: "G", accessible: true },
  { id: "west-aisle-south", labelEnglish: "West Concourse South Aisle", labelHindi: "पश्चिमी दक्षिणी गलियारा", position: [-6, 0.1, 0], floor: "G", accessible: true },
  { id: "west-aisle-washrooms", labelEnglish: "Washrooms Entry Corridor", labelHindi: "शौचालय प्रवेश गलियारा", position: [-6, 0.1, -2], floor: "G", accessible: true },

  // EAST AISLE WAYPOINTS
  { id: "east-aisle-north", labelEnglish: "East Concourse North Aisle", labelHindi: "पूर्वी कॉनकोर्स उत्तरी गलियारा", position: [6, 0.1, 20], floor: "G", accessible: true },
  { id: "east-aisle-lounge", labelEnglish: "AC Lounge Aisle", labelHindi: "एसी लाउंज गलियारा", position: [6, 0.1, 16], floor: "G", accessible: true },
  { id: "east-aisle-mid", labelEnglish: "East Concourse Mid Aisle", labelHindi: "पूर्वी मध्य गलियारा", position: [6, 0.1, 8], floor: "G", accessible: true },
  { id: "east-aisle-sm", labelEnglish: "Station Master Office Aisle", labelHindi: "स्टेशन मास्टर कार्यालय गलियारा", position: [6, 0.1, 4], floor: "G", accessible: true },
  { id: "east-aisle-south", labelEnglish: "RPF Post Aisle", labelHindi: "आर.पी.एफ. पोस्ट गलियारा", position: [6, 0.1, 0], floor: "G", accessible: true },

  // GROUND FLOOR FACILITY ENTRANCE WAYPOINTS
  { id: "ticket-counters", labelEnglish: "Ticket Booking Windows", labelHindi: "अनारक्षित टिकट काउंटर", position: [-8.5, 0.1, 16], floor: "G", accessible: true },
  { id: "atm-booth", labelEnglish: "SBI ATM Booth", labelHindi: "एसबीआई एटीएम", position: [-16.5, 0.1, 20], floor: "G", accessible: true },
  { id: "cloak-room", labelEnglish: "Cloak Room", labelHindi: "क्लॉक रूम", position: [-15.5, 0.1, 14], floor: "G", accessible: true },
  { id: "book-store", labelEnglish: "Wheelers Book Store", labelHindi: "व्हीलर्स बुक स्टोर", position: [-15.5, 0.1, 8], floor: "G", accessible: true },
  { id: "waiting-hall", labelEnglish: "General Waiting Hall", labelHindi: "सामान्य प्रतीक्षालय", position: [-8.5, 0.1, 4], floor: "G", accessible: true },
  { id: "pharmacy-medical", labelEnglish: "Pharmacy & Medical Room", labelHindi: "जन औषधि केंद्र", position: [-15.5, 0.1, 0], floor: "G", accessible: true },
  { id: "gents-washroom-gf", labelEnglish: "Gents Washroom", labelHindi: "पुरुष शौचालय", position: [-15.5, 0.1, -2], floor: "G", accessible: true },
  { id: "ladies-washroom-gf", labelEnglish: "Ladies Washroom", labelHindi: "महिला शौचालय", position: [-9.5, 0.1, -2], floor: "G", accessible: true },
  { id: "water-station-gf", labelEnglish: "RO Water Station", labelHindi: "आर.ओ. पेयजल बूथ", position: [0, 0.1, 12], floor: "G", accessible: true },
  { id: "ac-lounge", labelEnglish: "1st Class AC Lounge", labelHindi: "प्रथम श्रेणी एसी लाउंज", position: [8.5, 0.1, 16], floor: "G", accessible: true },
  { id: "ladies-waiting-room", labelEnglish: "Ladies Waiting Room", labelHindi: "महिला प्रतीक्षालय", position: [8.5, 0.1, 8], floor: "G", accessible: true },
  { id: "police-station", labelEnglish: "RPF Police Station", labelHindi: "आर.पी.एफ. पुलिस पोस्ट", position: [8.5, 0.1, 0], floor: "G", accessible: true },
  { id: "station-master", labelEnglish: "Station Master Office", labelHindi: "स्टेशन मास्टर कार्यालय", position: [8.5, 0.1, 4], floor: "G", accessible: true },
  { id: "stair-gf-base", labelEnglish: "Ground Floor Staircase Base", labelHindi: "मुख्य सीढ़ी का भूतल आधार", position: [0, 0.1, 4], floor: "G", accessible: true },
  { id: "ramp-gf-base", labelEnglish: "Wheelchair Elevator & Ramp Base", labelHindi: "दिव्यांगजन लिफ्ट एवं रैंप आधार", position: [6, 0.1, 4], floor: "G", accessible: true },

  // FIRST FLOOR & FOOT OVERBRIDGE NODES
  { id: "stair-1f-top", labelEnglish: "Foot Overbridge 1F Landing", labelHindi: "फुट ओवरब्रिज प्रथम तल लैंडिंग", position: [0, 6.4, -4], floor: "1F", accessible: false },
  { id: "elevator-1f-top", labelEnglish: "Wheelchair Elevator 1F Top", labelHindi: "दिव्यांगजन लिफ्ट प्रथम तल", position: [6, 6.4, -4], floor: "1F", accessible: true },
  { id: "1f-west-junction", labelEnglish: "1F West Concourse Corridor", labelHindi: "प्रथम तल पश्चिमी गलियारा", position: [-6, 6.4, 10], floor: "1F", accessible: true },
  { id: "food-court-1f", labelEnglish: "1st Floor IRCTC Food Court", labelHindi: "प्रथम तल फूड कोर्ट", position: [-8.5, 6.4, 10], floor: "1F", accessible: true },
  { id: "1f-east-junction", labelEnglish: "1F East Concourse Corridor", labelHindi: "प्रथम तल पूर्वी गलियारा", position: [6, 6.4, 14], floor: "1F", accessible: true },
  { id: "dormitories", labelEnglish: "Retiring Rooms & Dormitories", labelHindi: "प्रथम तल डॉर्मिटरी", position: [8.5, 6.4, 14], floor: "1F", accessible: true },
  { id: "fob-p1-junction", labelEnglish: "FOB Platform 1 Bridge", labelHindi: "FOB प्लेटफॉर्म 1 ब्रिज", position: [0, 6.4, -8], floor: "1F", accessible: true },
  { id: "fob-p23-junction", labelEnglish: "FOB Platform 2 & 3 Bridge", labelHindi: "FOB प्लेटफॉर्म 2 एवं 3 ब्रिज", position: [0, 6.4, -20], floor: "1F", accessible: true },
  { id: "fob-p45-junction", labelEnglish: "FOB Platform 4 & 5 Bridge", labelHindi: "FOB प्लेटफॉर्म 4 एवं 5 ब्रिज", position: [0, 6.4, -34], floor: "1F", accessible: true },

  // PLATFORM NODES
  { id: "p1-stair-landing", labelEnglish: "Platform 1 FOB Stair Base", labelHindi: "प्लेटफॉर्म 1 सीढ़ी लैंडिंग", position: [6.8, 0.9, -8], floor: "G", accessible: true },
  { id: "platform-1", labelEnglish: "Platform 1 (Lucknow Mail)", labelHindi: "प्लेटफॉर्म 1 (लखनऊ मेल)", position: [0, 0.9, -8], floor: "G", accessible: true },
  { id: "irctc-stall-p1", labelEnglish: "IRCTC Sarthi Chai Stall", labelHindi: "सारथी चाय स्टॉल", position: [-15, 0.9, -8], floor: "G", accessible: true },
  { id: "p23-stair-landing", labelEnglish: "Platform 2/3 FOB Stair Base", labelHindi: "प्लेटफॉर्म 2/3 सीढ़ी लैंडिंग", position: [6.8, 0.9, -20], floor: "G", accessible: true },
  { id: "platform-2", labelEnglish: "Platform 2 (Passenger Express)", labelHindi: "प्लेटफॉर्म 2", position: [0, 0.9, -20], floor: "G", accessible: true },
  { id: "platform-3", labelEnglish: "Platform 3 (Vande Bharat Express)", labelHindi: "प्लेटफॉर्म 3 (वंदे भारत एक्सप्रेस)", position: [8, 0.9, -20], floor: "G", accessible: true },
  { id: "p45-stair-landing", labelEnglish: "Platform 4/5 FOB Stair Base", labelHindi: "प्लेटफॉर्म 4/5 सीढ़ी लैंडिंग", position: [6.8, 0.9, -34], floor: "G", accessible: true },
  { id: "platform-4", labelEnglish: "Platform 4 (Intercity)", labelHindi: "प्लेटफॉर्म 4", position: [0, 0.9, -34], floor: "G", accessible: true },
  { id: "platform-5", labelEnglish: "Platform 5 (Freight & Parcel)", labelHindi: "प्लेटफॉर्म 5", position: [8, 0.9, -34], floor: "G", accessible: true },
];

export const STATION_EDGES: GraphEdge[] = [
  { from: "parking-area", to: "main-entrance", distance: 10, accessible: true, instructionEnglish: "Walk straight past the Auto Stand into the Main Station Entrance Portico.", instructionHindi: "पार्किंग प्लाजा एवं ऑटो स्टैंड से सीधे मुख्य प्रवेश द्वार की ओर बढ़ें।" },
  { from: "main-entrance", to: "coolie-point", distance: 10.5, accessible: true, instructionEnglish: "Turn right past the metal detector arch to reach the Coolie Stand.", instructionHindi: "प्रवेश द्वार के पास सुरक्षा गेट से दाहिनी ओर कुली स्टैंड की ओर जाएं।" },
  { from: "main-entrance", to: "concourse-front", distance: 6, accessible: true, instructionEnglish: "Pass through security X-ray scanners into the Front Concourse Hall.", instructionHindi: "एक्स-रे सुरक्षा जांच स्कैनर से आगे मुख्य कॉनकोर्स हॉल में प्रवेश करें।" },
  { from: "concourse-front", to: "west-aisle-north", distance: 6.0, accessible: true, instructionEnglish: "Turn left into the West Concourse Hallway past the ATM booth.", instructionHindi: "बाईं ओर पश्चिमी कॉनकोर्स गलियारे में मुड़ें।" },
  { from: "concourse-front", to: "east-aisle-north", distance: 6.0, accessible: true, instructionEnglish: "Turn right into the East Concourse Hallway past the AC Lounge.", instructionHindi: "दाहिनी ओर पूर्वी कॉनकोर्स गलियारे में मुड़ें।" },
  { from: "concourse-front", to: "water-station-gf", distance: 8.0, accessible: true, instructionEnglish: "Walk straight down the central concourse past the RO Water Station under the Station Clock.", instructionHindi: "मुख्य कॉनकोर्स में स्टेशन घड़ी के नीचे आर.ओ. पेयजल बूथ की ओर सीधे बढ़ें।" },
  { from: "water-station-gf", to: "concourse-center", distance: 4.0, accessible: true, instructionEnglish: "Continue straight past the Enquiry Counter towards the Central Staircase.", instructionHindi: "पूछताछ काउंटर के पास से सीधे मुख्य सीढ़ी की ओर बढ़ें।" },
  { from: "west-aisle-north", to: "west-aisle-ticket", distance: 4.0, accessible: true, instructionEnglish: "Walk along the West Corridor towards Ticket Counters.", instructionHindi: "पश्चिमी गलियारे में अनारक्षित टिकट काउंटर की ओर बढ़ें।" },
  { from: "west-aisle-ticket", to: "ticket-counters", distance: 2.5, accessible: true, instructionEnglish: "Step up to the Ticket Booking Windows.", instructionHindi: "अनारक्षित टिकट काउंटर काउंटर पर पहुंचे।" },
  { from: "west-aisle-north", to: "atm-booth", distance: 10.5, accessible: true, instructionEnglish: "Walk straight to the outer wall to reach SBI ATM Booth.", instructionHindi: "बाहरी दीवार की ओर एसबीआई एटीएम बूथ पर जाएं।" },
  { from: "west-aisle-ticket", to: "west-aisle-cloak", distance: 2.0, accessible: true, instructionEnglish: "Continue along the West Corridor past the ticket counters.", instructionHindi: "पश्चिमी गलियारे में आगे बढ़ें।" },
  { from: "west-aisle-cloak", to: "cloak-room", distance: 9.5, accessible: true, instructionEnglish: "Turn right to enter the Cloak Room & Luggage Store.", instructionHindi: "अमानती सामान घर (क्लॉक रूम) में प्रवेश करें।" },
  { from: "west-aisle-cloak", to: "west-aisle-mid", distance: 6.0, accessible: true, instructionEnglish: "Walk straight down the West Corridor.", instructionHindi: "पश्चिमी मध्य गलियारे में आगे बढ़ें।" },
  { from: "west-aisle-mid", to: "book-store", distance: 9.5, accessible: true, instructionEnglish: "Walk to Wheelers Book Store kiosk.", instructionHindi: "व्हीलर्स पुस्तक दुकान पहुंचे।" },
  { from: "west-aisle-mid", to: "waiting-hall", distance: 2.5, accessible: true, instructionEnglish: "Turn into the General Passenger Waiting Hall.", instructionHindi: "सामान्य प्रतीक्षालय में प्रवेश करें।" },
  { from: "west-aisle-mid", to: "concourse-center", distance: 6.0, accessible: true, instructionEnglish: "Turn left into the Central Concourse.", instructionHindi: "बाईं ओर केंद्रीय कॉनकोर्स में आएं।" },
  { from: "west-aisle-mid", to: "west-aisle-south", distance: 8.0, accessible: true, instructionEnglish: "Proceed down the south end of West Corridor.", instructionHindi: "पश्चिमी दक्षिणी गलियारे में आगे बढ़ें।" },
  { from: "west-aisle-south", to: "pharmacy-medical", distance: 9.5, accessible: true, instructionEnglish: "Walk to Jan Aushadhi Pharmacy & Medical Room.", instructionHindi: "जन औषधि केंद्र पहुंचे।" },
  { from: "west-aisle-south", to: "west-aisle-washrooms", distance: 2.0, accessible: true, instructionEnglish: "Walk to the end of West Corridor for Washrooms.", instructionHindi: "गलियारे के अंत में शौचालय की ओर जाएं।" },
  { from: "west-aisle-washrooms", to: "gents-washroom-gf", distance: 9.5, accessible: true, instructionEnglish: "Enter Gents Washroom.", instructionHindi: "पुरुष शौचालय में प्रवेश करें।" },
  { from: "west-aisle-washrooms", to: "ladies-washroom-gf", distance: 3.5, accessible: true, instructionEnglish: "Enter Ladies Washroom.", instructionHindi: "महिला शौचालय में प्रवेश करें।" },
  { from: "east-aisle-north", to: "east-aisle-lounge", distance: 4.0, accessible: true, instructionEnglish: "Walk along the East Corridor towards AC Executive Lounge.", instructionHindi: "पूर्वी कॉनकोर्स में एसी लाउंज की ओर जाएं।" },
  { from: "east-aisle-lounge", to: "ac-lounge", distance: 2.5, accessible: true, instructionEnglish: "Enter the 1st Class AC Executive Lounge.", instructionHindi: "प्रथम श्रेणी एसी लाउंज में प्रवेश करें।" },
  { from: "east-aisle-lounge", to: "east-aisle-mid", distance: 8.0, accessible: true, instructionEnglish: "Continue down the East Corridor.", instructionHindi: "पूर्वी गलियारे में आगे बढ़ें।" },
  { from: "east-aisle-mid", to: "ladies-waiting-room", distance: 2.5, accessible: true, instructionEnglish: "Enter the Ladies Waiting Room.", instructionHindi: "महिला प्रतीक्षालय में प्रवेश करें।" },
  { from: "east-aisle-mid", to: "concourse-center", distance: 6.0, accessible: true, instructionEnglish: "Turn right into the Central Concourse.", instructionHindi: "दाहिनी ओर केंद्रीय कॉनकोर्स में आएं।" },
  { from: "east-aisle-mid", to: "east-aisle-sm", distance: 4.0, accessible: true, instructionEnglish: "Walk along East Corridor towards Station Master Office.", instructionHindi: "पूर्वी गलियारे में स्टेशन मास्टर कार्यालय की ओर जाएं।" },
  { from: "east-aisle-sm", to: "station-master", distance: 2.5, accessible: true, instructionEnglish: "Enter Station Master Office.", instructionHindi: "स्टेशन मास्टर कार्यालय में प्रवेश करें।" },
  { from: "east-aisle-sm", to: "east-aisle-south", distance: 4.0, accessible: true, instructionEnglish: "Continue south along East Corridor to RPF Police Station.", instructionHindi: "पूर्वी गलियारे में आगे आर.पी.एफ. पुलिस चौकी तक जाएं।" },
  { from: "east-aisle-south", to: "police-station", distance: 2.5, accessible: true, instructionEnglish: "Enter RPF Police Station.", instructionHindi: "आर.पी.एफ. पुलिस पोस्ट में प्रवेश करें।" },
  { from: "concourse-center", to: "stair-gf-base", distance: 3.5, accessible: true, instructionEnglish: "Walk to the base of the Central Staircase.", instructionHindi: "मुख्य सीढ़ी के आधार पर पहुंचे।" },
  { from: "concourse-center", to: "ramp-gf-base", distance: 6.0, accessible: true, instructionEnglish: "Walk to the Wheelchair Elevator & Ramp Base.", instructionHindi: "दिव्यांगजन लिफ्ट एवं रैंप आधार पर पहुंचे।" },
  { from: "stair-gf-base", to: "stair-1f-top", distance: 8.5, accessible: false, instructionEnglish: "Climb central stairs up to Foot Overbridge (1st Floor).", instructionHindi: "मुख्य सीढ़ियों से प्रथम तल फुट ओवरब्रिज पर चढ़ें।" },
  { from: "ramp-gf-base", to: "elevator-1f-top", distance: 7.5, accessible: true, instructionEnglish: "Take the Wheelchair Elevator to Foot Overbridge (1st Floor).", instructionHindi: "दिव्यांगजन लिफ्ट द्वारा प्रथम तल फुट ओवरब्रिज पर पहुंचे।" },
  { from: "stair-1f-top", to: "elevator-1f-top", distance: 6.0, accessible: true, instructionEnglish: "Cross 1st floor upper concourse landing.", instructionHindi: "प्रथम तल कॉनकोर्स लैंडिंग पार करें।" },
  { from: "stair-1f-top", to: "1f-west-junction", distance: 6.0, accessible: true, instructionEnglish: "Walk west along 1st floor concourse towards Food Court.", instructionHindi: "प्रथम तल पश्चिमी गलियारे में फूड कोर्ट की ओर जाएं।" },
  { from: "1f-west-junction", to: "food-court-1f", distance: 2.5, accessible: true, instructionEnglish: "Enter IRCTC Multi-Cuisine Food Court.", instructionHindi: "प्रथम तल IRCTC फूड कोर्ट में प्रवेश करें।" },
  { from: "stair-1f-top", to: "1f-east-junction", distance: 6.0, accessible: true, instructionEnglish: "Walk east along 1st floor concourse towards Dormitories.", instructionHindi: "प्रथम तल पूर्वी गलियारे में डॉर्मिटरी की ओर जाएं।" },
  { from: "1f-east-junction", to: "dormitories", distance: 2.5, accessible: true, instructionEnglish: "Enter Executive Dormitories & Retiring Rooms.", instructionHindi: "प्रथम तल डॉर्मिटरी में प्रवेश करें।" },
  { from: "stair-1f-top", to: "fob-p1-junction", distance: 4.0, accessible: true, instructionEnglish: "Step onto the Foot Overbridge deck spanning the platforms.", instructionHindi: "फुट ओवरब्रिज पर आगे बढ़ें।" },
  { from: "fob-p1-junction", to: "fob-p23-junction", distance: 12.0, accessible: true, instructionEnglish: "Walk along Foot Overbridge past Platform 1 towards Platform 2 & 3.", instructionHindi: "फुट ओवरब्रिज पर आगे बढ़ते हुए प्लेटफॉर्म 2 व 3 की ओर जाएं।" },
  { from: "fob-p23-junction", to: "fob-p45-junction", distance: 14.0, accessible: true, instructionEnglish: "Walk further along Foot Overbridge towards Platform 4 & 5.", instructionHindi: "फुट ओवरब्रिज पर प्लेटफॉर्म 4 व 5 की दिशा में आगे बढ़ें।" },
  { from: "fob-p1-junction", to: "p1-stair-landing", distance: 8.0, accessible: false, instructionEnglish: "Descend FOB stairs down to Platform 1.", instructionHindi: "सीढ़ियों से नीचे प्लेटफॉर्म 1 पर उतरें।" },
  { from: "p1-stair-landing", to: "platform-1", distance: 4.5, accessible: true, instructionEnglish: "Walk onto Platform 1 area.", instructionHindi: "प्लेटफॉर्म 1 पर पहुंचे।" },
  { from: "platform-1", to: "irctc-stall-p1", distance: 15.0, accessible: true, instructionEnglish: "Walk along Platform 1 to IRCTC Sarthi Chai Stall.", instructionHindi: "प्लेटफॉर्म 1 पर आगे बढ़कर सारथी चाय स्टॉल तक जाएं।" },
  { from: "fob-p23-junction", to: "p23-stair-landing", distance: 8.0, accessible: false, instructionEnglish: "Descend FOB stairs down to Platform 2 & 3 island platform.", instructionHindi: "सीढ़ियों से नीचे प्लेटफॉर्म 2 व 3 पर उतरें।" },
  { from: "p23-stair-landing", to: "platform-2", distance: 4.5, accessible: true, instructionEnglish: "Walk onto Platform 2 (Passenger Express).", instructionHindi: "प्लेटफॉर्म 2 पर पहुंचे।" },
  { from: "platform-2", to: "platform-3", distance: 8.0, accessible: true, instructionEnglish: "Cross island platform to Platform 3 (Vande Bharat Express).", instructionHindi: "प्लेटफॉर्म पार कर प्लेटफॉर्म 3 (वंदे भारत) पर पहुंचे।" },
  { from: "fob-p45-junction", to: "p45-stair-landing", distance: 8.0, accessible: false, instructionEnglish: "Descend FOB stairs down to Platform 4 & 5 island platform.", instructionHindi: "सीढ़ियों से नीचे प्लेटफॉर्म 4 व 5 पर उतरें।" },
  { from: "p45-stair-landing", to: "platform-4", distance: 4.5, accessible: true, instructionEnglish: "Walk onto Platform 4 (Intercity).", instructionHindi: "प्लेटफॉर्म 4 पर पहुंचे।" },
  { from: "platform-4", to: "platform-5", distance: 8.0, accessible: true, instructionEnglish: "Cross island platform to Platform 5 (Freight & Parcel).", instructionHindi: "आगे प्लेटफॉर्म 5 की ओर पहुंचे।" },
];
