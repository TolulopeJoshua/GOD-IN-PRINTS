const express = require('express');
const passport = require('passport');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const { isLoggedIn, validateReview, isReviewAuthor, validateEmail, validatePassword, validateUser } = require('../middleware');

router.route('/register')
    .get(users.renderRegister)
    .post(validateUser, catchAsync(users.register));

router.get('/login', users.renderLogin)

router.post('/login/pwd', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), users.login);

router.get('/login/fbk', passport.authenticate('facebook'));

router.get('/redirect/fbk', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/login' }));

router.get('/login/ggl', passport.authenticate('google'));

router.get('/redirect/ggl', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/login' }));

router.get('/logout', users.logout);

router.get('/changePassword', users.renderChangePassword);

router.post('/changePassword', validateEmail, catchAsync(users.changePassword));

router.get('/changePassword/:userId/:resetCode', users.renderSetPassword);

router.post('/changePassword/:userId/:resetCode', validatePassword, catchAsync(users.setPassword));

router.post('/addReview/:chapter/:version', isLoggedIn, validateReview, catchAsync(users.addReview));

router.delete('/:userId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(users.deleteReview));

module.exports = router;