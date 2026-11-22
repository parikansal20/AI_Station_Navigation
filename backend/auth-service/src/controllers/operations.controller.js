const mongoose = require('mongoose');
const { AssistanceRequest, NavigationRequest, PorterPersonnel, GolfCart, Complaint, Incident, Station, resources } = require('../models/operations.model');
const UserModel = require('../models/user.model');

exports.getSummary = async (_req, res, next) => {
  try {
    const [stations, porterBookings, cartBookings, legacyBookings, complaints, incidents] = await Promise.all([
      Station.find({}),
      PorterPersonnel.find({ passengerName: { $exists: true } }),
      GolfCart.find({ passengerName: { $exists: true } }),
      AssistanceRequest.find({}),
      Complaint.find({}),
      Incident.find({})
    ]);

    const totalPassengersToday = stations.reduce((acc, curr) => acc + (curr.passengers || 0), 0) || 14250;
    const activePlatforms = stations.reduce((acc, curr) => acc + (curr.platforms || 0), 0) || 29;

    const allAssistanceRequests = [...porterBookings, ...cartBookings, ...legacyBookings];
    const pendingAssistanceCount = allAssistanceRequests.filter((r) => r.status === 'Pending').length;
    const openComplaintsCount = complaints.filter((c) => c.status === 'Open' || c.status === 'In progress').length;
    const activeIncidentsCount = incidents.filter((i) => i.status !== 'Resolved').length;

    const totalOpenRequests = pendingAssistanceCount + openComplaintsCount + activeIncidentsCount;

    // Platform traffic breakdown
    const platformTraffic = [
      { platform: 'Platform 1', passengers: 3420, crowd: 'High', status: 'Active' },
      { platform: 'Platform 2', passengers: 2150, crowd: 'Moderate', status: 'Active' },
      { platform: 'Platform 3', passengers: 1890, crowd: 'Moderate', status: 'Active' },
      { platform: 'Platform 4', passengers: 2410, crowd: 'High', status: 'Active' },
      { platform: 'Platform 5', passengers: 1680, crowd: 'Low', status: 'Active' },
      { platform: 'Platform 6', passengers: 2700, crowd: 'Moderate', status: 'Active' }
    ];

    // Combine recent activities from database
    const activityFeed = [];

    allAssistanceRequests.slice(0, 5).forEach((reqItem) => {
      const serviceName = reqItem.service === 'porter' ? 'Coolie Assistance' : 'Golf Cart Transport';
      activityFeed.push({
        id: `ACT-REQ-${reqItem._id || reqItem.id}`,
        title: `${serviceName} Booking`,
        description: `${reqItem.passengerName || 'Passenger'} requested ${serviceName} from ${reqItem.pickup} to ${reqItem.destination}.`,
        timestamp: reqItem.createdAt || new Date().toISOString(),
        type: 'Assistance',
        status: reqItem.status
      });
    });

    complaints.slice(0, 4).forEach((comp) => {
      activityFeed.push({
        id: `ACT-CMP-${comp._id || comp.id}`,
        title: `Passenger Complaint (${comp.ticketId})`,
        description: `${comp.passenger}: "${comp.issue}" at ${comp.location}.`,
        timestamp: comp.createdAt || new Date().toISOString(),
        type: 'Complaint',
        status: comp.status
      });
    });

    incidents.slice(0, 4).forEach((inc) => {
      activityFeed.push({
        id: `ACT-INC-${inc._id || inc.id}`,
        title: `Emergency SOS (${inc.incidentId})`,
        description: `${inc.type} reported at ${inc.location}. Assigned: ${inc.team}.`,
        timestamp: inc.createdAt || new Date().toISOString(),
        type: 'Emergency',
        status: inc.status
      });
    });

    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({
      success: true,
      data: {
        passengersToday: totalPassengersToday,
        activePlatforms,
        openRequestsCount: totalOpenRequests,
        pendingAssistanceCount,
        openComplaintsCount,
        activeIncidentsCount,
        avgResponseTime: '3.8 min',
        platformTraffic,
        activityFeed: activityFeed.slice(0, 10),
        stations
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const resourceName = req.params.resource;

    if (resourceName === 'assistance-requests') {
      const filter = {};
      if (req.query.userEmail) {
        filter.userEmail = req.query.userEmail.trim().toLowerCase();
      }

      // Fetch from porterpersonnels, golfcarts, and legacy assistancerequests collections
      const [porterBookings, cartBookings, legacyBookings] = await Promise.all([
        PorterPersonnel.find({ passengerName: { $exists: true }, ...filter }).sort({ createdAt: -1 }),
        GolfCart.find({ passengerName: { $exists: true }, ...filter }).sort({ createdAt: -1 }),
        AssistanceRequest.find(filter).sort({ createdAt: -1 })
      ]);

      let combined = [...porterBookings, ...cartBookings];

      // Add legacy bookings only if not already present in porterBookings or cartBookings
      for (const legacy of legacyBookings) {
        const isDuplicate = combined.some((b) => {
          const sameContact = b.contact === legacy.contact;
          const sameService = b.service === legacy.service;
          const sameTime = Math.abs(new Date(b.createdAt).getTime() - new Date(legacy.createdAt).getTime()) < 5000;
          return sameContact && sameService && sameTime;
        });
        if (!isDuplicate) {
          combined.push(legacy);
        }
      }

      if (req.query.service) {
        combined = combined.filter((item) => item.service === req.query.service);
      }

      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json({ success: true, data: combined });
    }

    const Model = resources[resourceName];
    if (!Model) {
      return res.status(404).json({ success: false, message: 'Unknown operations resource.' });
    }

    const filter = {};
    const records = await Model.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};


exports.createAssistanceRequest = async (req, res, next) => {
  try {
    const { service, passengerName, userEmail, contact, destination, pickup } = req.body;
    if (!service || !passengerName?.trim() || !contact?.trim() || !destination?.trim() || !pickup?.trim()) {
      return res.status(400).json({ success: false, message: 'Service, passenger name, contact, destination and pickup are required.' });
    }
    const cleanContact = contact.trim();
    if (!/^\d{10}$/.test(cleanContact)) {
      return res.status(400).json({ success: false, message: 'Mobile number must be exactly 10 digits.' });
    }

    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : (req.user?.email ? req.user.email.trim().toLowerCase() : '');
    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to book a service.',
        code: 'USER_EMAIL_REQUIRED'
      });
    }

    // SERVER-SIDE DATABASE VERIFICATION: Check if user exists in database before saving service
    const existingUser = await UserModel.findByEmail(cleanEmail);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: `User account with email '${cleanEmail}' does not exist in our database. Please register or log in again to book services.`,
        code: 'USER_NOT_FOUND_IN_DB'
      });
    }

    const payload = {
      service,
      passengerName: passengerName.trim(),
      userEmail: cleanEmail,
      contact: cleanContact,
      destination: destination.trim(),
      pickup: pickup.trim(),
      status: 'Pending'
    };

    let createdRecord;
    if (service === 'porter') {
      // Save directly to porterpersonnels collection ONLY
      createdRecord = await PorterPersonnel.create(payload);
    } else if (service === 'golf-cart') {
      // Save directly to golfcarts collection ONLY
      createdRecord = await GolfCart.create({
        ...payload,
        location: pickup.trim(),
        battery: 100
      });
    } else {
      createdRecord = await AssistanceRequest.create(payload);
    }

    return res.status(201).json({ success: true, data: createdRecord });
  } catch (error) {
    next(error);
  }
};

