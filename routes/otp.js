const express = require('express')
const router = express.Router()
const auth = require('./../controllers/auth/flash')
const otpController = require('./../controllers/auth/otpController')

router
    .route('/')
    .get(auth.isLoggedIn, otpController.getOtp)
    .post(auth.isLoggedIn, otpController.sendOtp)
router
    .route('/check')
    .get(auth.isLoggedIn, otpController.getOtpCheck)
    .post(auth.isLoggedIn, otpController.postOtpCheck)

module.exports = router