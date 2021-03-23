const User = require('./../models/user')

exports.landingPage = (request, response) => {
    console.log('GET: /')
    response.render('landing')
}

exports.home = async (request, response) => {
    console.log('GET: /home')
    let userId = request.user._id
    await User
        .findById(userId)
        .populate({ path: 'diet.food' })
        .populate({ path: 'workout.exercise' })
        .exec((err, user) => {
            if (err) console.log(err)
            else
                response.render('home', { user: user })
        })

}

exports.food = async (request, response) => {
    let userId = request.user._id
    console.log('PUT: /home/food')
    await User
        .findById(userId)
        .populate({ path: 'diet.food' })
        .exec((err, user) => {
            for (let i = 0; i < user.diet.length; ++i) {
                let flag = false
                for (let key in request.body.tick) {
                    if (user.diet[i].food._id === request.body.tick[key]) {
                        user.diet[i].check = true
                        flag = true
                    }
                }
                if (!flag) user.diet[i].check = false
            }
            user.save()
            response.redirect('/home')
        })
}

exports.exercises = async (request, response) => {
    let userId = request.user._id
    console.log('PUT: /home/exercises')
    await User
        .findById(userId)
        .populate({ path: 'workout.exercise' })
        .exec((err, user) => {
            for(let i = 0; i < user.workout.length; ++i) {
                let flag = false
                for(let key in request.body.tick) {
                    if(user.workout[i].exercise._id === request.body.tick[key]) {
                        user.workout[i].check = true
                        flag = true
                    }
                }
                if(!flag) user.workout[i].check = false
            }
            user.save()
            response.redirect('/home')
        })
}