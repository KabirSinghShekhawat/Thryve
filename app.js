//======================================================================================================================================================//
//																		IMPORTS
//======================================================================================================================================================//
var express           	  = require("express"),
	app                   = express(),
	// bodyParser            = require("body-parser"),
	morgan = require("morgan"),
	expressSantizer       = require("express-sanitizer"), 
	mongoose 	          = require("mongoose"),
	flash				  = require("connect-flash"), 
	passport              = require("passport"),
	LocalStrategy         = require("passport-local"),
	methodOverride        = require("method-override"),
	passportLocalMongoose = require("passport-local-mongoose"),
	User				  = require("./models/user"),
	Profile    			  = require("./models/profile"),
	Food				  = require("./models/food"),
	Exercise			  = require("./models/exercise"),
	async    			  = require("async"),
	nodemailer            = require("nodemailer"),
	crypto                = require("crypto")
const homeRoute = require('./routes/home')
const profileRoute = require('./routes/profile')
//======================================================================================================================================================//
//																	ENVIRONMENT SETUP
//======================================================================================================================================================//

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}

mongoose.connect("mongodb://localhost/thryve3", mongoOptions);
app.set("view engine","ejs");
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(morgan('dev'))
app.use(expressSantizer());
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

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

require('dotenv').config()
//======================================================================================================================================================//
//																	  MIDDLEWARE
//======================================================================================================================================================//
function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/");
}

function isVerified(req, res, next){
	if(req.user.verified){
		return next();
	}
	req.flash("error", "Verification of account is pending");
	res.redirect("/otp");
}

function isFoodAuthorized(req, res, next){
	if(req.user.admin){
		return next();
	}
	else{
		var foodId = req.params.fdid;
		Food.findById(foodId, function(err, food){
			if(err){
				req.flash("error", "Something went wrong");
				res.redirect("/diet");
			}
			else{
				if(!food.verified && food.addedBy.equals(req.user._id)){
					return next();
				}
				else{
					req.flash("error", "Something went wrong");
					res.redirect("/diet");
				}
			}
		});
	}
}

function isExerciseAuthorized(req, res, next){
	if(req.user.admin){
		return next();
	}
	else{
		var exerciseId = req.params.exid;
		Exercise.findById(exerciseId, function(err, exercise){
			if(err){
				req.flash("error", "Something went wrong");
				res.redirect("/workout");
			}
			else{
				if(!exercise.verified && exercise.addedBy.equals(req.user._id)){
					return next();
				}
				else{
					req.flash("error", "Something went wrong");
					res.redirect("/workout");
				}
			}
		});
	}
}

function isAdmin(req, res, next){
	if(req.user.admin){
		return next();
	}
	req.flash("error", "You don't have admin privileges");
	res.redirect("back");
}

//	HOME ROUTE
app.use('/', homeRoute)
//	PROFILE ROUTES
app.use('/profile', profileRoute)

//EDIT
// app.get("/profile/edit",isLoggedIn, isVerified, function(req, res){
// 	console.log("GET: /profile/edit");
// 	var profileId = req.user.profile;
// 	Profile.findById(profileId, function(err, foundProfile){
// 		if(err){
// 			console.log(err);
// 		}
// 		else{
// 			res.render("profile/edit", {profile: foundProfile});	
// 		}
// 	});
// });

//UPDATE
// app.put("/profile", isLoggedIn, isVerified, function(req, res){
// 	console.log("PUT: /profile");
// 	var profileId = req.user.profile;
// 	Profile.findByIdAndUpdate(profileId, req.body.profile, function(err, updatedProfile){
// 		if(err){
// 			console.log(err);
// 			req.flash("error", "Something went wrong");
// 			res.redirect("/home")
// 		}
// 		else{
// 			res.redirect("/profile");
// 		}
// 	});
// });

