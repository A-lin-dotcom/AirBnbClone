const joi=require('joi');

module.exports.listingSchema=joi.object({
    listing:joi.object({
        title:joi.string().required(),
        description:joi.string().required(),
        location:joi.string().required(),
        country:joi.string().required(),
        category:joi.string().optional().allow(''),
        price:joi.number().required().min(0),
        latitude:joi.number().min(-90).max(90).optional(),
        longitude:joi.number().min(-180).max(180).optional(),
        image:joi.object({
            url:joi.string().allow(''),
            filename:joi.string().allow('')
        }).optional(),
    }).required()
});

module.exports.reviewSchema=joi.object({
    comment:joi.string().required(),
    rating:joi.number().required().min(1).max(5)
});

