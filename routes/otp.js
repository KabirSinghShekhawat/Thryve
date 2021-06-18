const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const otpController = require('./../controllers/auth/otpController')
const passport = require("passport")

const passportAuth = passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
    failureFlash: true
})

router
    .route('/')
    .get(auth.isLoggedIn, otpController.getOtp)
    .post(auth.isLoggedIn, otpController)
router
    .route('/check')
    .get(auth.isLoggedIn, otpController.getOtpCheck)
    .post(auth.isLoggedIn, otpController.postOtpCheck)