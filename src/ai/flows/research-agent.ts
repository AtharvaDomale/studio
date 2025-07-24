
'use server';

/**
 * @fileOverview An AI agent that conducts research on a given topic.
 *
 * This agent uses a web search tool to gather information and then synthesizes
 * it into a structured report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the schema for the web search tool's output.
const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  url: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet of the content.'),
});
type SearchResult = z.infer<typeof SearchResultSchema>;

// Define the input for the research agent.
const ResearchAgentInputSchema = z.object({
  topic: z.string().describe('The topic to research.'),
});
export type ResearchAgentInput = z.infer<typeof ResearchAgentInputSchema>;

// Define the output for the research agent.
const ResearchAgentOutputSchema = z.object({
  report: z.string().describe('A structured research report in Markdown format.'),
  sources: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
  })).describe('A list of sources used for the report.'),
});
export type ResearchAgentOutput = z.infer<typeof ResearchAgentOutputSchema>;

// Define a mock web search tool.
const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search for the given query and returns a list of results.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(SearchResultSchema),
  },
  async ({ query }) => {
    console.log(`Performing mock search for: ${query}`);
    // In a real application, this would call a search API (e.g., Google Search, Bing, etc.).
    // For this prototype, we'll return a set of mock results.
    return [
      {
        title: `The Ultimate Guide to ${query}`,
        url: `https://example.com/guide-to-${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `An in-depth article covering all aspects of ${query}, from its history to its modern applications. A must-read for anyone interested in the topic.`,
      },
      {
        title: `A Beginner's Introduction to ${query}`,
        url: `https://example.com/intro-to-${query.toLowerCase().replace(/\s+/g, '-')}`,
        snippet: `New to ${query}? This article breaks down the basics in an easy-to-understand way, with helpful examples and illustrations.`,
      },
      {
        title: `${query} - Wikipedia`,
        url: `https://en.wikipedia.org/wiki/${query.replace(/\s+/g, '_')}`,
        snippet: `The official Wikipedia entry for ${query}, providing a comprehensive overview, historical context, and links to related subjects.`,
      },
    ];
  }
);

// The main exported function that clients will call.
export async function runResearchAgent(input: ResearchAgentInput): Promise<ResearchAgentOutput> {
  return researchAgentFlow(input);
}


const researchAgentFlow = ai.defineFlow(
  {
    name: 'researchAgentFlow',
    inputSchema: ResearchAgentInputSchema,
    outputSchema: ResearchAgentOutputSchema,
  },
  async (input) => {

    const llmResponse = await ai.generate({
        prompt: `Please provide a detailed research report on the topic: "${input.topic}".
        
        Your task is to:
        1.  Use the web search tool to find relevant information on the topic.
        2.  Synthesize the information from the search results into a comprehensive report.
        3.  The report should be well-structured, easy to read, and formatted in Markdown. It should include sections like Introduction, Key Concepts, and Conclusion.
        4.  Extract the titles and URLs from the search results you used and include them in the 'sources' field of the final output.`,
        output: {
            schema: ResearchAgentOutputSchema,
        },
        tools: [webSearchTool],
    });

    const output = llmResponse.output;

    if (!output) {
        throw new Error("The research agent failed to generate a report.");
    }

    return output;
  }
);
