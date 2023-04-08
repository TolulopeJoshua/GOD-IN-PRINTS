const express = require('express');
const router = express.Router();
const articles = require('../controllers/articles');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isArticleAuthor, validateArticle, validateReview, isReviewAuthor, setRedirect, isAdmin} = require('../middleware');

const {upload0} = require("../functions")


router.get('/', catchAsync(articles.index));

router.get('/list', setRedirect, catchAsync(articles.list));

router.get('/random', catchAsync(articles.random));

router.get('/categories', articles.categories);

router.get('/category', setRedirect, catchAsync(articles.perCategory));

router.get('/new', setRedirect, catchAsync(articles.renderNewForm));

router.post('/new', isLoggedIn, validateArticle, catchAsync(articles.createArticle));

router.get('/search', setRedirect, catchAsync(articles.search));

router.get('/:id', catchAsync(articles.showArticle));

router.get('/1/:name', catchAsync(articles.show));

router.get('/2/:uid', catchAsync(articles.show2));

router.get('/:id/story', catchAsync(articles.story));

router.get('/:id/image', catchAsync(articles.image));

router.get('/:id/imageUpload', isLoggedIn, articles.renderImageUploadForm);

router.post('/:id/imageUpload', isLoggedIn, upload0.single('image'), catchAsync(articles.uploadArticleImage));

router.post('/:id/imageLink', isLoggedIn, catchAsync(articles.imageLink));

router.post('/:id/addReview', isLoggedIn, validateReview, catchAsync(articles.addReview));

router.delete('/:articleId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(articles.deleteReview));
 
router.post('/suggest', isLoggedIn, validateReview, catchAsync(articles.suggest));

router.post('/writexml', isAdmin, catchAsync(articles.writexml));

module.exports = router;