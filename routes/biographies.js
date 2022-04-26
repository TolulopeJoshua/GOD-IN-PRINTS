const express = require('express');
const router = express.Router();
const biographies = require('../controllers/biographies');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isBiographyAuthor, validateBiography } = require('../middleware');

const {upload0} = require("../functions")


router.use(express.static("./uploads"));


router.get('/', catchAsync(biographies.index));

router.get('/list', isLoggedIn, catchAsync(biographies.list));

router.get('/new', isLoggedIn, biographies.renderNewForm);

router.post('/new', isLoggedIn, validateBiography, catchAsync(biographies.createBiography));

router.get('/search', isLoggedIn, catchAsync(biographies.search));

router.get('/:id', catchAsync(biographies.showBiography));

router.get('/:id/story', catchAsync(biographies.story))

router.get('/:id/image', catchAsync(biographies.image))

router.get('/:id/imageUpload', biographies.renderImageUploadForm); 

router.post('/:id/imageUpload', isLoggedIn, upload0.single("image"), catchAsync(biographies.uploadBiographyImage));
 
module.exports = router;  