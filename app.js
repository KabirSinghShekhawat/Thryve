// IMPORTS
const express = require("express")
const app = express().disable("x-powered-by")
const
    morgan = require("morgan"),
    expressSanitizer = require("express-sanitizer"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override")
const
    User = require("./models/user"),
    Food = require("./models/food"),
    Exercise = require("./models/exercise")

const
    workoutRoute = require('./routes/workout'),
    homeRoute = require('./routes/home'),
    profileRoute = require('./routes/profile'),
    historyRoute = require('./routes/history'),
    dietRoute = require('./routes/diet'),
    healthInfoRoute = require('./routes/healthInfo'),
    authRoute = require('./routes/auth'),
    otpRoute = require('./routes/otp')

// ENVIRONMENT SETUP

const mongoConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}

mongoose.connect("mongodb://localhost/thryve3", mongoConfig)
    .then(() => {
        console.log("connected to database")
    })
    .catch((err) => {
        throw new Error(err)
    })

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(morgan('dev'))
app.use(expressSanitizer());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

app.use(require("express-session")({
    secret: "This is the Authentication Key",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

require('dotenv').config()

//  MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/");
}

function isVerified(req, res, next) {
    if (req.user.verified) {
        return next();
    }
    req.flash("error", "Verification of account is pending");
    res.redirect("/otp");
}

function isExerciseAuthorized(req, res, next) {
    if (req.user.admin) {
        return next();
    } else {
        let exerciseId = req.params.exid;
        Exercise.findById(exerciseId, function (err, exercise) {
            if (err) {
                req.flash("error", "Something went wrong");
                res.redirect("/workout");
            } else {
                if (!exercise.verified && exercise.addedBy.equals(req.user._id)) {
                    return next();
                } else {
                    req.flash("error", "Something went wrong");
                    res.redirect("/workout");
                }
            }
        });
    }
}

function isAdmin(req, res, next) {
    if (req.user.admin) {
        return next();
    }
    req.flash("error", "You don't have admin privileges");
    res.redirect("back");
}

app.use('/', homeRoute)
app.use('/profile', profileRoute)
app.use('/history', historyRoute)
app.use('/diet', dietRoute)
app.use('/workouts', workoutRoute)
// Workout Route
// INDEX
// ADD
// REMOVE
//CHANGE
// Exercise Route
//NEW
app.get("/workout/exercise/new", isLoggedIn, isVerified, function (req, res) {
    console.log("GET: /workout/exercise/new");
    res.render("workout/new");
});
//CREATE
app.post("/workout/exercise", isLoggedIn, isVerified, function (req, res) {
    console.log("POST: /workout/exercise");
    let exercise = req.body.exercise;
    exercise.name = exercise.name.toLowerCase();
    exercise.tag = exercise.tag.toLowerCase();
    exercise.addedBy = req.user;
    // req.body.exercise.steps = req.sanitize(req.body.exercise.steps);

    Exercise.create(exercise, function (err) {
        if (err) {
            console.log(err);
            req.flash("error", "Something went wrong");
            res.redirect("/workout");
        } else {
            req.flash("success", "Successfully Submitted.");
            res.redirect("/workout");
        }
    });
});
//VERIFY
app.post("/workout/exercise/:exid/verify", isLoggedIn, isVerified, isAdmin, function (req, res) {
    let exerciseId = req.params.exid;
    Exercise.findById(exerciseId, function (err, exercise) {
        if (err) {
            console.log(err);
        } else {
            exercise.verified = true;
            exercise.verifiedBy = req.user;
            exercise.save();
            res.redirect("/workout");
        }
    });
});
//SHOW
app.get("/workout/exercise/:exid", isLoggedIn, isVerified, function (req, res) {
    let exid = req.params.exid;
    console.log("GET: /workout/exercise/" + exid);
    Exercise.findById(exid, function (err, foundExercise) {
        if (err) {
            console.log(err);
        } else {
            res.render("workout/show", {exercise: foundExercise});
        }
    });
});
//EDIT
app.get("/workout/exercise/:exid/edit", isLoggedIn, isVerified, isExerciseAuthorized, function (req, res) {
    let exid = req.params.exid;
    console.log("GET: /workout/exercise/" + exid + "/edit");
    Exercise.findById(exid, function (err, foundExercise) {
        res.render("workout/edit", {exercise: foundExercise})
    });
});
//UPDATE
app.put("/workout/exercise/:exid", isLoggedIn, isVerified, isExerciseAuthorized, function (req, res) {
    let exid = req.params.exid;
    console.log("PUT: /workout/exercise/" + exid);
    Exercise.findByIdAndUpdate(exid, req.body.exercise, function (err, updatedExercise) {
        if (err) {
            console.log(err);
            req.flash("error", "Something went wrong");
            res.redirect("/workout");
        } else {
            req.flash("success", "Update Successful");
            res.redirect("/workout/exercise/" + exid);
        }
    });
});
//DELETE
app.delete("/workout/exercise/:exid", isLoggedIn, isVerified, isExerciseAuthorized, function (req, res) {
    let exid = req.params.exid;
    console.log("DELETE: /workout/exercise/" + exid);
    Exercise.findByIdAndRemove(exid, function (err) {
        if (err) {
            console.log(err);
            req.flash("error", "Something went wrong");
            res.redirect("/workout");
        } else {
            req.flash("success", "Exercise deleted");
            User.find({}, function (err, users) {
                users.forEach(function (user) {
                    User.findById(user._id, function (err, user) {
                        let idx = undefined;
                        user.workout.find(function (w, index) {
                            {
                                if (w.food === exerciseId) {
                                    idx = index;
                                    return true;
                                }
                            }
                        });
                        if (idx !== -1) {
                            user.workout.splice(idx, 1);
                            user.save();
                        }
                    });
                });
                res.redirect("/workout");
            });
        }
    });
});

app.use('/healthinfo', healthInfoRoute)

app.get("/api", isLoggedIn, isVerified, function (req, res) {
    //console.log("GET: /api");
    let userId = req.user._id;
    User.findById(userId).populate("profile").populate({path: "diet.food"}).populate({path: "workout.exercise"}).exec(function (err, user) {
        if (err) {
            console.log(err);
        } else {
            res.send(user);
        }
    });
});

app.get("/foods/api", isLoggedIn, isVerified, function (req, res) {
    //console.log("GET: /foods/api");
    Food.find({}, function (err, foods) {
        if (err) {
            console.log("err");
        } else {
            foods.sort(function (a, b) {
                return b.activeUsers - a.activeUsers
            });
            res.send(foods);
        }
    });
});

app.get("/exercises/api", isLoggedIn, isVerified, function (req, res) {
    //console.log("GET: /exercises/api");
    Exercise.find({}, function (err, exercises) {
        if (err) {
            console.log(err);
        } else {
            exercises.sort(function (a, b) {
                return b.activeUsers - a.activeUsers
            });
            res.send(exercises);
        }
    });
});

app.use('/auth', authRoute)
app.use('/otp', otpRoute)


module.exports = app
