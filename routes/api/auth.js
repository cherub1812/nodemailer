const express = require('express')
const crypto = require('crypto')
const router = express.Router();
const User = require('../../models/User')

const ErrorHandler = require('../../utils/errorHandler')
const catchAsyncErrors = require('../../middlewares/catchAsyncErrors');
const sendToken = require('../../utils/jwtToken');
const sendEmail = require('../../utils/sendEmail');

const { isAuthenticatedUser, authorizeRoles } = require('../../middlewares/auth');
const { send } = require('process');
const cloudinary = require('cloudinary')

// @route     POST api/auth/register
// @desc      register a user
// @access    private
router.post('/register', catchAsyncErrors(async (req, res) => {

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
    })

    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
    })

    sendToken(user, 200, res)

}))

// login user => /api/auth/login
router.post('/login', catchAsyncErrors(async (req, res) => {

    const { email, password } = req.body;

    //check if email and password is entered by User
    if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400))
    }

    //finding user in database
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    //check if password is correct or not
    const isPasswordMatched = await user.comparePassword(password)

    if (!isPasswordMatched) {
        return next(new ErrorHandler('Invalid email or password', 401))
    }

    sendToken(user, 200, res)

}))

//forgot password ==> /api/auth/password/forgot
router.post('/password/forgot', async function (req, res)  {

    const user =  req.body.email ;

    console.log(user);

    if (!user) {
        return (new ErrorHandler('User not found with this email', 404))
    }

    // get reset token
    // const resetToken = user.getResetPasswordToken()

    // await user.save({ validateBeforeSave: false })

    // create password url
    // const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/password/reset/${resetToken}`
    // const resetUrl = `${process.env.FRONTEND_URL}password/reset/${resetToken}`

    const message = ` Your password reset token is as follows:\n\n \n\nIf you 
    have not requested this email, then kindly ignore it`

    try {
        await sendEmail.sendEmail(user)            
        
        res.status(200).json({
            success: true,
            message: `Email sent to:`
        })

    } catch (error) {
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined

        // await user.save({ validateBeforeSave: false })

        return (new ErrorHandler(error.message, 500))
    }
})

//RESET password ==> /api/auth/password/reset/:token
router.put('/password/reset', catchAsyncErrors(async (req, res) => {

    // hash url token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
        return next(new ErrorHandler('Password reset token is invalid or has been expired', 400))
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler('Password does not match', 400))
    }

    // setting up new password
    user.password = req.body.password

    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    sendToken(user, 200, res)
}))

// get currently logged in user details => api/auth/me
router.get('/me', isAuthenticatedUser, catchAsyncErrors(async (req, res) => {
    console.log("user")
    const user = await User.findById(req.user.id)
console.log(user)
    res.status(200).json({
        success: true,
        user
    })
}))

// update/change password => api/auth/me
router.put('/me', catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.user.id).select('+password')

    // check precious user password
    const isMatched = await user.comparePassword(req.user.oldPassword)
    if (!isMatched) {
        return next(new ErrorHandler('Old Password is unmatched', 400))
    }

    user.password = req.user.password
    await user.save()
    sendToken(user, 200, res)
}))

// update user profile => api/auth/me/update
router.put('/me/update', catchAsyncErrors(async (req, res) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }

    // update avatar
    if(req.body.avatar !== ''){
        const user = await User.findById(req.user.id)

        const image_id=user.avatar.public_id
        const res=await cloudinary.v2.uploader.destroy(image_id)

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"
        })

        newUserData.avatar={
            public_id:result.public_id,
            url:result.secure_url
        }
    }

    const user = await user.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
}))

//logout user ==> /api/auth/logout
router.get('/logout', catchAsyncErrors(async (req, res) => {

    res.cookie('token', null, {
        expires: new Date(Date.now()),
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'Logged out'
    })

}))

//get all users ==> /api/auth/admin/users
router.get('/admin/users', isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
}))

//get user details ==> /api/auth/admin/user/:id
router.get('/admin/user/:id', isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not found with id:${req.params.id}`, 400))
    }

    res.status(200).json({
        success: true,
        user
    })
}))

// update user profile => api/auth/admin/user/:id
router.put('/admin/user/:id', isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role
    }

    const user = await user.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true
    })
}))

//delete user ==> /api/auth/admin/user/:id
router.delete('/admin/user/:id', isAuthenticatedUser, authorizeRoles('admin'), catchAsyncErrors(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler(`User does not found with id:${req.params.id}`, 400))
    }

    // remove avatar from cloudinary : todo

    await user.remove();

    res.status(200).json({
        success: true
    })
}))

module.exports = router