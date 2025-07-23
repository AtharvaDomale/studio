
'use server';

/**
 * @fileOverview A general-purpose AI assistant that can use tools to perform tasks.
 *
 * This assistant can handle tasks like creating calendar events, sending emails,
 * and creating notes in Google Keep. The tools are simulated for this prototype.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


// Define the schema for the assistant's input
const AssistantInputSchema = z.object({
  query: z.string().describe('The user\'s request or question.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;


// Define the schema for the assistant's output
const AssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s response, summarizing the action taken.'),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

// Export the main function that the client will call
export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}


// Tool: Add a calendar event
const addCalendarEvent = ai.defineTool(
  {
    name: 'addCalendarEvent',
    description: 'Creates a new event in the user\'s calendar.',
    inputSchema: z.object({
      title: z.string().describe('The title of the calendar event.'),
      description: z.string().optional().describe('A brief description of the event.'),
      date: z.string().describe('The date of the event (e.g., "YYYY-MM-DD").'),
      time: z.string().optional().describe('The time of the event (e.g., "HH:MM").'),
      durationMinutes: z.number().optional().describe('The duration of the event in minutes.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real application, this would integrate with Google Calendar API.
    // For this prototype, we just log the action.
    console.log('SIMULATING: Adding calendar event', input);
    return `Successfully scheduled the event: "${input.title}" on ${input.date}.`;
  }
);


// Tool: Send an email
const sendEmail = ai.defineTool(
  {
    name: 'sendEmail',
    description: 'Sends an email to a specified recipient.',
    inputSchema: z.object({
      recipient: z.string().email().describe('The email address of the recipient.'),
      subject: z.string().describe('The subject line of the email.'),
      body: z.string().describe('The content of the email.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real application, this would integrate with the Gmail API.
    console.log('SIMULATING: Sending email', input);
    return `Successfully sent an email to ${input.recipient} with the subject "${input.subject}".`;
  }
);


// Tool: Add a note to Google Keep
const addKeepNote = ai.defineTool(
  {
    name: 'addKeepNote',
    description: 'Creates a new note in Google Keep.',
    inputSchema: z.object({
      title: z.string().describe('The title of the note.'),
      content: z.string().describe('The body content of the note.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real application, this would integrate with the Google Keep API.
    console.log('SIMULATING: Adding Keep note', input);
    return `Successfully created a new note in Google Keep with the title "${input.title}".`;
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
    const llmResponse = await ai.generate({
      prompt: input.query,
      model: 'googleai/gemini-2.0-flash', // A model that supports tool use
      tools: [addCalendarEvent, sendEmail, addKeepNote],
      system: `You are a helpful teacher's assistant.
      When asked to perform an action, use the available tools.
      If a tool is used, summarize the result of the tool call in your response.
      If you don't have a tool for the request, simply respond as a helpful AI assistant.`
    });

    return {
      response: llmResponse.text,
    };
  }
);
