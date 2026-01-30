import { Request, Response } from "express";
import { WebClient } from "@slack/web-api";
import { SlackSlashCommandPayload } from "../types";
import { respondToSlashCommand } from "../respond";
import { researchCompany } from "../../bedrock";

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

    // Validate that a company domain was provided
    if (!text || text.trim() === "") {
        await respondToSlashCommand(
            response_url,
            "Please provide a company domain to research. Usage: `/research meta.com`",
            "ephemeral"
        );
        return;
    }

    // Split the input and validate only one argument was provided
    const args = text.trim().split(/\s+/);
    if (args.length > 1) {
        await respondToSlashCommand(
            response_url,
            "Please provide only a single company domain. Usage: `/research meta.com`",
            "ephemeral"
        );
        return;
    }

    const companyDomain = args[0];

    // Send an initial acknowledgment to the user
    await respondToSlashCommand(
        response_url,
        `Got it, ${user_name}! Researching *${companyDomain}*... This may take a moment.`
    );

    try {
        const researchResult = await researchCompany(companyDomain);
        await respondToSlashCommand(
            response_url,
            `*Research results for ${companyDomain}:*\n\n${researchResult}`
        );
    } catch (error) {
        console.error("Error researching company:", error);
        await respondToSlashCommand(
            response_url,
            `Sorry, I encountered an error while researching *${companyDomain}*. Please try again later.`,
            "ephemeral"
        );
    }
}