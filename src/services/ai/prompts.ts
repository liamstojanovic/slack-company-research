import { ScrapedData, LinkedInData } from '../../types/company.types';

export function buildAnalysisPrompt(
  companyName: string,
  websiteUrl: string,
  scrapedData: ScrapedData,
  linkedInData: LinkedInData
): string {
  return `You are a B2B sales research analyst. Analyze the following company data and provide a comprehensive research report for a presales team.

COMPANY DATA:
- Company Name (provided): ${companyName}
- Website URL: ${websiteUrl}
- LinkedIn URL: ${linkedInData.url}

SCRAPED WEBSITE DATA:
${JSON.stringify(scrapedData, null, 2)}

INSTRUCTIONS:
1. Analyze all the data provided above
2. Extract and infer key information about the company
3. Assign an account grade based on the criteria below
4. Return ONLY a valid JSON object (no markdown, no code blocks, no additional text)

GRADING CRITERIA:
- **A+ (90-100)**: Large enterprise, 1000+ employees, well-known brand, strong market position, high revenue
- **A (80-89)**: Enterprise company, 500-1000 employees, established presence, growing market position
- **B+ (75-79)**: Mid-market leader, 200-500 employees, solid reputation, regional/industry leader
- **B (70-74)**: Mid-market company, 100-200 employees, established business, stable growth
- **C+ (65-69)**: Small business, 50-100 employees, growing presence, emerging in market
- **C (60-64)**: Small business, 10-50 employees, early stage but established
- **D (<60)**: Very small company (<10 employees), startup, or insufficient data

REQUIRED OUTPUT FORMAT (JSON only, no markdown):
{
  "company_name": "Official full company name",
  "website": "${websiteUrl}",
  "linkedin_url": "${linkedInData.url}",
  "headquarters": "City, State/Country (e.g., 'San Francisco, California' or 'London, UK')",
  "industry": "Primary industry classification",
  "business_description": "2-3 sentence description of what the company does, their products/services, and target market",
  "company_size": "Employee count or range (e.g., '500-1000 employees', '10,000+ employees', 'Approximately 50 employees')",
  "account_grade": "Letter grade (A+, A, B+, B, C+, C, or D)",
  "grade_reasoning": "Brief 1-2 sentence explanation of the grade",
  "additional_info": [
    "Key insight about the company (e.g., recent funding, notable clients, technology stack)",
    "Another important detail for presales (e.g., market position, growth trajectory)",
    "Third relevant insight (e.g., company culture, unique selling proposition)"
  ]
}

IMPORTANT RULES:
1. If any field cannot be determined from the data, use "Unable to determine" or "Not found"
2. Make reasonable inferences based on available data (e.g., website quality, content depth, technology)
3. Be factual and objective - avoid speculation
4. For headquarters, try to infer from contact information, about page, or mentions in text
5. For company_size, look for team pages, about sections, or make educated guesses based on content
6. Return ONLY the JSON object - no explanatory text before or after
7. Ensure all JSON is properly formatted and valid

Return your analysis now as a JSON object:`;
}
