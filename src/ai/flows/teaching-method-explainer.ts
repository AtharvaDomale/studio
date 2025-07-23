'use server';

/**
 * @fileOverview An AI agent that suggests simplified teaching methods based on input content, grade, and subject.
 *
 * - teachingMethodExplainer - A function that suggests teaching methods.
 * - TeachingMethodExplainerInput - The input type for the teachingMethodExplainer function.
 * - TeachingMethodExplainerOutput - The return type for the teachingMethodExplainer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeachingMethodExplainerInputSchema = z.object({
  content: z.string().describe('The lesson content (text, image data URI, or voice data URI).'),
  grade: z.string().describe('The class grade level.'),
  subject: z.string().describe('The subject of the lesson.'),
});
export type TeachingMethodExplainerInput = z.infer<typeof TeachingMethodExplainerInputSchema>;

const TeachingMethodExplainerOutputSchema = z.object({
  teachingMethods: z
    .string()
    .describe('A list of suggested teaching methods tailored to the content and student level.'),
});
export type TeachingMethodExplainerOutput = z.infer<typeof TeachingMethodExplainerOutputSchema>;

export async function teachingMethodExplainer(input: TeachingMethodExplainerInput): Promise<TeachingMethodExplainerOutput> {
  return teachingMethodExplainerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'teachingMethodExplainerPrompt',
  input: {schema: TeachingMethodExplainerInputSchema},
  output: {schema: TeachingMethodExplainerOutputSchema},
  prompt: `You are an experienced teacher. Given the lesson content, class grade, and subject, suggest simplified teaching methods.

Lesson Content: {{{content}}}
Class Grade: {{{grade}}}
Subject: {{{subject}}}

Suggest teaching methods tailored to the content and student level:
`,
});

const teachingMethodExplainerFlow = ai.defineFlow(
  {
    name: 'teachingMethodExplainerFlow',
    inputSchema: TeachingMethodExplainerInputSchema,
    outputSchema: TeachingMethodExplainerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
