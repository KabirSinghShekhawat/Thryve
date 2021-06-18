const express = require('express')
const router = express.Router()
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

router
    .route('/sugar')
    .post(auth.isLoggedIn, auth.isVerified, historyController.postSugar)
    .delete(auth.isLoggedIn, auth.isVerified, historyController.deleteSugar)

module.exports = router