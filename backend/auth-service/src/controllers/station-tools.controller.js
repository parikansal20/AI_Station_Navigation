const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { StationFacility } = require('../models/operations.model');

const dataDirectory = path.join(__dirname, '..', 'data');
const facilityStatusPath = path.join(dataDirectory, 'facility-status.json');
const unansweredQuestionsPath = path.join(dataDirectory, 'unanswered-questions.json');
const stationOperationsPath = path.join(dataDirectory, 'station-operations.json');
const allowedStatuses = new Set(['working', 'not_working']);
const allowedFacilities = new Set([
  'lift',
  'washroom',
  'ticket_counter',
  'escalator',
  'drinking_water',
  'waiting_room',
  'charging_station',
  'atm'
]);
const allowedDepartments = new Set([
  'Porter Department',
  'Golf Cart Department',
  'Wheelchair Department',
  'Emergency Department',
  'Help Desk',
  'AI Operations',
  'Facility Management',
  'Knowledge Management'
]);
const allowedPermissions = new Set([
  'view_analytics',
  'manage_facilities',
  'manage_knowledge',
  'publish_announcements',
  'manage_feedback',
  'view_department_status'
]);
const emptyOperations = {
  notifications: [],
  announcements: [],
  departmentAdmins: [],
  reports: [],
  feedback: [],
  departments: [],
  aiUsage: null,
  aiPerformance: null
};

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await writeJson(filePath, fallback);
    return fallback;
  }
}

async function writeJson(filePath, value) {
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, filePath);
}

exports.listFacilities = async (_req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const records = await StationFacility.find({}).lean();
      const facilities = Object.fromEntries(
        records.map((record) => [record.facility, record.status])
      );
      return res.json({ success: true, data: facilities });
    }

    const facilities = await readJson(facilityStatusPath, {});
    return res.json({ success: true, data: facilities });
  } catch (error) {
    next(error);
  }
};

exports.updateFacility = async (req, res, next) => {
  try {
    const { facility } = req.params;
    const { status } = req.body;

    if (!allowedFacilities.has(facility)) {
      return res.status(404).json({ success: false, message: 'Unknown station facility.' });
    }
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: 'Status must be working or not_working.' });
    }

    let facilities;
    if (mongoose.connection.readyState === 1) {
      await StationFacility.findOneAndUpdate(
        { facility },
        { $set: { status } },
        { upsert: true, new: true, runValidators: true }
      );
      const records = await StationFacility.find({}).lean();
      facilities = Object.fromEntries(
        records.map((record) => [record.facility, record.status])
      );
    } else {
      facilities = await readJson(facilityStatusPath, {});
      facilities[facility] = status;
      await writeJson(facilityStatusPath, facilities);
    }

    const facilityName = facility
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    try {
      const operations = await readJson(stationOperationsPath, emptyOperations);
      operations.notifications.unshift(createNotification(
        'Facility status updated',
        `${facilityName} marked as ${status === 'working' ? 'working' : 'under maintenance'}.`,
        'Facility'
      ));
      await writeJson(stationOperationsPath, operations);
    } catch (notificationError) {
      // A read-only deployment must not roll back a successfully persisted
      // facility status just because the legacy JSON activity log is unavailable.
      console.warn('[Station tools] Facility notification was not persisted:', notificationError.message);
    }

    return res.json({ success: true, data: facilities });
  } catch (error) {
    next(error);
  }
};

exports.listUnansweredQuestions = async (_req, res, next) => {
  try {
    const questions = await readJson(unansweredQuestionsPath, []);
    return res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

exports.logUnansweredQuestion = async (req, res, next) => {
  try {
    const question = req.body.question?.trim();
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const questions = await readJson(unansweredQuestionsPath, []);
    const existing = questions.find(
      (item) => item.question.toLocaleLowerCase() === question.toLocaleLowerCase()
    );

    if (existing) {
      existing.count += 1;
      existing.lastAskedAt = new Date().toISOString();
    } else {
      questions.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        question,
        count: 1,
        firstAskedAt: new Date().toISOString(),
        lastAskedAt: new Date().toISOString()
      });
    }

    await writeJson(unansweredQuestionsPath, questions);
    return res.status(201).json({ success: true, data: existing || questions[0] });
  } catch (error) {
    next(error);
  }
};

function createNotification(title, description, category = 'System') {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    category,
    createdAt: new Date().toISOString(),
    read: false
  };
}

