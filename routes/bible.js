const express = require('express');
const router = express.Router();
const bible = require('../controllers/bible');
const { isLoggedIn } = require('../middleware');
const catchAsync = require('../utils/catchAsync');


router.get('/', bible.index);

// const { features } = require('process');

router.get('/chapter', isLoggedIn, catchAsync(bible.chapter)); 
  
router.get('/search', isLoggedIn, catchAsync(bible.search));

module.exports = router;