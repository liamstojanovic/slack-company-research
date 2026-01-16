import { WebClient } from "@slack/web-api";


export const sendMessage = async (client: WebClient, channel?: string): Promise<void>  => {
    // This function can be tweaked to accept arbitrary text input
    // Split the Anthropic response and response formatting into separate files
    if (!channel) {
        await client.chat.postMessage({
            channel: "#general",
            text: "Hello Liam!"
        });
        return;
    };

    await client.chat.postMessage({
        channel,
        text: "Hello world!"
    });
};