//DELETE
// app.delete("/profile", isLoggedIn, isVerified, function(req, res){
// 	var userId = req.user._id;
// 	var profileId = req.user.profile;
// 	Profile.findByIdAndRemove(profileId, function(err){
// 		User.findById(userId, function(err, user){
// 			user.diet.find(function(d, index){
// 				Food.findById(d.food, function(err, food){
// 					food.activeUsers = food.activeUsers - 1;
// 					food.save();
// 				});
// 			});
// 			user.workout.find(function(w, index){
// 				Exercise.findById(w.exercise, function(err, exercise){
// 					exercise.activeUsers = exercise.activeUsers -1;
// 					exercise.save();
// 				});
// 			});
// 			User.findByIdAndRemove(userId, function(err){
// 				res.redirect("/");
// 			});
// 		});
// 	});
// });

//	HISTORY SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//ADD WEIGHT
app.post("/history/weight", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /history/weight");
	var profileId = req.user.profile;
	Profile.findByIdAndUpdate(profileId, {'$set': {'weight': req.body.data}}, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			var object = {
				weight: req.body.data,
				timestamp: new Date(Date.now())
			}
			foundProfile.weightHist.push(object);
			foundProfile.save();
			res.redirect("/healthinfo");
		}
	});
});

//REMOVE WEIGHT
app.delete("/history/weight", function(req, res){
	console.log("DELETE: /history/weight");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, profile){
		if(err){
			console.log(err);
		}
		else{
			var ts = new Date(req.body.timestamp).toISOString();
			var idx  = -1;
			profile.weightHist.find(function(w, index){
				var timestamp = new Date(new Date(w.timestamp).setMilliseconds(000)).toISOString();
				if( timestamp == ts){
					idx = index;
				}
			});
			if(profile.weightHist.length > 1 && idx != -1){
				profile.weightHist.splice(idx, 1);
				profile.weight = profile.weightHist[profile.weightHist.length - 1].weight;
				profile.save();
				res.redirect("/healthinfo");
			}
			else if(profile.weightHist.length == 1){
				req.flash("error", "Weight History cannot be empty. Please add a data to delete.");
				res.redirect("/healthinfo/weight");
			}
			else{
				req.flash("error", "Something went wrong");
				res.redirect("/healthinfo");
			}
		}
	});
});

//ADD BP
app.post("/history/bp", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /history/bp");
	var profileId = req.user.profile;
	Profile.findByIdAndUpdate(profileId, {'$set': {'bp': req.body.bp}}, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			var object = {
				bp: req.body.bp,
				timestamp: new Date(Date.now())
			}
			foundProfile.bpHist.push(object);
			foundProfile.save();
			res.redirect("/healthinfo");
		}
	});
});

//REMOVE BP
app.delete("/history/bp", function(req, res){
	console.log("DELETE: /history/bp");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, profile){
		if(err){
			console.log(err);
		}
		else{
			var ts = new Date(req.body.timestamp).toISOString();
			var idx  = -1;
			profile.bpHist.find(function(b, index){
				var timestamp = new Date(new Date(b.timestamp).setMilliseconds(000)).toISOString();
				if( timestamp == ts){
					idx = index;
				}
			});
			if(profile.bpHist.length > 1 && idx != -1){
				profile.bpHist.splice(idx, 1);
				profile.bp = profile.bpHist[profile.bpHist.length - 1].bp;
				profile.save();
				res.redirect("/healthinfo");
			}
			else if(profile.bpHist.length == 1){
				req.flash("error", "Blood Pressure History cannot be empty. Please add a data to delete.");
				res.redirect("/healthinfo/bp");
			}
			else{
				req.flash("error", "Something went wrong");
				res.redirect("/healthinfo");
			}
		}
	});
});

//ADD SUGAR
app.post("/history/sugar", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /history/sugar");
	var profileId = req.user.profile;
	Profile.findByIdAndUpdate(profileId, {'$set': {'sugar': req.body.sugar}}, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			var object = {
				sugar: req.body.sugar,
				timestamp: new Date(Date.now())
			}
			foundProfile.sugarHist.push(object);
			foundProfile.save();
			res.redirect("/healthinfo");
		}
	});
});

