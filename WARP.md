# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Run local test (tests research pipeline without Slack, logs results)
npm run dev                          # Tests with Meta by default
npm run dev "Stripe" "stripe.com"    # Test with custom company

# Build TypeScript
npm run build

# Deploy to Vercel
vercel --prod

# View Vercel logs
vercel logs

# Set environment variables in Vercel
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET
vercel env add CLAUDE_API_KEY
```

## Architecture

This is a serverless Slack slash command (`/research`) that performs AI-powered company research, deployed on Vercel.

### Request Flow

```
Slack slash command → api/slack/command.ts (Vercel function)
    ↓ (immediate 200 response with "Researching...")
    ↓ (async background processing)
asyncProcessor.ts orchestrates:
    1. websiteScraper.ts → scrapes company homepage + /about, /contact pages
    2. linkedinSearch.ts → finds LinkedIn company profile
    3. claudeClient.ts → analyzes data and grades the company (A+ to D)
    4. formatter.ts → builds Slack Block Kit message with copy-paste format
    5. slackClient.ts → posts results to Slack response_url
```

### Key Design Patterns

- **Async processing**: The handler immediately returns a 200 to Slack (required within 3s), then processes in background and posts results via `response_url`
- **Retry with backoff**: `utils/retry.ts` wraps Claude API and Slack API calls with exponential backoff
- **Graceful degradation**: LinkedIn search failures don't block the pipeline; Claude client returns fallback response on analysis failure

### Environment Variables

Required: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `CLAUDE_API_KEY`

Optional: `CLAUDE_MODEL` (default: claude-3-5-sonnet-20241022), `REQUEST_TIMEOUT`, `SCRAPER_TIMEOUT`, `LOG_LEVEL`

### Type Definitions

All interfaces are in `src/types/company.types.ts`:
- `ResearchRequest` - incoming request data
- `ScrapedData` - website scraping results
- `LinkedInData` - LinkedIn search results
- `CompanyAnalysis` - Claude's structured analysis output
- `SlackCommandPayload` - Slack slash command payload

### AI Prompt

The Claude prompt in `src/services/ai/prompts.ts` expects JSON output with company grade (A+ to D) based on company size, market position, and data quality. The prompt includes specific grading criteria.
