import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedData } from '../../types/company.types';
import { logger } from '../../utils/logger';
import { ENV } from '../../config/environment';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: ENV.app.scraperTimeout,
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    return response.data;
  } catch (error) {
    logger.warn('Failed to fetch page', { url, error: (error as Error).message });
    return null;
  }
}

function extractTextFromHtml($: ReturnType<typeof cheerio.load>): string {
  $('script, style, nav, footer, header, iframe, noscript').remove();

  const bodyText = $('body').text();
  return bodyText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function extractCompanyInfo(html: string, url: string): Partial<ScrapedData> {
  const $ = cheerio.load(html);
  const info: Partial<ScrapedData> = {};

  info.companyName =
    $('meta[property="og:site_name"]').attr('content') ||
    $('meta[name="application-name"]').attr('content') ||
    $('title').first().text().split('|')[0].split('-')[0].trim() ||
    '';

  info.description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const addressSelectors = [
    'address',
    '[itemprop="address"]',
    '.address',
    '.location',
    '.headquarters',
  ];

  for (const selector of addressSelectors) {
    const address = $(selector).first().text().trim();
    if (address && address.length > 5) {
      info.headquarters = address;
      break;
    }
  }

  const bodyText = extractTextFromHtml($);
  info.aboutText = bodyText.substring(0, 5000);

  return info;
}

async function scrapeAdditionalPages(baseUrl: string): Promise<string> {
  const additionalPaths = ['/about', '/about-us', '/company', '/contact', '/contact-us'];
  const scrapedTexts: string[] = [];

  for (const path of additionalPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      const html = await fetchPage(url);

      if (html) {
        const $ = cheerio.load(html);
        const text = extractTextFromHtml($);

        if (text && text.length > 100) {
          scrapedTexts.push(text.substring(0, 2000));
          logger.debug('Scraped additional page', { url, textLength: text.length });
        }
      }

      await sleep(200);
    } catch (error) {
      logger.debug('Failed to scrape additional page', {
        path,
        error: (error as Error).message,
      });
    }
  }

  return scrapedTexts.join('\n\n');
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const startTime = Date.now();
  logger.info('Starting website scrape', { url });

  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

    const html = await fetchPage(normalizedUrl);

    if (!html) {
      throw new Error('Failed to fetch homepage');
    }

    const companyInfo = extractCompanyInfo(html, normalizedUrl);

    const additionalText = await scrapeAdditionalPages(normalizedUrl);

    const fullText = [
      companyInfo.aboutText || '',
      additionalText,
    ].filter(Boolean).join('\n\n');

    const result: ScrapedData = {
      companyName: companyInfo.companyName,
      description: companyInfo.description,
      headquarters: companyInfo.headquarters,
      aboutText: companyInfo.aboutText,
      rawText: fullText.substring(0, 10000),
    };

    const duration = Date.now() - startTime;
    logger.info('Website scrape completed', {
      url,
      duration: `${duration}ms`,
      dataPoints: Object.keys(result).filter(k => result[k as keyof ScrapedData]).length,
    });

    return result;
  } catch (error) {
    logger.error('Website scrape failed', {
      url,
      error: (error as Error).message,
    });

    return {
      rawText: `Failed to scrape website: ${(error as Error).message}`,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
