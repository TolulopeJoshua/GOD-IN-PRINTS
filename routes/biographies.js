const express = require('express');
const router = express.Router();
const biographies = require('../controllers/biographies');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isBiographyAuthor, validateBiography, isReviewAuthor, validateReview, setRedirect} = require('../middleware');

const {upload0} = require("../functions")


router.use(express.static("./uploads"));


router.get('/', catchAsync(biographies.index));

router.get('/list', setRedirect, catchAsync(biographies.list));

router.get('/random', catchAsync(biographies.random));

router.get('/new', setRedirect, catchAsync(biographies.renderNewForm));

router.post('/new', isLoggedIn, validateBiography, catchAsync(biographies.createBiography));

router.get('/search', setRedirect, catchAsync(biographies.search));

router.get('/:id', catchAsync(biographies.showBiography));

router.get('/1/:name', catchAsync(biographies.show));

router.get('/2/:uid', catchAsync(biographies.show2));

router.get('/:id/story', catchAsync(biographies.story))

router.get('/:id/image', catchAsync(biographies.image))

router.get('/:id/imageUpload', biographies.renderImageUploadForm); 

router.post('/:id/imageUpload', isLoggedIn, upload0.single("image"), catchAsync(biographies.uploadBiographyImage));
 
router.post('/:id/addReview', isLoggedIn, validateReview, catchAsync(biographies.addReview));

router.delete('/:biographyId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(biographies.deleteReview));
 
router.post('/suggest', isLoggedIn, validateReview, catchAsync(biographies.suggest));

module.exports = router;  