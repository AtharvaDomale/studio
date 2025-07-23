
'use server';

/**
 * @fileOverview A general-purpose AI assistant that can use tools to perform tasks.
 *
 * This assistant can handle tasks like creating calendar events, sending emails,
 * creating worksheets, logging student behavior, and finding educational resources.
 * It also supports continuous conversation and can extract text from images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MediaPart } from 'genkit';

// Define a schema for a single message in the chat history
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({
    text: z.string().optional(),
    media: z.object({
      url: z.string(),
    }).optional(),
  }))
});

// Define the schema for the assistant's input, which now includes chat history
const AssistantInputSchema = z.object({
  history: z.array(MessageSchema),
  image: z.string().optional().describe(
    "An optional image for context, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  query: z.string().describe("The user's current request or question."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


// Define the schema for the assistant's output
const AssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response, summarizing the action taken or answering the question.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Export the main function that the client will call
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}


// Tool: A unified Firebase tool that can call any MCP function
const firebaseTool = ai.defineTool(
    {
      name: 'firebase',
      description: 'Interacts with the user\'s Firebase project. Use this to manage and query data in Firestore, Authentication, and other Firebase services.',
      inputSchema: z.object({
        method: z.string().describe('The Firebase MCP method to call (e.g., "firestore_query_collection", "auth_list_users").'),
        params: z.any().describe('An object containing the parameters for the specified method.'),
      }),
      outputSchema: z.any(),
    },
    async (input) => {
      // This is a pass-through to the native MCP tool.
      // Genkit will route this to the 'firebase' MCP server defined in .idx/mcp.json
      return input;
    }
);


// Define the main assistant flow
const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {

    const currentMessage: (string | MediaPart)[] = [{ text: input.query }];
    if (input.image) {
      currentMessage.push({ media: { url: input.image }});
    }

    const llmResponse = await ai.generate({
      history: input.history,
      prompt: currentMessage,
      model: 'googleai/gemini-2.0-flash', // A model that supports tool use and vision
      tools: [ firebaseTool ],
      system: `You are a helpful teacher's assistant AI, integrated directly with this user's Firebase project.
      Your primary job is to help teachers with their daily administrative and data management tasks by using the 'firebase' tool you have available.
      You can query Firestore, manage Auth users, and perform other Firebase-related tasks.

      When the user asks you to perform an action, you must use the 'firebase' tool.
      You need to determine the correct 'method' to call from the user's request. For example, if the user asks "how many users are in my project?", you should call the 'firebase' tool with the method set to 'auth_list_users'.

      If the user provides an image, your primary task is to analyze it. If it contains text, extract and format the text. If it is an image without text, describe it.
      When asked to perform an action related to Firebase, use the 'firebase' tool.
      If a tool is used, summarize the result of the tool call in your response in a friendly and professional tone.
      If you don't have a tool for the request, simply respond as a helpful AI assistant and explain that you cannot perform that specific action.
      Do not ask clarifying questions; use the information provided to call the tool or state that you cannot.`,
    });

    const toolResponse = llmResponse.toolRequest;
    if (toolResponse) {
        // If the AI requested a tool, we don't have a text response yet.
        // We need to process the tool's output and feed it back to the AI.
        const toolResult = await toolResponse.output();
        const finalResponse = await ai.generate({
            history: [
                ...input.history,
                llmResponse.message, // Include the AI's first message (the tool request)
                { role: 'tool', content: [toolResult] },
            ],
            prompt: 'The user asked me to perform an action, and I used a tool that returned the following data. Please present this data back to the user in a clear, readable, and well-formatted way. Do not just say what you did; show the result. If the data is a list, format it as such. If it is an error, explain the error clearly.',
        });
        return { response: finalResponse.text };
    }


    return {
      response: llmResponse.text,
    };
  }
);

