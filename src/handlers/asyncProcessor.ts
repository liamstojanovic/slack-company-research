import { ResearchRequest } from '../types/company.types';
import { scrapeWebsite } from '../services/scraper/websiteScraper';
import { searchLinkedIn } from '../services/scraper/linkedinSearch';
import { analyzeCompany } from '../services/ai/claudeClient';
import { formatSlackMessage, formatErrorMessage } from '../services/slack/formatter';
import { postMessageToSlack } from '../services/slack/slackClient';
import { logger } from '../utils/logger';

export async function processCompanyResearch(
  request: ResearchRequest
): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info('Starting company research', {
      company: request.companyName,
      url: request.websiteUrl,
    });

    const scrapedData = await scrapeWebsite(request.websiteUrl);
    logger.info('Website scraping completed', {
      company: request.companyName,
    });

    const linkedInData = await searchLinkedIn(request.companyName).catch((error) => {
      logger.warn('LinkedIn search failed, continuing without it', {
        error: error.message,
      });
      return { url: 'Not found', found: false };
    });
    logger.info('LinkedIn search completed', {
      company: request.companyName,
      found: linkedInData.found,
    });

    const analysis = await analyzeCompany({
      companyName: request.companyName,
      websiteUrl: request.websiteUrl,
      scrapedData,
      linkedInData,
    });
    logger.info('Claude analysis completed', {
      company: request.companyName,
      grade: analysis.account_grade,
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    const message = formatSlackMessage(analysis, processingTime);

    await postMessageToSlack(request.responseUrl, message);

    logger.info('Company research completed successfully', {
      company: request.companyName,
      duration: `${processingTime}s`,
      grade: analysis.account_grade,
    });
  } catch (error) {
    logger.error('Company research failed', {
      company: request.companyName,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });

    const errorMessage = formatErrorMessage(
      request.companyName,
      (error as Error).message
    );

    try {
      await postMessageToSlack(request.responseUrl, errorMessage);
    } catch (slackError) {
      logger.error('Failed to send error message to Slack', {
        error: (slackError as Error).message,
      });
    }
  }
}
