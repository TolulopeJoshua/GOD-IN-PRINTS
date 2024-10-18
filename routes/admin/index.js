const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const { isLoggedIn, isReviewAuthor, setRedirect } = require('../../middleware');

const Review = require('../../models/review');
const Book = require('../../models/book');
const Doc = require('../../models/doc');
const { default: axios } = require('axios');
const { writeFileSync } = require('fs');

router.get('/', catchAsync(async (req, res) => {
    res.render('admin', {title: 'Admin | God In Prints', })
})); 

module.exports = router;