const User = require('./../models/user')

exports.landingPage = (request, response) => {
    console.log("GET: /")
    response.render('landing')
}

exports.home = async (request, response) => {
    console.log("GET: /home")
    let userId = request.user._id
    await User
        .findById(userId)
        .populate({ path: "diet.food" })
        .populate({ path: "workout.exercise" })
        .exec((err, user) => {
            if (err) console.log(err)
            else
                response.render("home", { user: user })
        })

}