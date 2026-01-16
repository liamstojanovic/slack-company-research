# Overview

A bot that performs basic organization research, invoked via Slash command (`/research "XYZ Corp"`).

## Required service providers

- Slack workspace, slack app
- Anthropic Platform API key

## Getting started

Copy `.example.env` to `.env`. Fill in missing values.

# Required Slack OAuth permissions

- `chat:write`
- `commands`

These two permissions grant the bot user the ability to send messages and register slash commands.