//REMOVE SUGAR
app.delete("/history/sugar", function(req, res){
	console.log("DELETE: /history/sugar");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, profile){
		if(err){
			console.log(err);
		}
		else{
			var ts = new Date(req.body.timestamp).toISOString();
			var idx  = -1;
			profile.sugarHist.find(function(s, index){
				var timestamp = new Date(new Date(s.timestamp).setMilliseconds(000)).toISOString();
				if( timestamp == ts){
					idx = index;
				}
			});
			if(profile.sugarHist.length > 1 && idx != -1){
				profile.sugarHist.splice(idx, 1);
				profile.sugar = profile.sugarHist[profile.sugarHist.length - 1].sugar;
				profile.save();
				res.redirect("/healthinfo");
			}
			else if(idx == 0){
				req.flash("error", "Blood Sugar History cannot be empty. Please add a data to delete.");
				res.redirect("/healthinfo/sugar");
			}
			else{
				req.flash("error", "Something went wrong");
				res.redirect("/healthinfo");
			}
		}
	});
});
//	DIET ROUTES
//------------------------------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------------------------------------------------------------//

//INDEX
app.get("/diet", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /diet");
	Food.distinct('categoryTag', function(err, categories){
		var userId = req.user._id;
		var nameQuery;
		var categoryQuery = [];
		var proteinQuery;
		var fatQuery;
		var carbohydratesQuery;
		var perPage = 6;
		var pageQuery = parseInt(req.query.page);
		var pageNumber = pageQuery ? pageQuery : 1;

		//search query
		if(!req.query.search){
			nameQuery = new RegExp(AnyExp(""), 'gi');
		}
		else{
			nameQuery = new RegExp(StrCmpExp(req.query.search), 'gi');
		}
		
		//category query
		if(req.query.tags){
			for(var key in req.query.tags){
				categoryQuery.push(new RegExp(StrCmpExp(req.query.tags[key]), 'gi'));
			}
		}
		if(categoryQuery.length == 0){
			categoryQuery.push(new RegExp(AnyExp(""), 'gi'));
		}

		//nutrients query
		if(req.query.proteinTag){
			proteinQuery = new RegExp(StrCmpExp(req.query.proteinTag), 'gi');
		}
		else{
			proteinQuery =  new RegExp(AnyExp(""), 'gi');
		}
		if(req.query.fatTag){
			fatQuery = new RegExp(StrCmpExp(req.query.fatTag), 'gi');
		}
		else{
			fatQuery =  new RegExp(AnyExp(""), 'gi');
		}
		if(req.query.carbohydratesTag){
			carbohydratesQuery = new RegExp(StrCmpExp(req.query.carbohydratesTag), 'gi');
		}
		else{
			carbohydratesQuery =  new RegExp(AnyExp(""), 'gi');
		}

		Food.find({name: nameQuery, categoryTag: {$in: categoryQuery}, proteinTag: proteinQuery, fatTag: fatQuery, carbohydratesTag: carbohydratesQuery}).skip(perPage*pageNumber - perPage).limit(perPage).exec(function(err, allFood){
			Food.count({name: nameQuery, categoryTag: {$in: categoryQuery}, proteinTag: proteinQuery, fatTag: fatQuery, carbohydratesTag: carbohydratesQuery}).exec(function(err, count){
				if(err){
					console.log(err);
				}
				else{
					User.findById(userId).populate({path: "diet.food"}).exec(function(err, foundUser){
						if(err){
							console.log(err);
						}
						else{
							
							res.render("diet/index", {
								user:foundUser,
								foods:allFood,
								categories: categories,
								current: pageNumber,
								pages: Math.ceil(count/perPage),
								search: req.query.search,
								tags: req.query.tags,
								proteinTag: req.query.proteinTag,
								fatTag: req.query.fatTag,
								carbohydratesTag: req.query.carbohydratesTag
							});
						}
					});
				}
			});
		});
	});
});

//ADD
app.post("/diet", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /diet");
	var userId = req.user._id;
	var foodId = req.body.food._id;
	User.findById(userId, function(err, user){
		if(err){
			console.log("User not found: " + err);
		}
		else{
			var isThere = false;
			user.diet.find(function(d, index){
					if(d.food == foodId){
						isThere = true;
						return true;
					}
			});
			if(!isThere){
				Food.findById(foodId, function(err, food){
					if(err){
						console.log("Food not found: " + err);
					}
					else{
						food.activeUsers = food.activeUsers + 1;
						food.save();
						var obj = {
							food: food,
							quantity : req.body.quantity
						}
						user.diet.push(obj);
						user.save();
						res.redirect("/diet");
					}
				});
			}
			else{
				req.flash("error", "Already present in Checkout List");
				res.redirect("/diet");
			}
		}
	});
});

