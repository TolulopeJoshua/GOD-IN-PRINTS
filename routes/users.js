const express = require('express');
const passport = require('passport');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/users');
const { isLoggedIn, validateReview, isReviewAuthor, validateEmail, validatePassword, validateUser, validateProfile, isAdmin } = require('../middleware');

router.route('/register')
    .get(users.renderRegister)
    .post(validateUser, catchAsync(users.register));

router.get('/login', users.renderLogin)

router.post('/login/pwd', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), catchAsync(users.login));

router.get('/login/fbk', passport.authenticate('facebook'));

router.get('/redirect/fbk', passport.authenticate('facebook', {failureFlash: true, failureRedirect: '/login'}), catchAsync(users.socialLogin));

router.get('/login/ggl', passport.authenticate('google'));

router.get('/redirect/ggl', passport.authenticate('google', {failureFlash: true, failureRedirect: '/login'}), catchAsync(users.socialLogin));

router.get('/logout', catchAsync(users.logout));

router.post('/weeklyMails', isAdmin, catchAsync(users.weeklyMails));

router.post('/bookReviews', isAdmin, catchAsync(users.getBookReviews));

router.get('/user/nomail', isLoggedIn, catchAsync(users.nomail));

router.get('/user/getmail', isLoggedIn, catchAsync(users.getmail));

router.get('/profile', isLoggedIn, users.renderProfile);

router.post('/profile', isLoggedIn, validateProfile, catchAsync(users.updateProfile));

router.get('/subscription', users.renderSubscription);

router.post('/subscription', catchAsync(users.subscription));

router.post('/subscription_usd', catchAsync(users.subscription_usd));

router.post('/subscription/:id', catchAsync(users.setSubscription));

router.delete('/subscription/:subCode', isLoggedIn, catchAsync(users.disableSubscription));

router.delete('/subscription_usd', isLoggedIn, catchAsync(users.disableUsdSubscription));

router.get('/bookTicket/:ref', isLoggedIn, catchAsync(users.bookTicket));

router.get('/changePassword', users.renderChangePassword);

router.post('/changePassword', validateEmail, catchAsync(users.changePassword));

router.get('/changePassword/:userId/:resetCode', users.renderSetPassword);

router.post('/changePassword/:userId/:resetCode', validatePassword, catchAsync(users.setPassword));

router.get('/userSource/:source/:email', catchAsync(users.setUserSource));

router.post('/addReview/:chapter/:version', isLoggedIn, validateReview, catchAsync(users.addReview));

router.delete('/:userId/deleteReview/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(users.deleteReview));

module.exports = router;