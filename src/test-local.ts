import { validateEnv } from './config/environment';
import { processCompanyResearch } from './handlers/asyncProcessor';
import { logger } from './utils/logger';

async function testResearch() {
  try {
    logger.info('=== Starting Local Test ===');

    validateEnv();
    logger.info('✓ Environment variables validated');

    const testCompany = process.argv[2] || 'Meta';
    const testWebsite = process.argv[3] || 'meta.com';

    logger.info('Testing company research', {
      company: testCompany,
      website: testWebsite,
    });

    await processCompanyResearch({
      companyName: testCompany,
      websiteUrl: testWebsite,
      responseUrl: 'http://localhost:3000/test',
      userId: 'test-user',
      channelId: 'test-channel',
    });

    logger.info('=== Test Completed Successfully ===');
  } catch (error) {
    logger.error('Test failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    process.exit(1);
  }
}

testResearch();
