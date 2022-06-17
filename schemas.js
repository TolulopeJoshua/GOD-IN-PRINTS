const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
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
        story: Joi.string().required().escapeHTML(),
        source: Joi.string().escapeHTML()
    }).required
})

module.exports.articleSchema = Joi.object({
    article: Joi.object({
        name: Joi.string().required().escapeHTML(),
        role: Joi.string().required().escapeHTML(),
        story: Joi.string().required().escapeHTML(),
        source: Joi.string().escapeHTML()
    })
})

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        text: Joi.string().required().escapeHTML()
    }).required()
})

module.exports.emailSchema = Joi.object({
    email: Joi.string().required().escapeHTML()
})

module.exports.passwordSchema = Joi.object({
    password: Joi.string().required().escapeHTML()
})
