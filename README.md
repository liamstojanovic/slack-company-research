# Slack Research Bot

A Slack bot that performs company research using Claude AI (via AWS Bedrock), invoked via the `/research` slash command.

## Features

- `/research meta.com` - Research a company by domain
- Returns structured company information: name, website, LinkedIn, founder details, industry, and more
- Powered by Claude Haiku via AWS Bedrock

## Prerequisites

- Node.js 20+
- AWS account with Bedrock access (Claude models enabled in us-east-1)
- Slack workspace with admin access to create apps

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd slack-company-research
npm install
```

### 2. Configure environment

```bash
cp .example.env .env
```

Edit `.env` and set:
- `SLACK_BOT_USER_OAUTH_ACCESS_TOKEN` - Your Slack bot token (starts with `xoxb-`)
- `AWS_PROFILE` - Your AWS profile name (for local development)

### 3. Run locally

```bash
npm run dev
```

Server runs on `http://localhost:3000`.

### 4. Expose for Slack (local testing)

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

### 5. Configure Slack App

1. Create a Slack app at https://api.slack.com/apps
2. Add the `/research` slash command with Request URL: `https://your-ngrok-url.ngrok.io/slack/commands/research`
3. Install the app to your workspace

## Slack App Configuration

### Required OAuth Scopes

- `chat:write` - Send messages
- `commands` - Register slash commands

### Slash Command Setup

| Setting | Value |
|---------|-------|
| Command | `/research` |
| Request URL | `https://your-server/slack/commands/research` |
| Short Description | Research a company |
| Usage Hint | `[company domain]` |

## Deployment

### EC2 Deployment

```bash
export AWS_PROFILE=your-profile
source .env
./deploy/deploy-ec2.sh
```

This creates:
- EC2 instance (t3.micro) with Node.js
- IAM role with Bedrock access
- Security group (ports 22, 3000)
- SSH key pair

After deployment, set up ngrok on the instance for a public URL.

### Lambda Deployment (if permitted)

```bash
export AWS_PROFILE=your-profile
source .env
./deploy/deploy-lambda.sh
```

Note: Requires `lambda:CreateFunction` permission (may be blocked by SCPs).

## Project Structure

```
src/
├── index.ts              # Local server entry point
├── app.ts                # Express app configuration
├── lambda.ts             # Lambda handler (for serverless deployment)
├── startup.ts            # Environment validation
└── services/
    ├── bedrock/
    │   └── claude.ts     # AWS Bedrock Claude integration
    └── slack/
        ├── commands/
        │   └── research.ts   # /research command handler
        ├── respond.ts        # response_url helper
        └── types.ts          # Slack payload types
deploy/
├── deploy-ec2.sh         # EC2 deployment script
└── deploy-lambda.sh      # Lambda deployment script
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_USER_OAUTH_ACCESS_TOKEN` | Yes | Slack bot OAuth token |
| `AWS_PROFILE` | Local only | AWS credentials profile |
| `AWS_REGION` | No | AWS region (default: us-east-1) |
| `PORT` | No | Server port (default: 3000) |

## Usage

```
/research meta.com
```

Returns:
- Company name and website
- LinkedIn URL
- Company age and founding date
- Founder name and LinkedIn
- Industry description
- Additional relevant information

## License

UNLICENSED
