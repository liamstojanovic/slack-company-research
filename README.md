# Slack Company Research Integration

Automate company research for your presales team with a simple Slack slash command. Uses AI-powered analysis with Claude to gather and format company information.

## Features

- **Slash Command**: Simple `/research [Company Name] [Website URL]` command
- **AI-Powered Analysis**: Uses Claude AI for intelligent company grading and insights
- **Web Scraping**: Automatically extracts data from company websites
- **LinkedIn Search**: Finds company LinkedIn profiles
- **Copy-Paste Ready**: Formatted output ready for presales documentation
- **Fast & Serverless**: Deployed on Vercel with automatic scaling

## Output Format

```
Name: [Company Name]
Website: [URL]
LinkedIn: [LinkedIn URL or "Not found"]
Account Grade: [A+/A/B+/B/C+/C/D]
Company HQ: [City, State/Country]
Industry and their business: [Description]
Additional Information:
• [Key insight 1]
• [Key insight 2]
• [Key insight 3]
```

## Prerequisites

1. **Slack Workspace** (with admin access to create apps)
2. **Claude API Key** (from https://console.anthropic.com/)
3. **Vercel Account** (free tier works - sign up at https://vercel.com)

## Setup Instructions

### Step 1: Clone and Install

```bash
cd slack-company-research
npm install
```

### Step 2: Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Get these from Slack after creating your app (Step 3)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here

# Get this from Claude AI
CLAUDE_API_KEY=sk-ant-your-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Optional - defaults shown
NODE_ENV=development
REQUEST_TIMEOUT=25000
SCRAPER_TIMEOUT=10000
LOG_LEVEL=info
```

### Step 3: Create Slack App

1. Go to https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name it: **"Company Research Bot"**
4. Select your workspace

#### Configure Slash Command

1. In the left sidebar, click **"Slash Commands"**
2. Click **"Create New Command"**
3. Fill in:
   - **Command**: `/research`
   - **Request URL**: `https://your-app.vercel.app/api/slack/command` (update after deployment)
   - **Short Description**: `Research a company and get AI insights`
   - **Usage Hint**: `[Company Name] [Website URL]`
4. Click **"Save"**

#### Add OAuth Scopes

1. In the left sidebar, click **"OAuth & Permissions"**
2. Scroll to **"Scopes"** → **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"** and add:
   - `chat:write` - Post messages to channels
   - `commands` - Add slash commands

#### Install App to Workspace

1. Scroll up to **"OAuth Tokens for Your Workspace"**
2. Click **"Install to Workspace"**
3. Click **"Allow"**
4. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`) to your `.env` file

#### Get Signing Secret

1. In the left sidebar, click **"Basic Information"**
2. Scroll to **"App Credentials"**
3. Copy the **"Signing Secret"** to your `.env` file

### Step 4: Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **"API Keys"**
4. Click **"Create Key"**
5. Copy the key (starts with `sk-ant-`) to your `.env` file

### Step 5: Local Testing (Optional)

Test the research pipeline locally before deploying:

```bash
npm run dev
```

This will test with Meta by default. To test with a different company:

```bash
npm run dev "Stripe" "stripe.com"
```

Note: The local test won't post to Slack, but will log the results.

### Step 6: Deploy to Vercel

#### Install Vercel CLI

```bash
npm install -g vercel
```

#### Login to Vercel

```bash
vercel login
```

#### Deploy

```bash
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? Press Enter (uses directory name)
- Directory? Press Enter (current directory)
- Override settings? **N**

#### Set Environment Variables in Vercel

After deployment, set your environment variables:

```bash
vercel env add SLACK_BOT_TOKEN
vercel env add SLACK_SIGNING_SECRET
vercel env add CLAUDE_API_KEY
```

Paste each value when prompted.

Or set them via the Vercel dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable

#### Redeploy with Environment Variables

```bash
vercel --prod
```

Your app is now live! Copy the deployment URL (e.g., `https://your-app.vercel.app`).

### Step 7: Update Slack Command URL

1. Go back to https://api.slack.com/apps
2. Select your app
3. Go to **"Slash Commands"**
4. Click on the `/research` command
5. Update **Request URL** to: `https://your-app.vercel.app/api/slack/command`
6. Click **"Save"**

## Usage

In any Slack channel where the bot is installed:

```
/research Meta Meta.com
```

The bot will:
1. Immediately respond with "🔍 Researching Meta... This may take 15-20 seconds."
2. Scrape the company website
3. Search for LinkedIn profile
4. Analyze with Claude AI
5. Post formatted results in ~15-20 seconds

## Example Output

The bot will post a rich formatted message with:
- Company name and grade (with emoji)
- Website and LinkedIn links
- Headquarters location
- Industry and business description
- Additional insights
- Copy-pasteable plain text format

## Troubleshooting

### "Missing required environment variables"

Make sure you've set all required variables in Vercel:
```bash
vercel env ls
```

Should show: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `CLAUDE_API_KEY`

### "Invalid signature" error

Check that:
1. Your `SLACK_SIGNING_SECRET` is correct
2. Your Slack app's Request URL is correct

### Command times out

This usually means the async processing is failing. Check Vercel logs:

```bash
vercel logs
```

### Website scraping fails

Some websites block scrapers. The bot will continue with limited data and mark it in the results.

### Claude API errors

Check your API key is valid and you have credits available at https://console.anthropic.com/

## Cost Estimation

For 500 requests/month:
- **Vercel**: $0 (free tier)
- **Claude API**: ~$15-30 (2-3 cents per request)
- **Total**: $15-30/month

## Architecture

```
User → Slack → Vercel Function → {
  Website Scraper
  LinkedIn Search
  Claude AI Analysis
} → Formatted Results → Slack
```

## File Structure

```
slack-company-research/
├── api/slack/command.ts          # Vercel entry point
├── src/
│   ├── handlers/asyncProcessor.ts    # Main orchestration
│   ├── services/
│   │   ├── scraper/websiteScraper.ts # Web scraping
│   │   ├── scraper/linkedinSearch.ts # LinkedIn search
│   │   ├── ai/claudeClient.ts        # Claude AI integration
│   │   ├── slack/formatter.ts        # Message formatting
│   │   └── slack/slackClient.ts      # Slack API wrapper
│   └── config/environment.ts         # Configuration
└── package.json
```

## Future Enhancements

- Caching to reduce duplicate lookups
- Database to store research history
- Batch mode for multiple companies
- Custom grading criteria
- Additional data sources

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Vercel logs: `vercel logs`
3. Check your environment variables are set correctly

## License

MIT
