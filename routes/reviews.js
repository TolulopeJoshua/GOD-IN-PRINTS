const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor} = require('../middleware');

const Review = require('../models/review');
const Book = require('../models/book');
const ExpressError = require('../utils/ExpressError');

router.get('/:reviewId/like', catchAsync(async (req, res) => {
    if (req.user) {
        const review = await Review.findById(req.params.reviewId);
        const i = review.likes.indexOf(req.user._id);
        i > -1 ? review.likes.splice(i, 1) : review.likes.push(req.user._id);
        await review.save();
        // console.log(review.likes.length)
        res.send(review.likes.length.toString());
    }
})); 

router.get('/:reviewId/edit', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    let review = {_id: '0', text: ''};
    if (req.params.reviewId != '0') {
        review = await Review.findById(req.params.reviewId);
    }
    const title = 'Edit Review'
    res.render('reviews/edit', {review, title});
}))

router.patch('/:reviewId/edit', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    let review;
    if (req.params.reviewId == '0') {
        if (!req.body.parentId) new ExpressError('Bad Request!', 400);
        review = new Review(req.body.review);
        const book = await Book.findById(req.body.parentId);
        review.author = req.user._id;
        review.parentId = req.body.parentId;
        review.category = 'Books';
        review.dateTime = Date.now();
        book.reviews.unshift(review);
        await review.save();
        await book.save();
    } else {
        review = await Review.findByIdAndUpdate(req.params.reviewId, {...req.body.review});
        await review.save();
    }
    if (review.category === 'Bible') {
        return res.redirect(`/${review.category}/chapter?chapter=${review.parentId}&version=${req.session.bibleVersion}#review-text`);
    }
    res.redirect(`/${review.category}/${review.parentId}#review-text`);
}))

module.exports = router;