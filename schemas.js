const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');
const { subscription } = require('./controllers/users');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include CODE!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

module.exports.bookSchema = Joi.object({
    book: Joi.object({
        title: Joi.string().required().escapeHTML(),
        author: Joi.string().required().escapeHTML(),
    }).required()
});

module.exports.biographySchema = Joi.object({
    biography: Joi.object({
        name: Joi.string().required().escapeHTML(),
        role: Joi.string().required().escapeHTML(),
        birthYear: Joi.number().required(),
        deathYear: Joi.number(),
        gender: Joi.string().required().escapeHTML(),
        story: Joi.string().required(),
        source: Joi.string().escapeHTML()
    }).required()
})

module.exports.articleSchema = Joi.object({
    article: Joi.object({
        name: Joi.string().required().escapeHTML(),
        role: Joi.string().required().escapeHTML(),
        story: Joi.string().required(),
        source: Joi.string().escapeHTML()
    }).required()
})

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        text: Joi.string().required().escapeHTML(),
        info: Joi.string().min(0).escapeHTML()
    }).required()
})

module.exports.emailSchema = Joi.object({
    email: Joi.string().email().required().escapeHTML()
})

module.exports.passwordSchema = Joi.object({
    password: Joi.string().required().escapeHTML()
})

module.exports.textSchema = Joi.object({
    text: Joi.string().required().escapeHTML()
})

module.exports.userShema = Joi.object({
    firstName: Joi.string().min(2).max(20).required().escapeHTML(),
    lastName: Joi.string().min(2).max(20).required().escapeHTML(),
    email: Joi.string().email().required().escapeHTML(),
    password: Joi.string().min(8).max(100).required().escapeHTML(),
    loginType: Joi.string().escapeHTML(),
    accessToken: Joi.string().escapeHTML(),
    facebookId: Joi.string().escapeHTML(),
    googleId: Joi.string().escapeHTML(),
})

module.exports.profileSchema = Joi.object({
    firstName: Joi.string().min(2).max(20).escapeHTML(),
    lastName: Joi.string().min(2).max(20).escapeHTML(),
    gender: Joi.string().min(0).escapeHTML(),
    email: Joi.string().email().escapeHTML(),
    newEmail: Joi.string().email().escapeHTML(),
    phone: Joi.string().min(0).max(20).escapeHTML(),
    address: Joi.string().min(0).max(200).escapeHTML(),
    password: Joi.string().min(8).max(100).escapeHTML(),
    newPassword: Joi.string().min(8).max(100).escapeHTML(),
})

module.exports.subscriptionSchema = Joi.object({
    email: Joi.string().email().required().escapeHTML(),
    subscription: Joi.object({
        status: Joi.string().required().escapeHTML(),
        expiry: Joi.string().required().escapeHTML(),
        autorenew: Joi.string().min(0).escapeHTML(),
        code: Joi.string().min(0).escapeHTML(),
        curr: Joi.string().min(0).escapeHTML(),
    }).required()
})