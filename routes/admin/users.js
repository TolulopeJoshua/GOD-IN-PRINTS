const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const { isAdmin, validateSubscription } = require('../../middleware');
const { emailSchema, textSchema } = require('../../schemas');
const limits = require('../../utils/lib/limits');

const Review = require('../../models/review');
const Book = require('../../models/book');
const Doc = require('../../models/doc');
const User = require('../../models/user');

router.get('/subscription', isAdmin, catchAsync(async (req, res) => {
    const { email, subscription } = req.query;
    let users = [];
    if (email) {
        const { error } = emailSchema.validate({ email });
        if (error) return res.status(400).send("Bad email!")
        users = await User.find({ email });
    }
    res.render('admin/users/subscription', {
        title: 'Admin | God In Prints',
        users, subTypes: Object.keys(limits.books), email, subscription,
    })
}));

router.post('/subscription', validateSubscription, isAdmin, catchAsync(async (req, res) => {
    const { email, subscription } = req.body;
    const [user] = await User.find({ email });
    if (user) {
        subscription.autorenew = subscription.autorenew === 'on';
        user.subscription = subscription;
        await user.save();
        req.flash("success", "User subscription updated!");
    } else {
        req.flash("error", "User not found!");
    }
    res.redirect(`/admin/users/subscription?email=${email}`)
}));

module.exports = router;