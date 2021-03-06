const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor} = require('../middleware');

const Review = require('../models/review');

router.get('/:reviewId/like', isLoggedIn, catchAsync(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    const i = review.likes.indexOf(req.user._id);
    i > -1 ? review.likes.splice(i, 1) : review.likes.push(req.user._id);
    await review.save();
    // console.log(review.likes.length)
    res.send(review.likes.length.toString());
})); 

router.get('/:reviewId/edit', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    const review = await Review.findById(req.params.reviewId);
    res.render('reviews/edit', {review});
}))

router.patch('/:reviewId/edit', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    const review = await Review.findByIdAndUpdate(req.params.reviewId, {...req.body.review});
    await review.save();
    if (review.category === 'Bible') {
        return res.redirect(`/${review.category}/chapter?chapter=${review.parentId}&version=${req.session.bibleVersion}`);
    }
    res.redirect(`/${review.category}/${review.parentId}`);
}))

module.exports = router;