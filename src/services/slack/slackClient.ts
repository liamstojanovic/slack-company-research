import axios from 'axios';
import { logger } from '../../utils/logger';
import { retryWithBackoff } from '../../utils/retry';

export async function postMessageToSlack(
  responseUrl: string,
  message: any
): Promise<void> {
  try {
    logger.info('Posting message to Slack', { responseUrl });

    await retryWithBackoff(
      async () => {
        const response = await axios.post(responseUrl, message, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        if (response.status !== 200) {
          throw new Error(`Slack API returned status ${response.status}`);
        }

        return response.data;
      },
      {
        maxRetries: 2,
        initialDelay: 1000,
      }
    );

    logger.info('Message posted to Slack successfully');
  } catch (error) {
    logger.error('Failed to post message to Slack', {
      error: (error as Error).message,
      responseUrl,
    });
    throw error;
  }
}
