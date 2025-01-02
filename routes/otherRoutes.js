const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const Book = require('../models/book');

router.get('/growth', catchAsync(async (req, res) => {
    const growthHabits = require("../personal_growth");
    const adBook = await Book.aggregate([{ $match: { filetype: 'pdf' } }, { $sample: { size: 1 } }]);
    const title = 'GIP Library - Personal Growth Strategies'
    res.render('growth', { growthHabits, adBook, title });
}));

router.get('/resources', (req, res) => {
    res.render('resources', { title: 'GIP Library - Other Resources' });
});

router.get('/about', (req, res) => {
    res.render('about');
});

router.get('/terms', (req, res) => {
    res.render('terms');
});

router.get('/privacy', (req, res) => {
    res.render('privacy');
});

module.exports = router; 