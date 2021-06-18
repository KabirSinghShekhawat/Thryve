const User = require('./../../models/user')

exports.register = async (req, res) => {
    const newUser = new User({
        username: req.body.username,
        email: req.body.email
    })

    const {password} = req.body
    const {isValidPassword, errorMessage} = validatePassword(password)
    if(!isValidPassword)

        User.register(newUser, password, function (err, user) {
            if (err) {
                console.log("Error in registeration: " + err);
                req.flash("error", err.message);
                return res.redirect("/");
            }
            passport.authenticate("local")(req, res, function () {
                req.flash("success", "Complete the verification");
                res.redirect("/otp");
            });
        });
}

function validatePassword(password) {
    if(typeof password === 'undefined' || password.length === 0) {
        req.flash('error', 'empty password')
        return res.redirect('/')
    }

    if (password !== req.body.passwordCheck) {
        req.flash("error", "Password mismatch");
        return res.redirect("/")
    }
    if (password.length < 8) {
        req.flash("error", "Password should have minimum 8 characters.")
        return res.redirect("/");
    }
}