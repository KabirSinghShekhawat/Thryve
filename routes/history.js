const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const historyController = require('./../controllers/historyController')

router
    .route('/weight')
    .post(auth.isLoggedIn, auth.isVerified, historyController.postWeight)
    .delete(auth.isLoggedIn, auth.isVerified, historyController.deleteWeight)

router
    .route('/bp')
    .post(auth.isLoggedIn, auth.isVerified, historyController.postBloodPressure)
    .delete(auth.isLoggedIn, auth.isVerified, historyController.deleteBloodPressure)

module.exports = router