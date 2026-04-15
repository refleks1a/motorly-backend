import { Router } from 'express';
import { getNews } from '../controllers/news.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/news
 * Requires a valid JWT.
 */
router.get('/', authenticate, getNews);

export default router;
