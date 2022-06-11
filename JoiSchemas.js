const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html')

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML'
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
})

const Joi = BaseJoi.extend(extension);

module.exports.userSchema = Joi.object({
    first: Joi.string().required().escapeHTML(),
    email: Joi.string().required().escapeHTML(),
    username: Joi.string().required().escapeHTML(),
    password: Joi.string().required().escapeHTML()
})

module.exports.recipeSchema = Joi.object({
    title: Joi.string().required().escapeHTML(),
    description: Joi.string().required().escapeHTML(),
    ingredients: Joi.string().required().escapeHTML(),
    method: Joi.string().required().escapeHTML()
})

module.exports.commentSchema = Joi.object({
    comment: Joi.string().required()
})