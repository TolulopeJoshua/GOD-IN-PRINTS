const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');

const Doc = require('../../models/doc')
const Book = require('../../models/book');

router.get('/all', catchAsync(async (req, res) => {
    const articles = await Doc.find({docType: 'article'})
    const biographies = await Doc.find({docType: 'biography'})
    const books = await Book.find({})

    return res.status(200).json({articles, biographies, books})
}))

router.get('/articles', catchAsync(async (req, res) => {
    const articles = await Doc.find({docType: 'article'})
    return res.status(200).json({articles})
}))

router.get('/biographies', catchAsync(async (req, res) => {
    const biographies = await Doc.find({docType: 'biography'})
    return res.status(200).json({biographies})
}))

router.get('/books', catchAsync(async (req, res) => {
    const books = await Book.find({})
    return res.status(200).json({books})
}))


module.exports = router;