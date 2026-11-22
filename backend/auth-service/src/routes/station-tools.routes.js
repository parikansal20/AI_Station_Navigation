const express = require('express');
const controller = require('../controllers/station-tools.controller');

const router = express.Router();

router.get('/facilities', controller.listFacilities);
router.patch('/facilities/:facility', controller.updateFacility);
router.get('/unanswered-questions', controller.listUnansweredQuestions);
router.post('/unanswered-questions', controller.logUnansweredQuestion);
router.get('/dashboard', controller.getOperationsDashboard);
router.post('/announcements', controller.createAnnouncement);
router.post('/department-admins', controller.createDepartmentAdmin);
router.patch('/department-admins/:id/approve', controller.approveDepartmentAdmin);
router.post('/updates', controller.logStationUpdate);

module.exports = router;
