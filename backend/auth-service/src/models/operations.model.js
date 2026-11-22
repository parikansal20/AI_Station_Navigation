const mongoose = require('mongoose');

const options = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
};

const AssistanceRequest = mongoose.models.AssistanceRequest || mongoose.model('AssistanceRequest', new mongoose.Schema({
  service: { type: String, enum: ['porter', 'golf-cart'], required: true, index: true },
  passengerName: { type: String, required: true, trim: true },
  userEmail: { type: String, trim: true, default: '', index: true },
  contact: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  pickup: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Assigned'], default: 'Pending', index: true }
}, options));

const NavigationRequest = mongoose.models.NavigationRequest || mongoose.model('NavigationRequest', new mongoose.Schema({
  origin: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  preference: { type: String, default: 'Fastest', trim: true },
  source: { type: String, enum: ['journey-planner', 'ai-navigator', 'station-map'], required: true, index: true }
}, options));

const PorterPersonnel = mongoose.models.PorterPersonnel || mongoose.model('PorterPersonnel', new mongoose.Schema({
  personnelId: { type: String, trim: true },
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  station: { type: String, trim: true },
  tasks: { type: Number, default: 0, min: 0 },
  // Passenger booking fields for porterpersonnels collection
  service: { type: String, default: 'porter', index: true },
  passengerName: { type: String, trim: true },
  userEmail: { type: String, trim: true, default: '', index: true },
  contact: { type: String, trim: true },
  destination: { type: String, trim: true },
  pickup: { type: String, trim: true },
  assignedPersonnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'PorterPersonnel', default: null },
  assignedPersonnelName: { type: String, trim: true },
  assignedResourceCode: { type: String, trim: true },
  assignedAt: { type: Date, default: null },
  status: { type: String, default: 'Pending', index: true }
}, options));

const GolfCart = mongoose.models.GolfCart || mongoose.model('GolfCart', new mongoose.Schema({
  cartId: { type: String, trim: true },
  driver: { type: String, default: 'Unassigned', trim: true },
  location: { type: String, trim: true },
  battery: { type: Number, min: 0, max: 100 },
  // Passenger booking fields for golfcarts collection
  service: { type: String, default: 'golf-cart', index: true },
  passengerName: { type: String, trim: true },
  userEmail: { type: String, trim: true, default: '', index: true },
  contact: { type: String, trim: true },
  destination: { type: String, trim: true },
  pickup: { type: String, trim: true },
  assignedCartId: { type: mongoose.Schema.Types.ObjectId, ref: 'GolfCart', default: null },
  assignedCartCode: { type: String, trim: true },
  assignedDriverName: { type: String, trim: true },
  assignedAt: { type: Date, default: null },
  status: { type: String, default: 'Pending', index: true }
}, options));

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, trim: true },
  passenger: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  issue: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  status: { type: String, enum: ['Open', 'Assigned', 'In progress', 'Resolved'], default: 'Open' }
}, options));

const Incident = mongoose.models.Incident || mongoose.model('Incident', new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  passenger: { type: String, required: true, trim: true },
  contact: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  severity: { type: String, enum: ['Critical', 'High', 'Medium'], required: true },
  team: { type: String, default: 'Unassigned', trim: true },
  status: { type: String, required: true, trim: true }
}, options));

const Station = mongoose.models.Station || mongoose.model('Station', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  platforms: { type: Number, min: 0, default: 0 },
  crowd: { type: String, enum: ['High', 'Moderate', 'Low', 'Unknown'], default: 'Unknown' },
  passengers: { type: Number, min: 0, default: 0 },
  status: { type: String, required: true, trim: true }
}, options));

const StationFacility = mongoose.models.StationFacility || mongoose.model('StationFacility', new mongoose.Schema({
  facility: { type: String, required: true, unique: true, trim: true },
  status: { type: String, enum: ['working', 'not_working'], required: true }
}, options));

