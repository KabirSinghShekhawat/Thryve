const User = require('./../models/user')
const Profile = require('./../models/profile')

exports.getHealthInfo = async (req, res) => {
    const userId = req.user._id
    const user = await User.findById(userId).populate('profile')
    return res.render('healthInfo/index', {user: user})
}

exports.getWeight = async (req, res) => {
    let profileId = req.user.profile
    const weightProfile = await Profile.findById(profileId)
    return res.render("healthInfo/weight", {profile: weightProfile})
}

exports.updateTargetWeight = async (req, res) => {
    let profileId = req.user.profile;
    await Profile.findByIdAndUpdate(profileId, {
        '$set':
            {
                'targetWeight': req.body.targetWeight
            }
    })
    return res.redirect('/healthinfo')
}

exports.updateBloodPressure = async (req, res) => {
    let profileId = req.user.profile;
    const bloodPressureProfile = await Profile.findById(profileId)
    return res.render("healthInfo/bp", {profile: bloodPressureProfile})
}

exports.updateSugar = async (req, res) => {
    let profileId = req.user.profile
    const sugarProfile = await Profile.findById(profileId)
    return res.render("healthInfo/sugar", {profile: sugarProfile})
}