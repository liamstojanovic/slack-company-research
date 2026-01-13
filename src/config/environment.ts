import { config } from 'dotenv';

config();

export interface EnvironmentConfig {
  slack: {
    botToken: string;
    signingSecret: string;
  };
  claude: {
    apiKey: string;
    model: string;
  };
  app: {
    nodeEnv: string;
    requestTimeout: number;
    scraperTimeout: number;
    logLevel: string;
  };
}

export const ENV: EnvironmentConfig = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '25000', 10),
    scraperTimeout: parseInt(process.env.SCRAPER_TIMEOUT || '10000', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

export function validateEnv(): void {
  const required = [
    { key: 'SLACK_BOT_TOKEN', value: ENV.slack.botToken },
    { key: 'SLACK_SIGNING_SECRET', value: ENV.slack.signingSecret },
    { key: 'CLAUDE_API_KEY', value: ENV.claude.apiKey },
  ];

  const missing = required.filter(({ value }) => !value).map(({ key }) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please copy .env.example to .env and fill in the values.`
    );
  }
}
