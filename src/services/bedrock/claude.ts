import {
    BedrockRuntimeClient,
    ConverseCommand,
    type Message,
} from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

const CLAUDE_HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

// Create Bedrock client using default credential chain
// - On Lambda: uses execution role credentials automatically
// - Locally: uses AWS_PROFILE env var if set
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    ...(process.env.AWS_PROFILE && {
        credentials: fromIni({ profile: process.env.AWS_PROFILE }),
    }),
});

// Research a company domain using Claude Haiku via AWS Bedrock
export async function researchCompany(companyDomain: string): Promise<string> {
    const systemPrompt = `You are a business research assistant. When given a company domain, research the company and provide information in the following exact format:

*Name:* [Company name]
*Website:* [Company website URL]
*LinkedIn:* [Company LinkedIn URL if available, otherwise "Not found"]
*Company Age:* [How long the company has existed, e.g., "Founded in 2004 (20 years)"]
*Founder Name:* [Name of founder(s)]
*Founder LinkedIn:* [Founder's LinkedIn URL if available, otherwise "Not found"]
*Industry:* [Industry name] - [Brief industry description]
*Additional Information:*
• [Relevant fact 1]
• [Relevant fact 2]
• [Additional relevant facts as bullet points]

Use Slack formatting: *bold* for field labels, • for bullet points. If you cannot find reliable information for a field, indicate "Not found" or "Unknown". Be concise but informative.`;

    const userMessage: Message = {
        role: "user",
        content: [
            {
                text: `Please research the company at this domain: ${companyDomain}`,
            },
        ],
    };

    const command = new ConverseCommand({
        modelId: CLAUDE_HAIKU_MODEL_ID,
        messages: [userMessage],
        system: [{ text: systemPrompt }],
        inferenceConfig: {
            maxTokens: 1024,
            temperature: 0.7,
        },
    });

    const response = await bedrockClient.send(command);

    const outputMessage = response.output?.message;
    if (!outputMessage || !outputMessage.content || outputMessage.content.length === 0) {
        throw new Error("No response content from Claude");
    }

    const textContent = outputMessage.content[0];
    if (!("text" in textContent) || !textContent.text) {
        throw new Error("Unexpected response format from Claude");
    }

    return textContent.text;
}
