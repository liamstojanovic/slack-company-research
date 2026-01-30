import { WebClient } from "@slack/web-api";

// Create the Slack client in one place (like `index.ts`) and use that for any Slack-related requests
export const createSlackWebClient = (accessToken: string) => {
    const web = new WebClient(accessToken);

    return web;
}
// I think it's okay for this file to export its own methods and act as a barrel file. We can organize this file to strictly be the latter if needed.
export * from "./sendMessage";
export * from "./commands/research"