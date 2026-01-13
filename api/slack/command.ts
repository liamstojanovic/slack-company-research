import { VercelRequest, VercelResponse } from '@vercel/node';
import { validateEnv, ENV } from '../../src/config/environment';
import {
  verifySlackSignature,
  parseSlackCommand,
  isValidUrl,
  normalizeUrl,
} from '../../src/services/slack/verification';
import { processCompanyResearch } from '../../src/handlers/asyncProcessor';
import { logger } from '../../src/utils/logger';
import { SlackCommandPayload } from '../../src/types/company.types';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    validateEnv();
  } catch (error) {
    logger.error('Environment validation failed', {
      error: (error as Error).message,
    });
    res.status(500).json({
      text: '❌ Server configuration error. Please contact the administrator.',
    });
    return;
  }

  const slackSignature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;

  let body: string;
  if (typeof req.body === 'string') {
    body = req.body;
  } else {
    body = new URLSearchParams(req.body as Record<string, string>).toString();
  }

  if (!verifySlackSignature(slackSignature, timestamp, body)) {
    logger.warn('Invalid Slack signature', { signature: slackSignature });
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  const payload = req.body as unknown as SlackCommandPayload;
  const { text, response_url, user_id, channel_id } = payload;

  logger.info('Received Slack command', {
    text,
    userId: user_id,
    channelId: channel_id,
  });

  const parsed = parseSlackCommand(text);
  if (!parsed) {
    res.status(200).json({
      response_type: 'ephemeral',
      text:
        '❌ Invalid format. Use: `/research [Company Name] [Website URL]`\n\n' +
        'Example: `/research Meta Meta.com`',
    });
    return;
  }

  const { companyName, websiteUrl } = parsed;

  if (!isValidUrl(websiteUrl)) {
    res.status(200).json({
      response_type: 'ephemeral',
      text: `❌ Invalid URL: \`${websiteUrl}\`\n\nPlease provide a valid website URL.`,
    });
    return;
  }

  res.status(200).json({
    response_type: 'in_channel',
    text: `🔍 Researching *${companyName}*... This may take 15-20 seconds.`,
  });

  processCompanyResearch({
    companyName,
    websiteUrl: normalizeUrl(websiteUrl),
    responseUrl: response_url,
    userId: user_id,
    channelId: channel_id,
  }).catch((error) => {
    logger.error('Async processing error', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  });
}
