const express = require('express');
const router = express.Router();
const books = require('../controllers/books');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isBookAuthor, validateBook } = require('../middleware');

const {upload, upload0} = require("../functions")


router.get('/', catchAsync(books.index));

router.get('/list', isLoggedIn, catchAsync(books.list));

router.get('/categories', books.categories);

router.get('/category', isLoggedIn, catchAsync(books.perCategory));

router.get('/new', isLoggedIn, books.renderNewForm);

router.post('/new', isLoggedIn, upload.single('document'), validateBook, catchAsync(books.createBook));

router.get('/adminUpload', isLoggedIn, books.renderAdminUpload);

router.post('/adminUpload', upload.array('documents'), catchAsync(books.adminUpload))
 
router.get('/search', isLoggedIn, catchAsync(books.search));

router.get('/:id', catchAsync(books.showBook));

router.get('/image', catchAsync(books.image));

router.get('/:id/imageUpload', isLoggedIn, books.renderImageUpload);

router.post('/:id/imageUpload', isLoggedIn, upload0.single("image"), catchAsync(books.imageUpload));

router.get('/:id/download', isLoggedIn, catchAsync(books.download));

module.exports = router;