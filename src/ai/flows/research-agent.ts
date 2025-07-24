
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
    // Step 1: Use the tool to perform the search.
    const searchResponse = await ai.generate({
      prompt: `Use the web search tool to find information about "${input.topic}".`,
      tools: [webSearchTool],
      model: 'googleai/gemini-2.0-flash', // Specify a model that supports tool use.
    });
    
    const searchResults = searchResponse.toolCalls(webSearchTool.name).map(call => call.output) as SearchResult[][];
    const flatResults = searchResults.flat();
    
    if (flatResults.length === 0) {
      return {
        report: "I couldn't find any information on that topic. Please try a different query.",
        sources: [],
      };
    }

    // Step 2: Synthesize the results into a report.
    const synthesisPrompt = `You are a research analyst. Synthesize the following search results into a comprehensive report on the topic: "${input.topic}".
    The report should be well-structured, easy to read, and formatted in Markdown. It should include sections like Introduction, Key Concepts, and Conclusion.
    
    Search Results:
    ${flatResults.map(r => `### ${r.title}\n**URL:** ${r.url}\n**Snippet:** ${r.snippet}`).join('\n\n')}
    `;

    const synthesisResponse = await ai.generate({
      prompt: synthesisPrompt,
    });

    return {
      report: synthesisResponse.text,
      sources: flatResults.map(r => ({ title: r.title, url: r.url })),
    };
  }
);