//REMOVE
app.delete("/diet", isLoggedIn, isVerified, function(req, res){
	console.log("DELETE: /diet");
	var userId = req.user._id;
	var foodId = req.body.foodInDiet._id;
	User.findById(userId, function(err, user){
		var idx = undefined;
		user.diet.find(function(d, index){
			{
				if(d.food == foodId){
					idx = index;
					return true;
				}
			}
		});
		if(idx!==-1){
			user.diet.splice(idx, 1);
			user.save();
			Food.findById(foodId, function(err, food){
				food.activeUsers = food.activeUsers - 1;
				food.save();
				res.redirect("/diet");
			});
		}
	});
});

//CHANGE
app.put("/diet", isLoggedIn, isVerified, function(req, res){
	console.log("PUT: /diet");
	var userId = req.user._id;
	var foodId = req.body.foodInDiet._id;
	User.findById(userId, function(err, user){
		var idx = undefined;
		user.diet.find(function(d, index){
			{
				if(d.food == foodId){
					idx = index;
					return true;
				}
			}
		});
		user.diet[idx].quantity = req.body.quantity;
		user.save();
		res.redirect("/diet");
	});
});

//	FOOD SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//NEW
app.get("/diet/food/new",isLoggedIn, isVerified, function(req, res){
	console.log("GET: /diet/food/new");
	Food.distinct('categoryTag', function(err, categories){
		res.render("diet/new", {categories: categories});
	});
});

//CREATE
app.post("/diet/food",isLoggedIn, isVerified, function(req, res){
    console.log("POST: /diet/food");
    var food = req.body.food;
	food.name = food.name.toLowerCase();
	food.categoryTag = food.categoryTag.toLowerCase();
	food.proteinTag = food.proteinTag.toLowerCase();
	food.fatTag = food.fatTag.toLowerCase();
	food.carbohydratesTag = food.carbohydratesTag.toLowerCase();
	food.energy.unit = food.energy.unit.toLowerCase();
	food.nutrients.protein.unit = food.nutrients.protein.unit.toLowerCase();
	food.nutrients.fat.unit = food.nutrients.fat.unit.toLowerCase();
	food.nutrients.carbohydrates.unit = food.nutrients.carbohydrates.unit.toLowerCase();
	food.addedBy = req.user;
	Food.create(food, function(err, inputFood){
	    if(err){
			console.log(error);
			req.flash("error", "Something went wrong");
			res.redirect("/diet");
		}
		else{
	    	req.flash("success", "Successfully Submitted.");
			res.redirect("/diet");
		}
	});                     
});

//VERIFY
app.post("/diet/food/:fdid/verify", isLoggedIn, isVerified, isAdmin, function(req, res){
	var foodId = req.params.fdid;
	Food.findById(foodId, function(err, food){
		if(err){
			console.log(err);
		}
		else{
			food.verified = true;
			food.verifiedBy = req.user;
			food.save();
			res.redirect("/diet");
		}
	});
});

//EDIT
app.get("/diet/food/:fdid/edit", isLoggedIn, isVerified, isFoodAuthorized, function(req, res){
	var foodId = req.params.fdid;
	console.log("/diet/food/" + foodId + "/edit");
	Food.findById(foodId, function(err, food){
		if(err){
			console.log(err);
		}
		else{
			res.render("diet/edit", {food:food});
		}
	});
});

//UPDATE
app.put("/diet/food/:fdid", isLoggedIn, isVerified, isFoodAuthorized, function(req, res){
	var foodId = req.params.fdid;
	Food.findByIdAndUpdate(foodId, req.body.food, function(err, updatedFood){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/diet");
		}
		else{
			req.flash("success", "Update Successful");
			res.redirect("/diet");
		}
	})
});

