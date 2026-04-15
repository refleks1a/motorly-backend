import { Request, Response } from 'express';
import { getAutomotiveNews } from '../services/news.service';

/**
 * GET /api/news
 * Returns a list of automotive news articles, cached server-side for 30 min.
 *
 * Query params:
 *   pageSize  number  How many articles to return (default: 10, max: 20)
 */
export async function getNews(req: Request, res: Response): Promise<void> {
  try {
    const pageSize = Math.min(
      parseInt((req.query.pageSize as string) ?? '10', 10) || 10,
      20
    );

    const news = await getAutomotiveNews(pageSize);

    res.json({
      success: true,
      count: news.length,
      data: news,
    });
  } catch (error: any) {
    console.error('[NewsController] Failed to fetch news:', error?.message ?? error);
    res.status(502).json({
      success: false,
      error: 'Failed to fetch automotive news. Please try again later.',
    });
  }
}
