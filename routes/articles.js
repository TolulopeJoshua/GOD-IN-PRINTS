const express = require('express');
const router = express.Router();
const articles = require('../controllers/articles');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isArticleAuthor, validateArticle, validateReview} = require('../middleware');

const {upload0} = require("../functions")


router.get('/', catchAsync(articles.index));

router.get('/list', isLoggedIn, catchAsync(articles.list));

router.get('/categories', articles.categories);

router.get('/category', isLoggedIn, catchAsync(articles.perCategory));

router.get('/new', isLoggedIn, articles.renderNewForm);

router.post('/new', isLoggedIn, validateArticle, catchAsync(articles.createArticle));

router.get('/search', isLoggedIn, catchAsync(articles.search));

router.get('/:id', catchAsync(articles.showArticle));

router.get('/:id/story', catchAsync(articles.story));

router.get('/:id/image', catchAsync(articles.image));

router.get('/:id/imageUpload', isLoggedIn, articles.renderImageUploadForm);

router.post('/:id/imageUpload', isLoggedIn, upload0.single('image'), catchAsync(articles.uploadArticleImage));

router.post('/:id/addReview', isLoggedIn, validateReview, catchAsync(articles.addReview));

module.exports = router;