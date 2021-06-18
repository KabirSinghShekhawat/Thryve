const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const healthInfoController = require('./../controllers/healthInfoController')

router
    .route('/')
    .get(auth.isLoggedIn, auth.isVerified, healthInfoController.getHealthInfo)

router
    .route('/weight')
    .get(auth.isLoggedIn, auth.isVerified, healthInfoController.getWeight)

router
    .route('/targetweight')
    .get(auth.isLoggedIn, auth.isVerified, healthInfoController.updateTargetWeight)

router
    .route('/bp')
    .get(auth.isLoggedIn, auth.isVerified, healthInfoController.updateBloodPressure)

router
    .route('/sugar')
    .get(auth.isLoggedIn, auth.isVerified, healthInfoController.updateSugar)

module.exports = router