exports.createNavigationRequest = async (req, res, next) => {
  try {
    const { origin, destination, preference, source } = req.body;
    const supportedSources = new Set(['journey-planner', 'ai-navigator', 'station-map']);
    if (!origin?.trim() || !destination?.trim() || !supportedSources.has(source)) {
      return res.status(400).json({
        success: false,
        message: 'Origin, destination and a valid navigation source are required.'
      });
    }

    const request = await NavigationRequest.create({
      origin: origin.trim(),
      destination: destination.trim(),
      preference: preference?.trim() || 'Fastest',
      source
    });
    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

exports.createComplaint = async (req, res, next) => {
  try {
    const { passenger, contact, issue, userEmail, email } = req.body;
    if (!passenger?.trim() || !contact?.trim() || !issue?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, contact number and complaint are required.' });
    }
    const normalizedContact = contact.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(normalizedContact)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }

    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : (email ? email.trim().toLowerCase() : (req.user?.email ? req.user.email.trim().toLowerCase() : ''));

    // SERVER-SIDE DATABASE VERIFICATION: Check if user exists in database if email is provided
    if (cleanEmail) {
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `User account with email '${cleanEmail}' does not exist in our database. Please register or log in again.`,
          code: 'USER_NOT_FOUND_IN_DB'
        });
      }
    }

    const Complaint = resources.complaints;
    const ticketId = `CMP-${Date.now().toString().slice(-8)}`;
    const complaint = await Complaint.create({
      ticketId,
      passenger: passenger.trim(),
      userEmail: cleanEmail,
      contact: `+91 ${normalizedContact}`,
      issue: issue.trim(),
      category: 'Passenger submitted',
      location: 'Lucknow Junction',
      priority: 'Medium',
      status: 'Open'
    });
    return res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    next(error);
  }
};

