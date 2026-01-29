// Startuo-specific methods.
export function getEnv(): { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN: string, CLAUDE_API_KEY: string, CLAUDE_MODEL: string } {
    const { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN, CLAUDE_API_KEY, CLAUDE_MODEL } = process.env;
    if (!SLACK_BOT_USER_OAUTH_ACCESS_TOKEN || !CLAUDE_API_KEY || !CLAUDE_MODEL) {
        console.error("One or more required environment variables are undefined");
        process.exit(1);
    }
    return { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN, CLAUDE_API_KEY, CLAUDE_MODEL };
}