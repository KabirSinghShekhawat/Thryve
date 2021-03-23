const Profile = require("./../models/profile")

exports.postWeight = async (req, res) => {
    const { profile: id } = req.user
    const weight = req.body.data
    try {
        await Profile.findByIdAndUpdate(id, { '$set': { 'weight': weight } })
        const profile = await Profile.findById(id)
        const newWeight = {
            weight: req.body.data,
            timestamp: new Date(Date.now())
        }
        profile.weightHist.push(newWeight)
        await profile.save()
        res.redirect('/healthinfo')
    } catch (err) {
        throw new Error(err)
    }
}

exports.deleteWeight = async (req, res) => {
    const { profile: id } = req.user
    try {
        const profile = await Profile.findById(id)
        const timeStampISOString = new Date(req.body.timestamp).toISOString()

        let idx = -1

        profile.weightHist.find(function (w, index) {
            let timestamp = new Date(new Date(w.timestamp)
                .setMilliseconds(000))
                .toISOString();
            if (timestamp === timeStampISOString) idx = index
        })

        if(profile.weightHist.length > 1 && idx !== -1) {
            profile.weightHist.splice(idx, 1)
            profile.weight = profile.weightHist[profile.weightHist.length - 1].weight
            await profile.save()
            res.redirect('/healthinfo')
        } else if (profile.weightHist.length === 1) {
            req.flash('error', 'Weight history cannot be empty. Please add some weight to delete.')
            res.redirect('/healthinfo/weight')
        } else {
            req.flash('error', 'Something went wrong')
            res.redirect('/healthinfo')
        }

    } catch (err) {
        throw new Error(err)
    }
}

exports.postBloodPressure = async (req, res) => {
    const { profile: id } = req.user
    try {
        await Profile.findByIdAndUpdate(id, {'$set' : {'bp' : req.body.bp}})
        const profile = await Profile.findById(id)
        const newBP = {
            bp: req.body.bp,
            timestamp: new Date(Date.now())
        }
        profile.bpHist.push(newBP)
        await profile.save()
        res.redirect('/healthinfo')
    } catch (err) {
        throw new Error(err)
    }
}

exports.deleteBloodPressure = async (req, res) => {
    const { profile: id } = req.user
    try {
        const profile = await Profile.findById(id)
        const timeStampISOString = new Date(req.body.timestamp).toISOString()

        let idx = -1

        profile.bpHist.find(function (w, index) {
            let timestamp = new Date(new Date(w.timestamp)
                .setMilliseconds(000))
                .toISOString();
            if (timestamp === timeStampISOString) idx = index
        })

        if(profile.bpHist.length > 1 && idx !== -1) {
            profile.bpHist.splice(idx, 1)
            profile.bp = profile.bpHist[profile.bpHist.length - 1].bp
            await profile.save()
            res.redirect('/healthinfo')
        } else if (profile.bpHist.length === 1) {
            req.flash('error', 'Blood Pressure history cannot be empty. Please add some weight to delete.')
            res.redirect('/healthinfo/bp')
        } else {
            req.flash('error', 'Something went wrong')
            res.redirect('/healthinfo')
        }

    } catch (err) {
        throw new Error(err)
    }
}