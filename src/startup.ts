// Startup-specific methods.
export function getEnv(): { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN: string } {
    const { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN } = process.env;
    if (!SLACK_BOT_USER_OAUTH_ACCESS_TOKEN) {
        console.error("SLACK_BOT_USER_OAUTH_ACCESS_TOKEN environment variable is required");
        process.exit(1);
    }
    return { SLACK_BOT_USER_OAUTH_ACCESS_TOKEN };
}