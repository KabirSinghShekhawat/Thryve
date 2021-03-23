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

router
    .route('/home/foods')
    .put(auth.isLoggedIn, auth.isVerified, homeController.food)

router
    .route('/home/exercises')
    .put(auth.isLoggedIn, auth.isVerified, homeController.exercises)

module.exports = router