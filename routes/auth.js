const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const authController = require('./../controllers/auth/authController')
const passport = require("passport")

const passportAuth = passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
    failureFlash: true
})

router
    .route('/register')
    .post(auth.isLoggedIn, auth.isVerified, authController.register)
router
    .route('/login')
    .post(passportAuth, authController.login)
router
    .route('/logout')
    .get(auth.isLoggedIn, auth.isVerified, authController.logout)
router
    .route('/reset/password')
    .get(authController.getPasswordReset)
    .post(authController.postNewPassword)

module.exports = router