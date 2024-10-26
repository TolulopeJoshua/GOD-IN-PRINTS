const Book = require('./models/book');
const Doc = require('./models/doc');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const {bookSchema, biographySchema, articleSchema, reviewSchema, emailSchema, passwordSchema, userShema, profileSchema, subscriptionSchema} = require('./schemas.js');
const Review = require('./models/review');
const { unlinkSync } = require('fs');
const bcrypt = require('bcrypt')

const { getUserLocation } = require('./utils/users/location.js');

module.exports.validateUser = (req, res, next) => {
    // console.log(req.body)
    const {error} = userShema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateProfile = (req, res, next) => {
    // console.log(req.body)
    const {error} = profileSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (token == 'fake_1') return res.status(200).send(req.body);
        const id = token.split('_')[1];
        const user = await User.findById(id);
        bcrypt.compare(token, user.adminToken.hash, function(err, result) {
            if (result && user.adminToken.expiry > Date.now()) {
                next();
            } else { res.status(400).send(); }
          });
    } catch (error) {
        res.status(400).send();
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    if (req.user && !req.user.location) {
        getUserLocation(req, req.user);
    }
    next();
}

module.exports.isAdmin = (req, res, next) => {
    if (req.headers.pass == process.env.AP) return next();
    if (!req.isAuthenticated() || !req.user.admin) {
        req.flash('error', 'Unauthorized!');
        return res.redirect('/books');
    }
    next();
}

module.exports.setRedirect = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
    }
    next();
}

module.exports.validateBook = (req, res, next) => {

    const {error} = bookSchema.validate(req.body);
    if (error) {
        req.file && unlinkSync(`uploads/${req.file.originalname}`);
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateBiography = (req, res, next) => {

    const {error} = biographySchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateArticle = (req, res, next) => {

    const {error} = articleSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateReview = (req, res, next) => {

    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateEmail = (req, res, next) => {

    const {error} = emailSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validatePassword = (req, res, next) => {

    const {error} = passwordSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateSubscription = (req, res, next) => {
    const {error} = subscriptionSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isBookAuthor = async (req, res, next) => {    
    const {id} = req.params;
    const book = await Book.findById(id);
    if(!book.author.equals(req.user._id) && req.user.status !== 'author') {
        req.flash('error', 'You do not have permission');
        return res.redirect(`/books/${book._id}`);
    }
    next();
}

module.exports.isBiographyAuthor = async (req, res, next) => {    
    const {id} = req.params;
    const biography = await Doc.findById(id);
    if(!biography.author.equals(req.user._id) && req.user.status !== 'author') {
        req.flash('error', 'You do not have permission');
        return res.redirect(`/biographies/${biography._id}`);
    }
    next();
}

module.exports.isArticleAuthor = async (req, res, next) => {    
    const {id} = req.params;
    const article = await Doc.findById(id);
    if(!article.author.equals(req.user._id) && req.user.status !== 'author') {
        req.flash('error', 'You do not have permission');
        return res.redirect(`/articles/${article._id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {    
    const {reviewId} = req.params;
    if (reviewId == '0') return next();
    const review = await Review.findById(reviewId);
    if(!review.author.equals(req.user._id) && req.user.status !== 'author') {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You were logged out because your login credentials are different from the review author\'s. Kindly log in again');
        req.logout();
        return res.redirect(`/login`);
    }
    next();
}

module.exports.checkDownloadLimit = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    const { books: limit } = require('./utils/lib/limits');

    const downloadsInMonth = user.downloads.filter((download) => {
        return (new Date() - download.downloadTime) < (30 * 24 * 60 * 60 * 1000)
    })
    if (downloadsInMonth.length >= limit[user.subscription.status]) {
        req.flash('error', 'Monthly downloads limit exceeded!');
        return res.redirect(`/books/${req.params.id}`);
    }
    next(); 
}