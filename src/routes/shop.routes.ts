import { Router } from 'express';
import { ShopController } from '../controllers/shop.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Auto shop search and management
 */

/**
 * @swagger
 * /api/shops/search:
 *   get:
 *     summary: Search for auto shops with filters
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: User's latitude for distance calculation
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: User's longitude for distance calculation
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
 *       - in: query
 *         name: specialties
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         description: Filter by shop specialties (e.g., "Brake Repair", "Engine Repair")
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           default: 0
 *         description: Minimum rating filter
 *       - in: query
 *         name: isOpenNow
 *         schema:
 *           type: boolean
 *         description: Filter for shops currently open
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Search by name, address, or description
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of shops matching search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shops:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shop'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/search', authenticate, ShopController.searchShops);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Get shop details by ID
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop details with active offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shop:
 *                   $ref: '#/components/schemas/Shop'
 *                 offers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Offer'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticate, ShopController.getShop);

/**
 * @swagger
 * /api/shops/diagnosis/recommendations:
 *   get:
 *     summary: Get shop recommendations for a specific diagnosis
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User's latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: User's longitude
 *       - in: query
 *         name: issueType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of car issue (e.g., "Engine Noise", "Brake Squeal")
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 5
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Recommended shops for the diagnosis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 issueType:
 *                   type: string
 *                 recommendedShops:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shop'
 *                 totalRecommendations:
 *                   type: integer
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/diagnosis/recommendations', authenticate, ShopController.getShopsForDiagnosis);

export default router;