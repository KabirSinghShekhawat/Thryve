const express = require('express');
const router = express.Router();

const auth = require('./../controllers/auth/flash')
const profileController = require('./../controllers/profileController')

router
    .route('/')
    .get(auth.isLoggedIn, auth.isVerified, profileController.getProfile)
    .post(auth.isLoggedIn, auth.isVerified, profileController.newProfile)
    .put(auth.isLoggedIn, auth.isVerified, profileController.editProfile)
    .delete(auth.isLoggedIn, auth.isVerified, profileController.deleteProfile)

router
    .route('/new')
    .get(auth.isLoggedIn, auth.isVerified, profileController.newProfilePage)

router
    .route('/edit')
    .get(auth.isLoggedIn, auth.isVerified, profileController.editProfilePage)

module.exports = router
