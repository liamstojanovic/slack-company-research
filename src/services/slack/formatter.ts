import { CompanyAnalysis } from '../../types/company.types';

function getGradeEmoji(grade: string): string {
  const emojiMap: Record<string, string> = {
    'A+': '✨',
    'A': '⭐',
    'B+': '🌟',
    'B': '💫',
    'C+': '⚡',
    'C': '💡',
    'D': '📌',
  };
  return emojiMap[grade] || '📊';
}

function formatLinkedIn(url: string): string {
  if (url === 'Not found' || url === 'Unable to determine' || !url.startsWith('http')) {
    return 'Not found';
  }
  return `<${url}|View LinkedIn Profile>`;
}

function generateCopyPasteText(data: CompanyAnalysis): string {
  const lines = [
    `Name: ${data.company_name}`,
    `Website: ${data.website}`,
    `LinkedIn: ${data.linkedin_url}`,
    `Account Grade: ${data.account_grade} (${data.grade_reasoning})`,
    `Company HQ: ${data.headquarters}`,
    `Industry and their business: ${data.industry} - ${data.business_description}`,
    `Additional Information:`,
    ...data.additional_info.map(info => `• ${info}`),
  ];

  return lines.join('\n');
}

export function formatSlackMessage(
  data: CompanyAnalysis,
  processingTime: string
): any {
  const gradeEmoji = getGradeEmoji(data.account_grade);

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🏢 Company Research: ${data.company_name}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${data.company_name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Account Grade:*\n${gradeEmoji} ${data.account_grade}`,
          },
          {
            type: 'mrkdwn',
            text: `*Website:*\n<${data.website}|${data.website}>`,
          },
          {
            type: 'mrkdwn',
            text: `*LinkedIn:*\n${formatLinkedIn(data.linkedin_url)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Company HQ:*\n${data.headquarters}`,
          },
          {
            type: 'mrkdwn',
            text: `*Industry:*\n${data.industry}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Business Description:*\n${data.business_description}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Additional Information:*\n${data.additional_info.map(info => `• ${info}`).join('\n')}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📊 Research completed in ${processingTime}s | Powered by Claude AI`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📋 Copy-Paste Format:*\n\`\`\`${generateCopyPasteText(data)}\`\`\``,
        },
      },
    ],
  };
}

export function formatErrorMessage(companyName: string, error: string): any {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `❌ Research Failed: ${companyName}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error:* ${error}\n\nPlease try again or contact support if the issue persists.`,
        },
      },
    ],
  };
}
