const express = require('express');
const listingController = require('../controllers/listing.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const { createListingSchema, updateListingSchema } = require('../validators/listing.validator');

const router = express.Router();

// --- Public browse (no auth required) ---
router.get('/', listingController.getPublicListings);
router.get('/nearby', listingController.getNearbyListings);

// --- Owner-only: their own listings (must come before '/:id') ---
router.get('/mine', protect, restrictTo('owner'), listingController.getMyListings);
router.post('/', protect, restrictTo('owner'), validate(createListingSchema), listingController.createListing);

// --- Public: single listing by id ---
router.get('/:id', listingController.getListingById);

// --- Owner-only: manage a specific listing ---
router.patch('/:id', protect, restrictTo('owner'), validate(updateListingSchema), listingController.updateListing);
router.delete('/:id', protect, restrictTo('owner'), listingController.deleteListing);
router.patch('/:id/pause', protect, restrictTo('owner'), listingController.pauseListing);
router.patch('/:id/resume', protect, restrictTo('owner'), listingController.resumeListing);
router.post('/:id/images', protect, restrictTo('owner'), upload.array('images', 10), listingController.addImages);

// --- Customer actions ---
router.post('/:id/favorite', protect, listingController.toggleFavorite);

module.exports = router;