//DELETE
app.delete("/diet/food/:fdid", isLoggedIn, isVerified, isFoodAuthorized, function(req, res){
	var foodId = req.params.fdid;
	Food.findByIdAndRemove(foodId, function(err){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/diet");
		}
		else{
			req.flash("success", "Food deleted");
			User.find({}, function(err, users){
				users.forEach(function(user){
					User.findById(user._id, function(err, user){
						var idx = undefined;
						user.diet.find(function(d, index){
							{
								if(d.food == foodId){
									idx = index;
									return true;
								}
							}
						});
						if(idx!==-1){
							user.diet.splice(idx, 1);
							user.save();
						}
					});
				});
				res.redirect("/diet");
			});
		}
	});
});

//	WORKOUT ROUTES
//------------------------------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------------------------------------------------------------//

//INDEX 
app.get("/workout", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /workout");
	var userId = req.user._id;
	Exercise.find({}, function(err, allExercises){
		if(err){
			console.log(err);
		}
		else{
			User.findById(userId).populate({path: "workout.exercise"}).exec(function(err, foundUser){
				if(err){
					console.log(err);
				}
				else{
					res.render("workout/index", {
						user: foundUser,
						exercises: allExercises
					});
				}
			});
			
		}
	});
});

//ADD
app.post("/workout", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /workout");
	var userId = req.user._id;
	var exerciseId = req.body.exercise._id;
	User.findById(userId, function(err, user){
		if(err){
			console.log("User not found: " + err);
		}
		else{
			var isThere = false;
			user.workout.find(function(w, index){
				{
					if(w.exercise == exerciseId){
						isThere = true;
						return true;
					}
				}
			});
			if(!isThere){
				Exercise.findById(exerciseId, function(err, exercise){
					if(err){
						console.log("Exercise not found: " + err);
					}
					else{
						exercise.activeUsers = exercise.activeUsers + 1;
						exercise.save();
						var obj = {
							exercise: exercise,
							duration: req.body.duration 
						}
						user.workout.push(obj);
						user.save();
						res.redirect("/workout");
					}
				});
			}
			else{
				req.flash("error", "Already present in Checkout List");
				res.redirect("/workout");	
			}
		}
	});
});

//REMOVE
app.delete("/workout", isLoggedIn, isVerified, function(req, res){
	console.log("DELETE: /workout");
	var userId = req.user._id;
	var exerciseId = req.body.exercise._id;
	User.findById(userId, function(err, user){
		var idx = undefined;
		user.workout.find(function(w, index){
			{
				if(w.exercise == exerciseId){
					idx = index;
					return true;
				}
			}
		});
		if(idx!==-1){
			user.workout.splice(idx, 1);
			user.save();
			Exercise.findById(exerciseId, function(err, exercise){
				exercise.activeUsers = exercise.activeUsers - 1;
				exercise.save();
				res.redirect("/workout");
			});
		}
	}); 
});

//CHANGE
app.put("/workout", isLoggedIn, isVerified, function(req, res){
	console.log("PUT: /workout");
	var userId = req.user._id;
	var exerciseId = req.body.exercise._id;
	User.findById(userId, function(err, user){
		var idx = undefined;
		user.workout.find(function(w, index){
			{
				if(w.exercise == exerciseId){
					idx = index;
					return true;
				}
			}
		});
		user.workout[idx].duration = req.body.duration;
		user.save();
		res.redirect("/workout");
	});
});


//	EXERCISE SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//NEW
app.get("/workout/exercise/new", isLoggedIn, isVerified, function(req,res){
	console.log("GET: /workout/exercise/new");
	res.render("workout/new");
});

//CREATE
app.post("/workout/exercise", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /workout/exercise");
	var exercise = req.body.exercise;
	exercise.name = exercise.name.toLowerCase();
	exercise.tag = exercise.tag.toLowerCase();
	exercise.addedBy = req.user;
	// req.body.exercise.steps = req.sanitize(req.body.exercise.steps);

	Exercise.create(exercise, function(err, exercise){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/workout");
		}
		else{
			req.flash("success", "Successfully Submitted.");
			res.redirect("/workout");
		}
	});
});

