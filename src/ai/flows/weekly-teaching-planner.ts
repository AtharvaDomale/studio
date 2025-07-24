
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a weekly teaching plan based on teacher input.
 *
 * - generateWeeklyPlan - A function that generates a weekly teaching plan.
 * - WeeklyTeachingPlanInput - The input type for the generateWeeklyPlan function.
 * - WeeklyTeachingPlanOutput - The return type for the generateWeeklyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WeeklyTeachingPlanInputSchema = z.object({
  teachingGoals: z
    .string()
    .describe('The teaching goals for the week, including subjects, topics, and desired learning outcomes.'),
  constraints: z
    .string()
    .describe(
      'Any constraints or limitations for the week, such as time restrictions, resource limitations, or student needs.'
    ),
  language: z.string().describe('The language for the output.'),
});
export type WeeklyTeachingPlanInput = z.infer<typeof WeeklyTeachingPlanInputSchema>;

const WeeklyTeachingPlanOutputSchema = z.object({
  weeklyPlan: z
    .string()
    .describe('A detailed weekly teaching plan, including daily activities, assignments, and assessments, in a readable format.'),
});
export type WeeklyTeachingPlanOutput = z.infer<typeof WeeklyTeachingPlanOutputSchema>;

export async function generateWeeklyPlan(
  input: WeeklyTeachingPlanInput
): Promise<WeeklyTeachingPlanOutput> {
  return weeklyTeachingPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklyTeachingPlanPrompt',
  input: {schema: WeeklyTeachingPlanInputSchema},
  output: {schema: WeeklyTeachingPlanOutputSchema},
  prompt: `You are an AI assistant designed to help teachers create weekly teaching plans.

  Based on the provided teaching goals and constraints, generate a detailed weekly plan that optimizes time and resources. 
  
  The output should be a well-structured and human-readable plan, not a JSON object. Use markdown for formatting if needed.
  The entire plan must be in the following language: {{{language}}}.

  Teaching Goals: {{{teachingGoals}}}
  Constraints: {{{constraints}}}

  Weekly Plan:
  `,
});

const weeklyTeachingPlanFlow = ai.defineFlow(
  {
    name: 'weeklyTeachingPlanFlow',
    inputSchema: WeeklyTeachingPlanInputSchema,
    outputSchema: WeeklyTeachingPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
