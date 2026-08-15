const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listings.js');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

//autocomplete/suggestion route
router.get('/search', listingController.searchSuggestions);

//new route
router.get('/new', listingController.renderNewForm);

router.route('/').get(listingController.index).post(upload.single('listing[image]'), listingController.createListing);

//edit route
router.get('/:id/edit', listingController.renderEditForm);
router.route('/:id').put(upload.single('listing[image]'), listingController.updateListing).delete(listingController.deleteListing).get(listingController.showListing);

module.exports = router;