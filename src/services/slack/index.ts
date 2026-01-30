import { WebClient } from "@slack/web-api";

// Create the Slack client in one place (like `index.ts`) and use that for any Slack-related requests
export const createSlackWebClient = (accessToken: string) => {
    const web = new WebClient(accessToken);

    return web;
}

export * from "./types";
export * from "./respond";
export * from "./sendMessage";
export * from "./commands/research";