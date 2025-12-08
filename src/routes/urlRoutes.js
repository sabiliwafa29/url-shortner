const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController');
const auth = require('../middleware/auth');
const { validateUrl } = require('../middleware/validator');

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to the original URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: Short code or custom alias
 *     responses:
 *       301:
 *         description: Redirect to original URL
 *       404:
 *         description: URL not found
 */
// Public route - redirect (only match alphanumeric short codes/custom aliases)
router.get('/:shortCode([A-Za-z0-9]+)', urlController.redirectUrl);

/**
 * @swagger
 * /api/urls:
 *   post:
 *     summary: Create a shortened URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *               title:
 *                 type: string
 *               customAlias:
 *                 type: string
 *               expiresIn:
 *                 type: integer
 *                 description: Expiration in days
 *     responses:
 *       201:
 *         description: Created shortened URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/URL'
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
// Protected routes - require authentication
router.post('/api/urls', auth, validateUrl, urlController.createShortUrl);

/**
 * @swagger
 * /api/urls:
 *   get:
 *     summary: Get URLs for the authenticated user
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of user URLs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/URL'
 */
router.get('/api/urls', auth, urlController.getUserUrls);

/**
 * @swagger
 * /api/urls/{id}:
 *   delete:
 *     summary: Delete a user's URL
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL deleted
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
router.delete('/api/urls/:id', auth, urlController.deleteUrl);

module.exports = router;