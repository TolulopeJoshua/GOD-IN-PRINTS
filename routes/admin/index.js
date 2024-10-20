const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const { isAdmin } = require('../../middleware');

const userRoutes = require('./users');

const Review = require('../../models/review');
const Book = require('../../models/book');
const Doc = require('../../models/doc');
const { default: axios } = require('axios');
const { writeFileSync } = require('fs');

router.get('/', isAdmin, catchAsync(async (req, res) => {
    res.render('admin', {title: 'Admin | God In Prints', })
})); 

router.use('/users', userRoutes);

module.exports = router;