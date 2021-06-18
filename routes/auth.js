const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const authController = require('./../controllers/auth/authController')

router
    .route('/')
    .post(auth.isLoggedIn, auth.isVerified, authController.register)

module.exports = router