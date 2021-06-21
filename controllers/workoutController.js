import Exercise from "../models/exercise";
import User from "../models/user";

export async function getWorkout (req, res) {
    const { _id: userId } = req.user;
    const exercises = await Exercise.find({});
    const user = await User.findById(userId).populate({ path: "workout.exercise" });

    return res.render("workout/index", {
        user: user,
        exercises: exercises
    });
}

export async function addNewWorkout (req, res) {
    const { _id: userId } = req.user;
    const { _id: exerciseId } = req.body.exercise;

    const user = await User.findById(userId);

    const workoutAlreadyExists = user.workout.some(workout => workout.exercise === exerciseId);

    if (workoutAlreadyExists) {
        req.flash("error", "Workout already present in checkout list.");
        return res.redirect("/workout");
    }

    const exercise = await Exercise.findById(exerciseId);
    exercise.activeUsers = exercise.activeUsers + 1;
    await exercise.save();

    const newWorkout = {
        exercise: exercise,
        duration: req.body.duration
    };

    user.workout.push(newWorkout);
    await user.save();
    return res.status(200).redirect("/workout");
}

export async function deleteWorkout (req, res) {
    const { _id: userId } = req.user;
    const { _id: exerciseId } = req.body.exercise;

    const user = await User.findById(userId);
    const idx = user.workout.findIndex(workout => workout.exercise === exerciseId);

    if (idx === -1) return res.status(404).redirect("/workout");

    user.workout.splice(idx, 1);
    await user.save();

    const exercise = await Exercise.findById(exerciseId);
    exercise.activeUsers = exercise.activeUsers - 1;
    await exercise.save();
    return res.redirect("/workout");
}

export async function editWorkout (req, res) {
    const { _id: userId } = req.user;
    const { _id: exerciseId } = req.body.exercise;

    const user = await User.findById(userId);
    const idx = user.workout.findIndex(workout => workout.exercise === exerciseId);

    user.workout[idx].duration = req.body.duration;
    await user.save();
    res.redirect("/workout");
}