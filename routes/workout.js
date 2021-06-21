import * as express from "express";
import * as auth from "../controllers/auth/flash";
import * as workoutController from "../controllers/workoutController";

const router = express.Router();

router
    .route("/")
    .get(auth.isLoggedIn, auth.isVerified, workoutController.getWorkout)
    .post(auth.isLoggedIn, auth.isVerified, workoutController.addNewWorkout)
    .put(auth.isLoggedIn, auth.isVerified, workoutController.editWorkout)
    .delete(auth.isLoggedIn, auth.isVerified, workoutController.deleteWorkout);

export default router;