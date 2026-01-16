import { getEnv } from "./startup";
import { createSlackWebClient } from "./slack";
import { WebClient } from "@slack/web-api";
import { sendMessage } from "./slack/sendMessage";

(() => {
    // Load in environment variables
    const env = getEnv();

    // Create Slack web client
    const web: WebClient = createSlackWebClient(env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN);
    // Test send a message
    try {
        sendMessage(web);
    } catch (error) {
        console.error({error});
    }
    // This only runs once. Once the message sends, or fails to send, the program exits.

    // Likely, Slack's slash command method(s) in their web api probably support registering a callback from a slash command invocation.
    // That logic would go here, and run perpetually.

})();