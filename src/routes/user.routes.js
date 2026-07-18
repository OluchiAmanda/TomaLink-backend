const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');
const { updateMeSchema } = require('../validators/user.validator');
const { ownerProfileSchema } = require('../validators/listing.validator');

const router = express.Router();

// Every route in this file requires authentication.
router.use(protect);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateMeSchema), userController.updateMe);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

router.post('/me/owner-profile', validate(ownerProfileSchema), userController.createOwnerProfile);
router.get('/me/owner-profile', userController.getMyOwnerProfile);

module.exports = router;
