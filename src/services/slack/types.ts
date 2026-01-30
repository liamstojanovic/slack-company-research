// Slack slash command payload structure
// See: https://api.slack.com/interactivity/slash-commands#app_command_handling
export interface SlackSlashCommandPayload {
    token: string;
    team_id: string;
    team_domain: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    command: string;
    text: string;
    response_url: string;
    trigger_id: string;
    api_app_id: string;
}
