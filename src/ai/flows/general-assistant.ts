
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
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real application, this would integrate with Google Calendar API.
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


// Tool: Create a worksheet
const createWorksheet = ai.defineTool(
    {
      name: 'createWorksheet',
      description: 'Generates a simple worksheet or a set of questions about a specific topic.',
      inputSchema: z.object({
        topic: z.string().describe('The topic of the worksheet.'),
        numberOfQuestions: z.number().int().min(1).max(10).describe('The number of questions to create.'),
      }),
      outputSchema: z.string(),
    },
    async (input) => {
      console.log('SIMULATING: Creating worksheet', input);
      return `Successfully created a ${input.numberOfQuestions}-question worksheet about "${input.topic}". It is ready to be printed.`;
    }
);


// Tool: Send a parent update
const sendParentUpdate = ai.defineTool(
    {
        name: 'sendParentUpdate',
        description: "Sends a pre-formatted email update to a student's parent for positive notes or concerns.",
        inputSchema: z.object({
            studentName: z.string().describe("The full name of the student."),
            parentEmail: z.string().email().describe("The parent's email address."),
            updateType: z.enum(['positive', 'concern']).describe("The type of update to send."),
            note: z.string().describe("The specific note or message to include in the email."),
        }),
        outputSchema: z.string(),
    },
    async (input) => {
        console.log('SIMULATING: Sending parent update', input);
        return `Successfully sent a ${input.updateType} update to the parent of ${input.studentName}.`;
    }
);


// Tool: Find an educational resource
const findEducationalResource = ai.defineTool(
    {
        name: 'findEducationalResource',
        description: 'Finds an educational resource like a YouTube video or an article on a given topic.',
        inputSchema: z.object({
            topic: z.string().describe('The topic to search for.'),
            resourceType: z.enum(['YouTube Video', 'Article', 'Interactive Simulation']).describe('The type of resource needed.'),
            gradeLevel: z.string().optional().describe('The target grade level for the resource.'),
        }),
        outputSchema: z.string(),
    },
    async (input) => {
        console.log('SIMULATING: Finding educational resource', input);
        // In a real app, this would call YouTube/Google Search APIs
        return `I found a highly-rated ${input.resourceType} about "${input.topic}" suitable for ${input.gradeLevel || 'all grades'}. I've added a link to it in your resources tab.`;
    }
);


// Tool: Log a student behavioral incident
const logBehavioralIncident = ai.defineTool(
    {
        name: 'logBehavioralIncident',
        description: 'Logs a behavioral incident or note for a specific student in their record.',
        inputSchema: z.object({
            studentName: z.string().describe("The full name of the student."),
            incident: z.string().describe("A brief but clear description of the incident or observation."),
            isPositive: z.boolean().default(false).describe("Whether the note is for a positive behavior."),
        }),
        outputSchema: z.string(),
    },
    async (input) => {
        console.log('SIMULATING: Logging behavioral incident', input);
        // This would integrate with the student-service to update a student's record
        const noteType = input.isPositive ? 'positive note' : 'behavioral incident';
        return `Successfully logged a ${noteType} for ${input.studentName}.`;
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
      tools: [
        addCalendarEvent, 
        sendEmail, 
        createWorksheet,
        sendParentUpdate,
        findEducationalResource,
        logBehavioralIncident
      ],
      system: `You are a helpful teacher's assistant AI.
      Your primary job is to help teachers with their daily administrative and educational tasks by using the specialized tools you have available.
      If the user provides an image, your primary task is to analyze it. If it contains text, extract and format the text. If it is an image without text, describe it.
      When asked to perform an action, use the available tools.
      If a tool is used, summarize the result of the tool call in your response in a friendly and professional tone.
      If you don't have a tool for the request, simply respond as a helpful AI assistant and explain that you cannot perform that specific action.
      Do not ask clarifying questions; use the information provided to call the tool or state that you cannot.`,
    });

    return {
      response: llmResponse.text,
    };
  }
);
