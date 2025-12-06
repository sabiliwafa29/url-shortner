const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const auth = require('../middleware/auth');
const { validateUrl } = require('../middleware/validator');

// Public route - redirect
router.get('/:shortCode', urlController.redirectUrl);

// Protected routes - require authentication
router.post('/api/urls', auth, validateUrl, urlController.createShortUrl);
router.get('/api/urls', auth, urlController.getUserUrls);
router.delete('/api/urls/:id', auth, urlController.deleteUrl);

module.exports = router;