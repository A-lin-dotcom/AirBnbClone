const Review = require('../models/review.js');
const Listing = require('../models/listing.js');
const { reviewSchema } = require('../schema.js');

const ensureLoggedIn = (req, res) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.session.save((err) => {
            if (err) {
                console.log('Session save error:', err);
            }
            req.flash('error', 'You must be logged in to create a review!');
            res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
        });
        return false;
    }
    return true;
};

module.exports.createReview = async (req, res, next) => {
    if (!ensureLoggedIn(req, res)) {
        return;
    }

    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        const result = reviewSchema.validate(req.body.review);
        console.log(result);

        const newReview = new Review(req.body.review);
        newReview.author = req.user._id;

        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();

        req.flash('success', 'Successfully created a new review!');
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.deleteReview = async (req, res, next) => {
    if (!ensureLoggedIn(req, res)) {
        return;
    }

    try {
        const { id, reviewId } = req.params;
        const listing = await Listing.findById(id);

        await Review.findByIdAndDelete(reviewId);
        await listing.save();

        req.flash('success', 'Successfully deleted the review!');
        res.redirect(`/listings/${id}`);
    } catch (err) {
        next(err);
    }
};
