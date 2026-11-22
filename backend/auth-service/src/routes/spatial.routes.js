const express = require('express');
const router = express.Router();
const spatialController = require('../controllers/spatial.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

router.get('/station-data', optionalAuth, spatialController.getStationData);
router.get('/digital-twin', optionalAuth, spatialController.getDigitalTwinStatus);

module.exports = router;
