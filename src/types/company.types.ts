export interface ScrapedData {
  companyName?: string;
  description?: string;
  headquarters?: string;
  industry?: string;
  aboutText?: string;
  contactInfo?: string;
  employeeCount?: string;
  rawText: string;
}

export interface LinkedInData {
  url: string;
  found: boolean;
}

export interface CompanyAnalysis {
  company_name: string;
  website: string;
  linkedin_url: string;
  headquarters: string;
  industry: string;
  business_description: string;
  company_size?: string;
  account_grade: string;
  grade_reasoning: string;
  additional_info: string[];
}

export interface ResearchRequest {
  companyName: string;
  websiteUrl: string;
  responseUrl: string;
  userId: string;
  channelId: string;
}

export interface SlackCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  api_app_id: string;
  response_url: string;
  trigger_id: string;
}
