const express = require('express');
const router = express.Router();
const books = require('../controllers/books');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isBookAuthor, validateBook, isReviewAuthor, validateReview, checkDownloadLimit, setRedirect} = require('../middleware');

const {upload, upload0} = require("../functions")


router.get('/', catchAsync(books.index));

router.get('/list', setRedirect, catchAsync(books.list));

router.get('/categories', books.categories);

router.get('/category', setRedirect, catchAsync(books.perCategory));

// router.get('/new', isLoggedIn, books.renderNewForm);

// router.post('/new', isLoggedIn, upload.single('document'), validateBook, catchAsync(books.createBook));

// router.get('/adminUpload', isLoggedIn, books.renderAdminUpload);

// router.post('/adminUpload', upload.array('documents'), catchAsync(books.adminUpload))
 
router.get('/search', setRedirect, catchAsync(books.search));

router.get('/:id', setRedirect, catchAsync(books.showBook));

router.get('/image', catchAsync(books.image));

router.get('/:id/imageUpload', isLoggedIn, books.renderImageUpload);

router.post('/:id/imageUpload', isLoggedIn, upload0.single("image"), catchAsync(books.imageUpload));

router.get('/:id/download', isLoggedIn, checkDownloadLimit, catchAsync(books.download));

// router.get('/:id/read', isLoggedIn, catchAsync(books.read));

// router.get('/:id/getPages', isLoggedIn, catchAsync(books.pagesArray));

router.post('/:id/addReview', isLoggedIn, validateReview, catchAsync(books.addReview));

router.delete('/:bookId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(books.deleteReview));

module.exports = router;