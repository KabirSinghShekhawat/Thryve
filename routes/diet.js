const express = require('express');
const router = express.Router();
const auth = require('./../controllers/auth/flash')
const dietController = require('./../controllers/dietController')

router
    .route('/')
    .get(auth.isLoggedIn, auth.isVerified, dietController.getDiet)
    .post(auth.isLoggedIn, auth.isVerified, dietController.addDiet)
    .put(auth.isLoggedIn, auth.isVerified, dietController.editDiet)
    .delete(auth.isLoggedIn, auth.isVerified, dietController.removeDiet)

module.exports = router