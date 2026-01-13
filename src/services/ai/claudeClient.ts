import Anthropic from '@anthropic-ai/sdk';
import { ENV } from '../../config/environment';
import { logger } from '../../utils/logger';
import { retryWithBackoff } from '../../utils/retry';
import { CompanyAnalysis, ScrapedData, LinkedInData } from '../../types/company.types';
import { buildAnalysisPrompt } from './prompts';

const anthropic = new Anthropic({
  apiKey: ENV.claude.apiKey,
});

export async function analyzeCompany(input: {
  companyName: string;
  websiteUrl: string;
  scrapedData: ScrapedData;
  linkedInData: LinkedInData;
}): Promise<CompanyAnalysis> {
  const startTime = Date.now();
  logger.info('Starting Claude AI analysis', { company: input.companyName });

  try {
    const prompt = buildAnalysisPrompt(
      input.companyName,
      input.websiteUrl,
      input.scrapedData,
      input.linkedInData
    );

    const response = await retryWithBackoff(
      async () => {
        return await anthropic.messages.create({
          model: ENV.claude.model,
          max_tokens: 2000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });
      },
      {
        maxRetries: 2,
        initialDelay: 1000,
      }
    );

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('No JSON found in Claude response', { response: content.text });
      throw new Error('No JSON found in Claude response');
    }

    const analysis: CompanyAnalysis = JSON.parse(jsonMatch[0]);

    validateAnalysis(analysis);

    const duration = Date.now() - startTime;
    logger.info('Claude AI analysis completed', {
      company: input.companyName,
      grade: analysis.account_grade,
      duration: `${duration}ms`,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    });

    return analysis;
  } catch (error) {
    logger.error('Claude AI analysis failed', {
      company: input.companyName,
      error: (error as Error).message,
    });

    return {
      company_name: input.companyName,
      website: input.websiteUrl,
      linkedin_url: input.linkedInData.url,
      headquarters: input.scrapedData.headquarters || 'Unable to determine',
      industry: 'Unable to determine',
      business_description:
        input.scrapedData.description ||
        'Unable to analyze company. Please visit the website for more information.',
      account_grade: 'D',
      grade_reasoning: 'Analysis failed - insufficient data',
      additional_info: [
        'AI analysis encountered an error',
        'Manual review recommended',
        'Raw data available but not processed',
      ],
    };
  }
}

function validateAnalysis(analysis: CompanyAnalysis): void {
  const requiredFields: (keyof CompanyAnalysis)[] = [
    'company_name',
    'website',
    'linkedin_url',
    'headquarters',
    'industry',
    'business_description',
    'account_grade',
    'grade_reasoning',
    'additional_info',
  ];

  for (const field of requiredFields) {
    if (!analysis[field]) {
      logger.warn('Missing field in analysis', { field });
      analysis[field] = 'Not found' as any;
    }
  }

  const validGrades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D'];
  if (!validGrades.includes(analysis.account_grade)) {
    logger.warn('Invalid grade, defaulting to D', { grade: analysis.account_grade });
    analysis.account_grade = 'D';
  }

  if (!Array.isArray(analysis.additional_info) || analysis.additional_info.length === 0) {
    analysis.additional_info = ['No additional information available'];
  }
}
