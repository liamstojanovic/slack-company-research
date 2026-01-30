import express from "express";
import { getEnv } from "./startup";
import { createSlackWebClient } from "./services/slack";
import { researchCommandHandler } from "./services/slack/commands/research";

const app = express();
const PORT = process.env.PORT || 3000;

// Parse URL-encoded bodies (Slack sends slash command payloads as application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Load environment variables
const env = getEnv();

// Create Slack web client
const slackClient = createSlackWebClient(env.SLACK_BOT_USER_OAUTH_ACCESS_TOKEN);

// Health check endpoint
app.get("/health", (_req, res) => {
    res.status(200).send("OK");
});

// Slack slash command endpoint for /research
app.post("/slack/commands/research", (req, res) => {
    researchCommandHandler(req, res, slackClient);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});