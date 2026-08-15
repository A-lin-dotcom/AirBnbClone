const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviews.js');

//Review
//Post route for creating a new review for a listing
router.post('/', reviewController.createReview);

//Delete route for deleting a review from a listing
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
