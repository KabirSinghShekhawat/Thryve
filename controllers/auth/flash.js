const Food = require('../../models/food')
const Exercise = require('../../models/exercise')

exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next()

    req.flash("error", "You need to be logged in to do that")
    return res.redirect("/")
}

exports.isVerified = (req, res, next) => {
    if (req.user.verified) return next()

    req.flash("error", "Verification of account is pending")
    return res.redirect("/otp")
}

exports.isAdmin = (req, res, next) => {
    if (req.user.admin) return next()

    req.flash("error", "You don't have admin privileges")
    return res.redirect("back")
}

exports.isFoodAuthorized = (req, res, next) => {
    if (req.user.admin) return next()

    const {fdid: foodId} = req.params

    Food.findById(foodId, function (err, food) {
        if (err) {
            req.flash("error", "Something went wrong")
            return res.redirect("/diet")
        }
        if (!food.verified && food.addedBy.equals(req.user._id))
            return next()

        req.flash("error", "Something went wrong")
        return res.redirect("/diet")
    })
}

exports.isExerciseAuthorized = (req, res, next) => {
    if (req.user.admin) return next()

    const {exid: exerciseId} = req.params

    Exercise.findById(exerciseId, function (err, exercise) {
        if (err) {
            req.flash("error", "Something went wrong");
            return res.redirect("/workout");
        }
        if (!exercise.verified && exercise.addedBy.equals(req.user._id))
            return next()

        req.flash("error", "Something went wrong");
        return res.redirect("/workout");
    })
}