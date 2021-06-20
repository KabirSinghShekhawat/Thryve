const express = require('express')
const router = express.Router()

const auth = require('./../controllers/auth/flash')
const workoutController = require('./../controllers/workoutController')

router
    .route('/')
    .get(auth.isLoggedIn, auth.isVerified, workoutController.getWorkout)
    .post(auth.isLoggedIn, auth.isVerified, workoutController.addNewWorkout)
    .put(auth.isLoggedIn, auth.isVerified, workoutController.editWorkout)
    .delete(auth.isLoggedIn, auth.isVerified, workoutController.deleteWorkout)


module.exports = router
