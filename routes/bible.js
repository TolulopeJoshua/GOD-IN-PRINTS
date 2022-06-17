const express = require('express');
const router = express.Router();
const bible = require('../controllers/bible');
const { isLoggedIn, validateReview, isReviewAuthor } = require('../middleware');
const catchAsync = require('../utils/catchAsync');
const user = require('../models/user');


router.get('/', bible.index);

router.get('/chapter', isLoggedIn, catchAsync(bible.chapter)); 
  
router.get('/search', isLoggedIn, catchAsync(bible.search));

router.post('/addReview/:chapter/:version', isLoggedIn, validateReview, catchAsync(bible.addReview));

router.delete('/:userId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(bible.deleteReview));

module.exports = router;