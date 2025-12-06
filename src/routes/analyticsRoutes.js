const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, analyticsController.getDashboard);
router.get('/:urlId', auth, analyticsController.getUrlAnalytics);
router.get('/:urlId/stats', auth, analyticsController.getUrlStats);

module.exports = router;
