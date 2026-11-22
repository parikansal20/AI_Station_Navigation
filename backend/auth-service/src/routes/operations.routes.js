const express = require('express');
const controller = require('../controllers/operations.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/summary', controller.getSummary);
router.get('/:resource', controller.list);
router.post('/assistance-requests', optionalAuth, controller.createAssistanceRequest);
router.post('/navigation-requests', controller.createNavigationRequest);
router.post('/complaints', optionalAuth, controller.createComplaint);
router.post('/support-requests', optionalAuth, controller.createStationSupportRequest);
router.patch('/assistance-requests/:id/assign', controller.assignAssistanceRequest);
router.delete('/assistance-requests/:id', controller.deleteAssistanceRequest);

module.exports = router;
