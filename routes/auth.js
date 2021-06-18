const express = require('express')
const router = express.Router()
const passport = require("passport")

const
    auth = require('./../controllers/auth/flash'),
    authController = require('./../controllers/auth/authController'),
    adminController = require('./../controllers/auth/adminController')

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

router
    .route('/admin')
    .get(auth.isLoggedIn, auth.isVerified, adminController.getAdmin)
    .post(auth.isLoggedIn, auth.isVerified, adminController.postAdmin)

module.exports = router