//VERIFY
app.post("/workout/exercise/:exid/verify", isLoggedIn, isVerified, isAdmin, function(req, res){
	var exerciseId = req.params.exid;
	Exercise.findById(exerciseId, function(err, exercise){
		if(err){
			console.log(err);
		}
		else{
			exercise.verified = true;
			exercise.verifiedBy = req.user;
			exercise.save();
			res.redirect("/workout");
		}
	});
});

//SHOW
app.get("/workout/exercise/:exid", isLoggedIn, isVerified, function(req,res){
	var exid = req.params.exid; 
	console.log("GET: /workout/exercise/" + exid);
	Exercise.findById(exid, function(err, foundExercise){
		if(err){
			console.log(err);
		}
		else{
			res.render("workout/show", {exercise: foundExercise});
		}
	});
});

//EDIT
app.get("/workout/exercise/:exid/edit", isLoggedIn, isVerified, isExerciseAuthorized, function(req, res){
	var exid = req.params.exid;
	console.log("GET: /workout/exercise/" + exid + "/edit");
	Exercise.findById(exid, function(err, foundExercise){
		res.render("workout/edit", {exercise: foundExercise})
	});
});

//UPDATE
app.put("/workout/exercise/:exid", isLoggedIn, isVerified, isExerciseAuthorized, function(req, res){
	var exid = req.params.exid;
	console.log("PUT: /workout/exercise/" + exid);
	Exercise.findByIdAndUpdate(exid, req.body.exercise, function(err, updatedExercise){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/workout");
		}
		else{
			req.flash("success", "Update Successful");
			res.redirect("/workout/exercise/" + exid);
		}
	});
});

//DELETE
app.delete("/workout/exercise/:exid", isLoggedIn, isVerified, isExerciseAuthorized, function(req, res){
	var exid = req.params.exid;
	console.log("DELETE: /workout/exercise/" + exid);
	Exercise.findByIdAndRemove(exid, function(err){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/workout");
		}
		else{
			req.flash("success", "Exercise deleted");
			User.find({}, function(err, users){
				users.forEach(function(user){
					User.findById(user._id, function(err, user){
						var idx = undefined;
						user.workout.find(function(w, index){
							{
								if(w.food == exerciseId){
									idx = index;
									return true;
								}
							}
						});
						if(idx!==-1){
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

//	HEALTHINFO ROUTES
//------------------------------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------------------------------------------------------------//

//INDEX
app.get("/healthinfo", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /healthinfo");
	var userId = req.user._id;
	User.findById(userId).populate("profile").exec(function(err, user){
		if(err){
			console.log(err);
		}
		else{
			res.render("healthInfo/index", {user: user});
		}
	});
});

//WEIGHT EDIT
app.get("/healthinfo/weight", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /healthinfo/weight");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			res.render("healthInfo/weight", {profile: foundProfile});
		}
	});
});

//UPDATE TARGET WEIGHT
app.post("/healthinfo/targetweight", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /history/targetweight");
	var profileId = req.user.profile;
	Profile.findByIdAndUpdate(profileId, {'$set': {'targetWeight': req.body.targetWeight}}, function(err){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
		}
		res.redirect("/healthinfo");
	});
});


//WEIGHT EDIT
app.get("/healthinfo/bp", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /healthinfo/bp");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			res.render("healthInfo/bp", {profile: foundProfile});
		}
	});
});

//WEIGHT EDIT
app.get("/healthinfo/sugar", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /healthinfo/sugar");
	var profileId = req.user.profile;
	Profile.findById(profileId, function(err, foundProfile){
		if(err){
			console.log(err);
		}
		else{
			res.render("healthInfo/sugar", {profile: foundProfile});
		}
	});
});
//	TEMPORARY API ROUTES
//------------------------------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------------------------------------------------------------//

app.get("/api",isLoggedIn, isVerified, function(req, res){
	//console.log("GET: /api");
	var userId = req.user._id;
	User.findById(userId).populate("profile").populate({path: "diet.food"}).populate({path: "workout.exercise"}).exec(function(err, user){
		if(err){
			console.log(err);
		}
		else{
			res.send(user);
		}
	});
});

