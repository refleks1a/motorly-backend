import axios from 'axios';

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  url: string;
  source: string;
}

interface NewsApiArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

/** Cached result and the time it was fetched */
let cache: { data: NewsItem[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/** Map a NewsAPI source name to a short category label */
function inferCategory(sourceName: string): string {
  const s = sourceName.toLowerCase();
  if (s.includes('electr') || s.includes('ev') || s.includes('tesla')) return 'Electric';
  if (s.includes('motor') || s.includes('auto') || s.includes('car')) return 'Auto';
  if (s.includes('tech') || s.includes('engadget') || s.includes('verge')) return 'Tech';
  if (s.includes('business') || s.includes('finance') || s.includes('market')) return 'Industry';
  return 'News';
}

/** Format an ISO date string to "Apr 15, 2026" */
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export async function getAutomotiveNews(pageSize = 10): Promise<NewsItem[]> {
  // Return cached data if still fresh
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    console.log('[NewsService] Returning cached automotive news');
    return cache.data;
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('[NewsService] NEWS_API_KEY is not set — returning empty news list');
    return [];
  }

  console.log('[NewsService] Fetching fresh automotive news from NewsAPI...');

  const response = await axios.get<NewsApiResponse>('https://newsapi.org/v2/everything', {
    params: {
      q: 'automotive OR "electric car" OR "EV" OR "car review" OR "auto industry"',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize,
      page: 1,
    },
    headers: {
      'X-Api-Key': apiKey,
    },
    timeout: 10000,
  });

  const articles = response.data.articles ?? [];

  const newsItems: NewsItem[] = articles
    // Filter out articles with no title, description, or image
    .filter(
      (a) =>
        a.title &&
        a.title !== '[Removed]' &&
        a.description &&
        a.urlToImage
    )
    .map((a, idx) => ({
      id: `news-${idx}-${Date.now()}`,
      title: a.title,
      excerpt: a.description ?? '',
      imageUrl: a.urlToImage ?? '',
      date: formatDate(a.publishedAt),
      category: inferCategory(a.source.name),
      url: a.url,
      source: a.source.name,
    }));

  // Cache the result
  cache = { data: newsItems, fetchedAt: Date.now() };
  console.log(`[NewsService] Cached ${newsItems.length} articles`);

  return newsItems;
}
