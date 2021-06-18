const User = require('./../../models/user')
const nodemailer = require('nodemailer')

exports.getOtp = (req, res) => {
    return res.render("mailerOtp")
}

exports.sendOtp = async (req, res) => {
    const otp = Math.floor(100000 + Math.random() * 900000)
    const user = await User.findOne({email: req.user.email})

    user.otp = otp
    user.otpExpires = Date.now() + 3600000
    await user.save()

    const smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS
        }
    })

    const mailOptions = {
        to: req.user.email,
        from: process.env.NODEMAILER_USER,
        subject: 'Verification',
        text: 'Thank you for registering.\n' +
            'Please complete the verification process.\n\n' +
            'OTP: ' + otp
    }

    smtpTransport.sendMail(mailOptions, () => {
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.')
        return res.redirect('/otp/check')
    })
}

exports.getOtpCheck = (req, res) => {
    return res.render('check_otp')
}

exports.postOtpCheck = async (req, res) => {
    const user = await User.findOne({
        email: req.user.email,
        otpExpires: {
            $gt: Date.now()
        }
    })

    if (!user) {
        req.flash("error", "OTP invalid or expired.")
        return res.redirect("/otp")
    }

    if (user.otp !== req.body.otp) {
        user.otp = undefined
        user.otpExpires = undefined
        req.flash("error", "OTP invalid")
        return res.redirect("/otp")
    }
    user.verified = true
    user.otp = undefined
    user.otpExpires = undefined
    await user.save()
    req.flash("success", "Verification completed. Please complete your profile.")
    return res.redirect("/profile/new")
}
