import { Request, Response } from "express";
import { WebClient } from "@slack/web-api";
import { SlackSlashCommandPayload } from "../types";
import { respondToSlashCommand } from "../respond";

// Handle the /research slash command
export async function researchCommandHandler(
    req: Request,
    res: Response,
    _slackClient: WebClient
): Promise<void> {
    const payload = req.body as SlackSlashCommandPayload;
    const { text, response_url, user_name } = payload;

    // Acknowledge the command immediately (Slack requires a response within 3 seconds)
    res.status(200).send();

    // Validate that a company was provided
    if (!text || text.trim() === "") {
        await respondToSlashCommand(
            response_url,
            "Please provide a company domain to research. Usage: `/research meta.com`",
            "ephemeral"
        );
        return;
    }

    const companyDomain = text.trim();

    // Send an initial acknowledgment to the user
    await respondToSlashCommand(
        response_url,
        `Got it, ${user_name}! Researching *${companyDomain}*... This may take a moment.`
    );

    // TODO: Implement the actual research logic using Claude API
    // For now, send a placeholder response
    await respondToSlashCommand(
        response_url,
        `Research results for *${companyDomain}*:\n\n_Research functionality coming soon!_`
    );
}