app.get("/foods/api", isLoggedIn, isVerified, function(req, res){
	//console.log("GET: /foods/api");
	Food.find({}, function(err, foods){
		if(err){
			console.log("err");
		}
		else{
			foods.sort(function(a, b){return b.activeUsers - a.activeUsers});
			res.send(foods);
		}
	});
});

app.get("/exercises/api", isLoggedIn, isVerified, function(req, res){
	//console.log("GET: /exercises/api");
	Exercise.find({}, function(err, exercises){
		if(err){
			console.log(err);
		}
		else{
			exercises.sort(function(a, b){return b.activeUsers - a.activeUsers});
			res.send(exercises);
		}
	});
});
//	AUTHENTICATION ROUTES
//------------------------------------------------------------------------------------------------------------------------------------------------------//
//------------------------------------------------------------------------------------------------------------------------------------------------------//

//REGISTER
app.post("/register", function(req, res){
	console.log("POST: /register");
	var newUser = new User(
		{
			username: req.body.username,
			email: req.body.email
		}
	);
	if(req.body.password !== req.body.passwordCheck)
	{
		req.flash("error", "Password mismatch");
		res.redirect("/")
	}
	else if(req.body.password.length < 8){
		req.flash("error", "Password should have minimum 8 characters.")
		res.redirect("/");
	}
	else{
		User.register(newUser, req.body.password, function(err, user){
			if(err){
				console.log("Error in registeration: " + err);
				req.flash("error", err.message);
				return res.redirect("/");
			}
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Complete the verification");
				res.redirect("/otp");
			});
		});
	}
});

//LOGIN
app.post("/login", passport.authenticate("local",
	{
		successRedirect: "/home",
		failureRedirect: "/",
		failureFlash: true
	}), function(req, res){	
});

//LOGOUT
app.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Successfully logged out");
	res.redirect("/");
});

//	OTP SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//INDEX
app.get("/otp",isLoggedIn, function(req, res){
	console.log("GET: /otpcheck");
	res.render("mailerOtp");
});

//CREATE
app.post('/otp', isLoggedIn, function(req, res) {
	var otp = Math.floor(100000 + Math.random() * 900000);
	User.findOne({email: req.user.email}, function(err, user){
		user.otp = otp;
		user.otpExpires = Date.now() + 3600000;
		user.save();
		var smtpTransport = nodemailer.createTransport({
			service: 'Gmail', 
			auth: {
			  user: process.env.NODEMAILER_USER,
			//   user: 'progamerdead100@gmail.com',
			  pass: process.env.NODEMAILER_PASS
			//   pass: "ljawgraopfjepuqz"
			}
	  	});
		var mailOptions = {
				to: req.user.email,
				from: process.env.NODEMAILER_USER,
				subject: 'Verification',
				text: 'Thank you for registering.\nPlease complete the verification process.\n\n' +
				'OTP: ' + otp
		};
		smtpTransport.sendMail(mailOptions, function(err) {
				console.log('mail sent');
				req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
				res.redirect("/otpcheck");
		});
	});
});

//ENTER
app.get("/otpcheck", isLoggedIn, function(req, res){
	console.log("GET: /otpcheck");
	res.render("otpcheck");
});

//CHECK
app.post("/otpcheck", isLoggedIn, function(req, res){
	User.findOne({email: req.user.email, otpExpires: {$gt: Date.now()}}, function(err, user){
		if(!user){
			req.flash("error", "OTP invalid or expired.");
			return res.redirect("/otp");
		}

		if(user.otp === req.body.otp){
			user.verified = true;
			user.otp = undefined;
			user.otpExpires = undefined;
			user.save();
			req.flash("success", "Verification completed. Please complete your profile.")
			res.redirect("/profile/new");
		}
		else{
			user.otp = undefined;
			user.otpExpires = undefined;
			req.flash("error", "OTP invalid");
			res.redirect("/otp");
		}
	});
});

//	PASSWORD RESET SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//ENTER
app.get("/passwordreset", function(req, res){
	console.log("GET: /passwordreset");
	res.render("mailer");
});

