const Book = require('./models/book');
const Doc = require('./models/doc');
const User = require('./models/user');
const ExpressError = require('./utils/ExpressError');
const {bookSchema, biographySchema, articleSchema, reviewSchema, emailSchema, passwordSchema, userShema} = require('./schemas.js');
const Review = require('./models/review')

module.exports.validateUser = (req, res, next) => {

    throw new ExpressError(JSON.stringify(req), 400);
    const {error} = userShema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateBook = (req, res, next) => {

    const {error} = bookSchema.validate(req.body);
    if (error) {
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
    const review = await Review.findById(reviewId);
    if(!review.author.equals(req.user._id) && req.user.status !== 'author') {
        req.flash('error', 'You do not have permission');
        return res.redirect(`/${review.category}/${review.parentId}`);
    }
    next();
}

module.exports.checkDownloadLimit = async (req, res, next) => {
    const user = await User.findById(req.user._id)
    const lastDownloadTime = user.lastDownloadTime;
    if((new Date() - user.lastDownloadTime) < (24 * 60 * 60 * 1000)) {
        req.flash('error', 'Daily download limit exceeded!');
        return res.redirect(`/books/${req.params.id}`);
    } else {
        next();
    }
}