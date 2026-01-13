import axios from 'axios';
import * as cheerio from 'cheerio';
import { LinkedInData } from '../../types/company.types';
import { logger } from '../../utils/logger';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function searchLinkedIn(companyName: string): Promise<LinkedInData> {
  try {
    logger.info('Searching for LinkedIn URL', { companyName });

    const searchQuery = `"${companyName}" site:linkedin.com/company`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&num=5`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
      },
      timeout: 5000,
      validateStatus: (status) => status < 400,
    });

    const $ = cheerio.load(response.data);

    const linkedInUrls: string[] = [];
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const match = href.match(/linkedin\.com\/company\/([^/?&]+)/);
        if (match) {
          const fullUrl = `https://www.linkedin.com/company/${match[1]}`;
          if (!linkedInUrls.includes(fullUrl)) {
            linkedInUrls.push(fullUrl);
          }
        }
      }
    });

    if (linkedInUrls.length > 0) {
      logger.info('LinkedIn URL found', { url: linkedInUrls[0] });
      return {
        url: linkedInUrls[0],
        found: true,
      };
    }

    logger.info('LinkedIn URL not found', { companyName });
    return {
      url: 'Not found',
      found: false,
    };
  } catch (error) {
    logger.warn('LinkedIn search failed', {
      companyName,
      error: (error as Error).message,
    });

    return {
      url: 'Not found',
      found: false,
    };
  }
}
