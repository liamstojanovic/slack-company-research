// Send a response to Slack via the response_url
// This is used to send delayed or follow-up responses to slash commands
export async function respondToSlashCommand(
    responseUrl: string,
    text: string,
    responseType: "in_channel" | "ephemeral" = "in_channel"
): Promise<void> {
    // Log response for testing
    console.log("\n--- Slack Response ---");
    console.log(text);
    console.log("----------------------\n");

    const response = await fetch(responseUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            response_type: responseType,
            text,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to respond to slash command: ${response.status} ${response.statusText}`);
    }
}
