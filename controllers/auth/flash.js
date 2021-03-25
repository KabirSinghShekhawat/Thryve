exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) return next()

	req.flash("error", "You need to be logged in to do that");
	res.redirect("/");
}

exports.isVerified = (req, res, next) => {
    if(req.user.verified) return next()

	req.flash("error", "Verification of account is pending");
	res.redirect("/otp");
}
