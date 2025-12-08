const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get analytics dashboard summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/dashboard', auth, analyticsController.getDashboard);

/**
 * @swagger
 * /api/analytics/{urlId}:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get raw analytics records for a URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of analytics records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Analytics'
 */
router.get('/:urlId', auth, analyticsController.getUrlAnalytics);

/**
 * @swagger
 * /api/analytics/{urlId}/stats:
 *   get:
 *     tags:
 *       - Analytics
 *     summary: Get aggregated stats for a URL (clicks over time, top countries, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Aggregated statistics object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/:urlId/stats', auth, analyticsController.getUrlStats);

module.exports = router;