//CREATE
app.post('/passwordreset', function(req, res, next) {
	async.waterfall([
	  	function(done) {
			crypto.randomBytes(20, function(err, buf) {
		  		var token = buf.toString('hex');
		 	 done(err, token);
			});
	  	},
	  	function(token, done) {
			User.findOne({ email: req.body.email }, function(err, user) {
		  		if (!user) {
					req.flash('error', 'No account with that email address exists.');
					return res.redirect('/passwordreset');
		  		}
  
		  		user.resetPasswordToken = token;
		  		user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
		  		user.save(function(err) {
					done(err, token, user);
		  		});
			});
	  	},
	  	function(token, user, done) {
			var smtpTransport = nodemailer.createTransport({
		  		service: 'Gmail', 
		  		auth: {
					user: 'contact.thryve.health@gmail.com',
					pass: "********"
		  		}
			});
			var mailOptions = {
		  		to: user.email,
		  		from: 'contact.thryve.health@gmail.com',
		  		subject: 'Password Reset',
		  		text: 'You are receiving this because you have requested the reset of the password for your account.\n\n' +
					'Please click on the following link to complete the process:\n\n' +
					'http://' + req.headers.host + '/reset/' + token + '\n\n' +
					'If you did not request this, please ignore this email and your password will remain unchanged.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
		  		console.log('mail sent');
		  		req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
		  		done(err, 'done');
			});
	  	}
	], 
	function(err){
		if (err) return next(err);
	  	res.redirect('back');
	});
});

//TOKEN LINK
app.get("/reset/:token", function(req, res){
	User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
		if(!user){
			req.flash("error",  "Password reset token is invalid or expired.");
			return res.redirect('back');
		}

		res.render("reset", {token: req.params.token});
	});
});

//UPDATE
app.post('/reset/:token', function(req, res) {
	async.waterfall([
		function(done) {
			User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		  		if (!user) {
					req.flash('error', 'Password reset token is invalid or has expired.');
					return res.redirect('back');
		  		}
		  		if(req.body.password === req.body.confirm) {
					user.setPassword(req.body.password, function(err) {
			  			user.resetPasswordToken = undefined;
			  			user.resetPasswordExpires = undefined;
  
			  			user.save(function(err) {
							req.logIn(user, function(err) {
				  				done(err, user);
							});
			 		 	});
					})
				} 
				else {
			  		req.flash("error", "Passwords do not match.");
			  		return res.redirect('back');
		  		}
			});
	  	},
	  	function(user, done) {
			var smtpTransport = nodemailer.createTransport({
		  		service: 'Gmail', 
		  		auth: {
					user: 'contact.thryve.health@gmail.com',
					pass: "********"
		  		}
			});
			var mailOptions = {
		  		to: user.email,
		  		from: 'contact.thryve.health@gmail.com',
		  		subject: 'Your password has been changed',
		  		text: 'Hello,\n\n' +
					'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
			};
			smtpTransport.sendMail(mailOptions, function(err) {
		  		req.flash('success', 'Success! Your password has been changed.');
		  		done(err);
			});
	  	}
	], 
	function(err) {
	  	res.redirect('/home');
	});
});

//	ADMIN REGISTRATION SUBDIVISION
//------------------------------------------------------------------------//
//------------------------------------------------------------------------//

//FORM
app.get("/applyadmin", isLoggedIn, isVerified, function(req, res){
	console.log("GET: /applyadmin");
	res.render("keyForm");
});

//CREATE
app.post("/applyadmin", isLoggedIn, isVerified, function(req, res){
	console.log("POST: /applyadmin");
	var userId = req.user._id;
	var key="abcxyz@123";
	if(key===req.body.key){
		User.findById(userId, function(err, user){
			if(err){
				console.log(err);
				req.flash("error", "Something went wrong");
				res.redirect("/home");
			}
			else{
				user.admin = true;
				user.save();
				req.flash("success", "You are now an Admin User");
				res.redirect("/home");
			}
		});
	}
	else{
		req.flash("error", "Incorrect Key. Admin privileges denied.");
		res.redirect("/home");
	}

});

//======================================================================================================================================================//
//																		FUNCTIONS
//======================================================================================================================================================//
function StrCmpExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

function AnyExp(text) {
    return text.replace(text, ".*");
};

module.exports = app;
