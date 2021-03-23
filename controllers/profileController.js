const Profile = require("./../models/profile")
const User = require("./../models/user")
const Exercise = require("./../models/exercise")
const Foods = require("./../models/food")

exports.getProfile = async (request, response) => {
    const { profile: id } = request.user;
    try {
        const profile = await Profile.findById(id)
        response.render('profile/show', { profile: profile })
    } catch (err) {
        if (err) response.redirect('/home')
        throw new Error(err)
    }
}

exports.newProfilePage = (request, response) => {
    console.log('GET: /profile/new')
    response.render('profile/new')
}

exports.newProfile = async (request, response) => {
    const { _id: id } = request.user
    const { profile } = request.body
    await Profile
        .create(profile, (err, newProfile) => {
            if (err) throw new Error(err)
            else {
                const currentWeight = {
                    weight: profile.weight,
                    timestamp: new Date(Date.now())
                }
                const height = profile.height.magnitude
                const targetWeight = ((height / 100) * (height / 100) * 24).toFixed(2)

                newProfile.weightHist.push(currentWeight)
                newProfile.targetWeight = Number(targetWeight)
                newProfile.save()
                User.findById(id, (err, foundUser) => {
                    if (err) throw new Error(err)
                    else {
                        foundUser.profile = newProfile
                        foundUser.save()
                        response.redirect('/home')
                    }
                })
            }
        })
}

exports.editProfilePage = async (request, response) => {
    const { profile: id } = request.user

    try {
        const profile = await Profile.findById(id)
        response.render('profile/edit', { profile: profile })
    } catch (err) {
        throw new Error(err)
    }
}

exports.editProfile = async (request, response) => {
    const { profile: id } = request.user
    try {
        await Profile.findByIdAndUpdate(id, request.body.profile)
        response.redirect('/profile')
    } catch (err) {
        if (err)
            request.flash('Something went wrong.')
        response.redirect('/home')
        throw new Error(err)
    }
}

exports.deleteProfile = async (request, response) => {
    const { _id: userId } = request.user
    const { profile: profileId } = request.user

    try {
        const user = await User.findById(userId)
        console.log(user)
        user.diet.find("food")
        .then(foodItems => {
            console.log('Food items \n' + foodItems)
        })
        // const foodItems = user.diet
        if(foodItems.length > 0) {
            for (let food of foodItems) {
                await Food.findById(food.food, (err, food) => {
                    food.activeUsers = food.activeUsers - 1
                    food.save()
                    if(err) console.log(err + ' in food items mein')
                })
            }
        }

        const workouts = await user.workout.find({})
        console.log(workouts)
        for (let workout of workouts) {
            await Exercise.findById(workout.workout, (err, exercise) => {
                if (!err) {
                    exercise.activeUsers = exercise.activeUsers - 1
                    exercise.save()
                } else console.log('error in workout')
            })
        }
        await Profile.findByIdAndRemove(profileId)
        await User.findByIdAndRemove(userId, (err) => {
            if (!err)
                response.redirect('/')
            else throw new Error(err)
        })
    } catch (err) {
        throw new Error(err)
    }
}