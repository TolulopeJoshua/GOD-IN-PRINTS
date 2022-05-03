const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn} = require('../middleware');

const Review = require('../models/review');

router.get('/:id/like', isLoggedIn, catchAsync(async (req, res) => {
    const review = await Review.findById(req.params.id);
    const i = review.likes.indexOf(req.user._id);
    i > -1 ? review.likes.splice(i, 1) : review.likes.push(req.user._id);
    await review.save();
    // console.log(review.likes.length)
    res.send(review.likes.length.toString());
})); 

module.exports = router;