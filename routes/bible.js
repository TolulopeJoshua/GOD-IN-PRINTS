const express = require('express');
const router = express.Router();
const bible = require('../controllers/bible');
const { isLoggedIn, validateReview, isReviewAuthor, setRedirect, isAdmin } = require('../middleware');
const catchAsync = require('../utils/catchAsync');


router.get('/', bible.index);

router.get('/chapter', catchAsync(bible.chapter)); 
  
router.get('/search', setRedirect, catchAsync(bible.search));

router.post('/addReview/:chapter/:version', isLoggedIn, validateReview, catchAsync(bible.addReview));

router.delete('/:userId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(bible.deleteReview));

router.post('/writexml', isAdmin, catchAsync(bible.writexml));

module.exports = router;