const resources = {
  'assistance-requests': AssistanceRequest,
  'navigation-requests': NavigationRequest,
  'porter-personnel': PorterPersonnel,
  'golf-carts': GolfCart,
  complaints: Complaint,
  incidents: Incident,
  stations: Station
};

async function seedOperationsDefaults() {
  const defaultFacilities = [
    { facility: 'lift', status: 'working' },
    { facility: 'washroom', status: 'not_working' },
    { facility: 'ticket_counter', status: 'working' },
    { facility: 'escalator', status: 'working' },
    { facility: 'drinking_water', status: 'working' },
    { facility: 'waiting_room', status: 'not_working' },
    { facility: 'charging_station', status: 'working' },
    { facility: 'atm', status: 'not_working' }
  ];

  const defaultStations = [
    { name: 'Lucknow Junction', code: 'LJN', platforms: 6, crowd: 'Moderate', passengers: 14250, status: 'Operational' },
    { name: 'New Delhi Railway Station', code: 'NDLS', platforms: 16, crowd: 'High', passengers: 48900, status: 'Operational' },
    { name: 'Anand Vihar Terminal', code: 'ANVT', platforms: 7, crowd: 'Moderate', passengers: 22400, status: 'Operational' }
  ];

  const defaultPorters = [
    { personnelId: 'PRT-101', name: 'Ramesh Kumar', phone: '+91 9876543210', station: 'Lucknow Junction', tasks: 12, status: 'On duty' },
    { personnelId: 'PRT-102', name: 'Suresh Yadav', phone: '+91 9876543211', station: 'Lucknow Junction', tasks: 8, status: 'Available' },
    { personnelId: 'PRT-103', name: 'Vikram Singh', phone: '+91 9876543212', station: 'Lucknow Junction', tasks: 15, status: 'On duty' },
    { personnelId: 'PRT-104', name: 'Amit Verma', phone: '+91 9876543213', station: 'Lucknow Junction', tasks: 6, status: 'Available' },
    { personnelId: 'PRT-105', name: 'Manoj Sharma', phone: '+91 9876543214', station: 'Lucknow Junction', tasks: 19, status: 'Off duty' },
    { service: 'porter', passengerName: 'Sunil Rastogi', userEmail: 'sunil@example.com', contact: '9876543210', pickup: 'Gate 1 Main Concourse', destination: 'Platform 2 Coach S-4', status: 'Pending' },
    { service: 'porter', passengerName: 'Priya Sharma', userEmail: 'priya@example.com', contact: '9876543211', pickup: 'Taxi Drop-off Area', destination: 'Platform 1 AC Lounge', status: 'Assigned' }
  ];

  const defaultCarts = [
    { cartId: 'CRT-01', driver: 'Rajesh Singh', location: 'Gate 1 — Main Entrance', battery: 92, status: 'Available' },
    { cartId: 'CRT-02', driver: 'Sunil Kumar', location: 'Platform 1 Concourse', battery: 78, status: 'On trip' },
    { cartId: 'CRT-03', driver: 'Anil Prasad', location: 'Platform 4 Elevator', battery: 85, status: 'Available' },
    { cartId: 'CRT-04', driver: 'Deepak Sharma', location: 'Main Exit Gate 2', battery: 45, status: 'On trip' },
    { cartId: 'CRT-05', driver: 'Unassigned', location: 'Charging Station Bay B', battery: 20, status: 'Maintenance' },
    { service: 'golf-cart', passengerName: 'Harish Chandra', userEmail: 'harish@example.com', contact: '9765432109', pickup: 'Entrance Ramp Gate 1', destination: 'Platform 3 Escalator', status: 'Pending' },
    { service: 'golf-cart', passengerName: 'Kamla Devi', userEmail: 'kamla@example.com', contact: '9765432110', pickup: 'Ticket Counter Hall', destination: 'Platform 5 Coach B-2', status: 'Assigned' }
  ];

  const defaultComplaints = [
    { ticketId: 'CMP-2026001', passenger: 'Ananya Roy', contact: '+91 9812345678', issue: 'Escalator on Platform 2 non-operational during peak hours', category: 'Facility Management', location: 'Platform 2', priority: 'High', status: 'In progress' },
    { ticketId: 'CMP-2026002', passenger: 'Rahul Gupta', contact: '+91 9712345679', issue: 'Cleanliness required near waiting hall washrooms', category: 'Sanitation & Hygiene', location: 'Main Waiting Hall', priority: 'Medium', status: 'Open' },
    { ticketId: 'CMP-2026003', passenger: 'Pooja Sharma', contact: '+91 9612345680', issue: 'Wheelchair accessibility ramp blocked near Gate 3', category: 'Accessibility', location: 'Gate 3 Entrance', priority: 'High', status: 'Assigned' },
    { ticketId: 'CMP-2026004', passenger: 'Vikas Mehra', contact: '+91 9512345681', issue: 'Display board flickering on Platform 4', category: 'Information Systems', location: 'Platform 4', priority: 'Low', status: 'Resolved' },
    { ticketId: 'CMP-2026005', passenger: 'Sunita Devi', contact: '+91 9412345682', issue: 'Drinking water booth filter needs replacement', category: 'Amenities', location: 'Platform 1 North', priority: 'Medium', status: 'Open' }
  ];

  const defaultIncidents = [
    { incidentId: 'SOS-801', type: 'Medical Emergency - Passenger Fainted', passenger: 'Karan Malhotra', contact: '+91 9876500001', location: 'Platform 3 Concourse', severity: 'Critical', team: 'Railway Medical Response Unit 1', status: 'In progress' },
    { incidentId: 'RPF-802', type: 'Unattended Luggage Alert', passenger: 'Security Protocol', contact: '+91 9876500002', location: 'Waiting Hall Gate 2', severity: 'High', team: 'RPF Quick Reaction Team', status: 'Assigned' },
    { incidentId: 'SOS-803', type: 'Wheelchair Assistance Request', passenger: 'Meena Kumari', contact: '+91 9876500003', location: 'Main Entrance Taxi Stand', severity: 'Medium', team: 'Passenger Help Desk', status: 'Open' },
    { incidentId: 'RPF-804', type: 'Crowd Surge Management', passenger: 'Station Ops Control', contact: '+91 9876500004', location: 'Platform 1 Foot Overbridge', severity: 'High', team: 'RPF Control Desk', status: 'Resolved' }
  ];

  try {
    if (mongoose.connection.readyState === 1) {
      if ((await Station.countDocuments()) === 0) {
        await Station.insertMany(defaultStations);
      }
      if ((await PorterPersonnel.countDocuments({ personnelId: 'PRT-101' })) === 0) {
        await PorterPersonnel.insertMany(defaultPorters);
      }
      if ((await GolfCart.countDocuments({ cartId: 'CRT-01' })) === 0) {
        await GolfCart.insertMany(defaultCarts);
      }
      if ((await Complaint.countDocuments()) === 0) {
        await Complaint.insertMany(defaultComplaints);
      }
      if ((await Incident.countDocuments()) === 0) {
        await Incident.insertMany(defaultIncidents);
      }
      for (const facility of defaultFacilities) {
        await StationFacility.updateOne(
          { facility: facility.facility },
          { $setOnInsert: facility },
          { upsert: true }
        );
      }
      console.log('[SAARTHI Auth Service] Operations database defaults seeded successfully.');
    }
  } catch (error) {
    console.error('[SAARTHI Auth Service] Operations seeding warning:', error.message);
  }
}

module.exports = {
  AssistanceRequest,
  NavigationRequest,
  PorterPersonnel,
  GolfCart,
  Complaint,
  Incident,
  Station,
  StationFacility,
  resources,
  seedOperationsDefaults
};
