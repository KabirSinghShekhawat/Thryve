const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const homeController = require('./../controllers/homeController')

router
    .route('/')
    .get(homeController.landingPage)

router
    .route('/home')
    .get(auth.isLoggedIn, auth.isVerified, homeController.home)

module.exports = router