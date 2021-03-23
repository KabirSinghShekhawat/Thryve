const Profile = require("./../models/profile")
const User = require("./../models/user")
const Exercise = require("./../models/exercise")
const Food = require("./../models/food")

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
        const diet = user.diet
        if(diet.length > 0) {
            for (let foodItem of diet) {
                await Food.findById(foodItem.food, (err, food) => {
                    if(!err) {
                        food.activeUsers = food.activeUsers - 1
                        food.save()
                    } else throw new Error(err)
                })
            }
        }

        const workouts = user.workout
        for (let workout of workouts) {
            await Exercise.findById(workout.exercise, (err, exercise) => {
                if (!err) {
                    exercise.activeUsers = exercise.activeUsers - 1
                    exercise.save()
                } else throw new Error(err)
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