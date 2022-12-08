const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor} = require('../middleware');

const Review = require('../models/review');

router.get('/movies', (req, res) => {
    res.render('media/movies', {title: 'God In Prints | Movies on the Christian Faith'})
}); 

router.get('/music', (req, res) => {
    res.render('media/music', {title: 'God In Prints | Songs of the Christian Faith'})
}); 

module.exports = router;