exports.createStationSupportRequest = async (req, res, next) => {
  try {
    const { service, passengerName, contact, userEmail, email, message } = req.body;
    const supportedServices = new Set(['medical', 'security', 'helpdesk']);
    const passengerMessage = message?.trim();
    if (!supportedServices.has(service) || !contact?.trim() || !passengerMessage) {
      return res.status(400).json({ success: false, message: 'A valid service, contact number and message are required.' });
    }
    if (passengerMessage.length > 1000) {
      return res.status(400).json({ success: false, message: 'The assistance message must be 1000 characters or fewer.' });
    }
    const normalizedContact = contact.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
    if (!/^[6-9]\d{9}$/.test(normalizedContact)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }

    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : (email ? email.trim().toLowerCase() : (req.user?.email ? req.user.email.trim().toLowerCase() : ''));

    // SERVER-SIDE DATABASE VERIFICATION: Check if user exists in database if email is provided
    if (cleanEmail) {
      const existingUser = await UserModel.findByEmail(cleanEmail);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `User account with email '${cleanEmail}' does not exist in our database. Please register or log in again.`,
          code: 'USER_NOT_FOUND_IN_DB'
        });
      }
    }

    const passenger = passengerName?.trim() || 'Passenger';
    const formattedContact = `+91 ${normalizedContact}`;

    if (service === 'medical') {
      const Complaint = resources.complaints;
      const complaint = await Complaint.create({
        ticketId: `MED-${Date.now().toString().slice(-8)}`,
        passenger,
        userEmail: cleanEmail,
        contact: formattedContact,
        issue: passengerMessage,
        category: 'Medical Assistance',
        location: 'Lucknow Junction',
        priority: 'High',
        status: 'Open'
      });
      return res.status(201).json({ success: true, destination: 'complaints', data: complaint });
    }

    const Incident = resources.incidents;
    const incident = await Incident.create({
      incidentId: `${service === 'security' ? 'RPF' : 'HELP'}-${Date.now().toString().slice(-8)}`,
      type: service === 'security' ? 'Railway Security Assistance' : 'Passenger Help Desk Assistance',
      message: passengerMessage,
      passenger,
      userEmail: cleanEmail,
      contact: formattedContact,
      location: 'Lucknow Junction',
      severity: service === 'security' ? 'High' : 'Medium',
      team: service === 'security' ? 'RPF response desk' : 'Passenger help desk',
      status: 'Open'
    });
    return res.status(201).json({ success: true, destination: 'incidents', data: incident });
  } catch (error) {
    next(error);
  }
};

exports.assignAssistanceRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resourceId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(resourceId)) {
      return res.status(400).json({ success: false, message: 'A valid request and available resource are required.' });
    }

    const porterRequest = await PorterPersonnel.findOne({
      _id: id,
      passengerName: { $exists: true },
      service: 'porter',
      status: 'Pending'
    });
    if (porterRequest) {
      const porter = await PorterPersonnel.findOneAndUpdate(
        { _id: resourceId, personnelId: { $exists: true }, status: 'Available' },
        { $set: { status: 'On duty' } },
        { new: true }
      );
      if (!porter) {
        return res.status(409).json({ success: false, message: 'That coolie is no longer available. Choose another coolie.' });
      }
      try {
        porterRequest.status = 'Assigned';
        porterRequest.assignedPersonnelId = porter._id;
        porterRequest.assignedPersonnelName = porter.name;
        porterRequest.assignedResourceCode = porter.personnelId;
        porterRequest.assignedAt = new Date();
        await porterRequest.save();
      } catch (error) {
        await PorterPersonnel.updateOne({ _id: porter._id }, { $set: { status: 'Available' } });
        throw error;
      }
      return res.json({ success: true, data: porterRequest, resource: porter });
    }

    const cartRequest = await GolfCart.findOne({
      _id: id,
      passengerName: { $exists: true },
      service: 'golf-cart',
      status: 'Pending'
    });
    if (cartRequest) {
      const cart = await GolfCart.findOneAndUpdate(
        { _id: resourceId, cartId: { $exists: true }, status: 'Available' },
        { $set: { status: 'On trip' } },
        { new: true }
      );
      if (!cart) {
        return res.status(409).json({ success: false, message: 'That golf cart is no longer available. Choose another cart.' });
      }
      try {
        cartRequest.status = 'Assigned';
        cartRequest.assignedCartId = cart._id;
        cartRequest.assignedCartCode = cart.cartId;
        cartRequest.assignedDriverName = cart.driver;
        cartRequest.assignedAt = new Date();
        await cartRequest.save();
      } catch (error) {
        await GolfCart.updateOne({ _id: cart._id }, { $set: { status: 'Available' } });
        throw error;
      }
      return res.json({ success: true, data: cartRequest, resource: cart });
    }

    return res.status(404).json({ success: false, message: 'Pending assistance request not found.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssistanceRequest = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid request id.' });
    }

    const id = req.params.id;
    let request = await PorterPersonnel.findOneAndDelete({ _id: id, passengerName: { $exists: true } });
    if (request?.assignedPersonnelId) {
      await PorterPersonnel.updateOne({ _id: request.assignedPersonnelId }, { $set: { status: 'Available' } });
    }
    if (!request) {
      request = await GolfCart.findOneAndDelete({ _id: id, passengerName: { $exists: true } });
      if (request?.assignedCartId) {
        await GolfCart.updateOne({ _id: request.assignedCartId }, { $set: { status: 'Available' } });
      }
    }
    if (!request) {
      request = await AssistanceRequest.findByIdAndDelete(id);
    }

    if (!request) return res.status(404).json({ success: false, message: 'Request not found.' });
    return res.json({ success: true, message: 'Request deleted successfully.', id });
  } catch (error) {
    next(error);
  }
};