exports.getOperationsDashboard = async (_req, res, next) => {
  try {
    const operations = await readJson(stationOperationsPath, emptyOperations);
    const now = new Date();
    let changed = false;

    for (const announcement of operations.announcements) {
      if (announcement.status === 'Scheduled' && new Date(announcement.publishAt) <= now) {
        announcement.status = 'Published';
        announcement.publishedAt = now.toISOString();
        announcement.notifiedAt = now.toISOString();
        operations.notifications.unshift(createNotification(
          'Published announcement',
          announcement.message,
          'Announcement'
        ));
        changed = true;
      } else if (announcement.status === 'Published' && !announcement.notifiedAt) {
        // Older published records already created a notification when saved.
        announcement.notifiedAt = announcement.createdAt;
        changed = true;
      }
    }

    if (changed) {
      await writeJson(stationOperationsPath, operations);
    }
    return res.json({ success: true, data: operations });
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const message = req.body.message?.trim();
    const publishAt = req.body.publishAt || new Date().toISOString();
    const languages = Array.isArray(req.body.languages) ? req.body.languages : ['English'];
    if (!message) {
      return res.status(400).json({ success: false, message: 'Announcement message is required.' });
    }
    if (Number.isNaN(new Date(publishAt).getTime())) {
      return res.status(400).json({ success: false, message: 'A valid publication date and time is required.' });
    }

    const operations = await readJson(stationOperationsPath, emptyOperations);
    const scheduled = new Date(publishAt) > new Date();
    const announcement = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      publishAt,
      languages,
      status: scheduled ? 'Scheduled' : 'Published',
      createdAt: new Date().toISOString(),
      publishedAt: scheduled ? null : new Date().toISOString(),
      notifiedAt: scheduled ? null : new Date().toISOString()
    };
    operations.announcements.unshift(announcement);
    if (announcement.status === 'Published') {
      operations.notifications.unshift(createNotification(
        'Published announcement',
        message,
        'Announcement'
      ));
    }
    await writeJson(stationOperationsPath, operations);
    return res.status(201).json({ success: true, data: operations });
  } catch (error) {
    next(error);
  }
};

exports.createDepartmentAdmin = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const role = req.body.role?.trim();
    const department = req.body.department?.trim();
    const permissions = Array.isArray(req.body.permissions)
      ? [...new Set(req.body.permissions)].filter((permission) => allowedPermissions.has(permission))
      : [];

    if (!name || !role || !allowedDepartments.has(department)) {
      return res.status(400).json({ success: false, message: 'Name, role and a valid department are required.' });
    }
    if (permissions.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one permission.' });
    }

    const operations = await readJson(stationOperationsPath, emptyOperations);
    const departmentAdmin = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      role,
      department,
      permissions,
      approvalStatus: 'Pending',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      lastLogin: null
    };
    operations.departmentAdmins.unshift(departmentAdmin);
    operations.notifications.unshift(createNotification(
      'Department admin awaiting approval',
      `${name} was added to ${department}. Review the requested permissions.`,
      'User access'
    ));
    await writeJson(stationOperationsPath, operations);
    return res.status(201).json({ success: true, data: operations });
  } catch (error) {
    next(error);
  }
};

exports.approveDepartmentAdmin = async (req, res, next) => {
  try {
    const operations = await readJson(stationOperationsPath, emptyOperations);
    const departmentAdmin = operations.departmentAdmins.find((admin) => admin.id === req.params.id);
    if (!departmentAdmin) {
      return res.status(404).json({ success: false, message: 'Department admin not found.' });
    }
    departmentAdmin.approvalStatus = 'Approved';
    departmentAdmin.approvedAt = new Date().toISOString();
    operations.notifications.unshift(createNotification(
      'Department access approved',
      `${departmentAdmin.name} can now access ${departmentAdmin.department}.`,
      'User access'
    ));
    await writeJson(stationOperationsPath, operations);
    return res.json({ success: true, data: operations });
  } catch (error) {
    next(error);
  }
};

exports.logStationUpdate = async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Update title and description are required.' });
    }
    const operations = await readJson(stationOperationsPath, emptyOperations);
    operations.notifications.unshift(createNotification(title, description, req.body.category || 'Operations'));
    await writeJson(stationOperationsPath, operations);
    return res.status(201).json({ success: true, data: operations });
  } catch (error) {
    next(error);
  }
};
