
'use server';

/**
 * @fileOverview A Gmail assistant agent that uses tools from an external n8n workflow via MCP.
 */

import { ai } from '@/ai/genkit';
import { n8nClient } from '@/ai/mcp';
import { z } from 'zod';

const GmailAssistantInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the Gmail assistant.'),
});
export type GmailAssistantInput = z.infer<typeof GmailAssistantInputSchema>;

const GmailAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response or the result of the action.'),
});
export type GmailAssistantOutput = z.infer<typeof GmailAssistantOutputSchema>;

export async function runGmailAssistant(
  input: GmailAssistantInput
): Promise<GmailAssistantOutput> {
  return gmailAssistantFlow(input);
}

const gmailAssistantFlow = ai.defineFlow(
  {
    name: 'gmailAssistantFlow',
    inputSchema: GmailAssistantInputSchema,
    outputSchema: GmailAssistantOutputSchema,
  },
  async ({ prompt }) => {
    // Ensure the MCP client is ready and connected before proceeding.
    await n8nClient.ready();

    // Dynamically get the latest tools available from the n8n MCP server.
    const mcpTools = await n8nClient.getActiveTools(ai);

    const systemPrompt = `You are a helpful Gmail assistant.
    Your task is to understand the user's request and use the available tools to perform actions in their Gmail account.
    Available tools are provided by an external n8n workflow.
    When summarizing emails, present the key information clearly and concisely.
    When drafting emails, use the createDraft tool. Do not just say you've created it, call the tool.
    If you cannot fulfill a request with the available tools, inform the user.`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      system: systemPrompt,
      tools: mcpTools,
      model: 'googleai/gemini-1.5-flash-latest',
    });

    const toolCalls = llmResponse.toolCalls;
    // If the model made a tool call, return the output of the first tool call.
    if (toolCalls && toolCalls.length > 0) {
      const toolOutput = toolCalls[0].output;
      // Stringify the tool output so it can be displayed in the UI.
      return { response: JSON.stringify(toolOutput, null, 2) };
    }

    // Otherwise, return the model's text response.
    return {
      response: llmResponse.text,
    };
  }
);
