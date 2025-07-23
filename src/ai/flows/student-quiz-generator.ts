'use server';

/**
 * @fileOverview AI-powered quiz generator for student assessment.
 *
 * - generateQuiz - A function that generates a quiz based on the given topic or lesson content.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic or lesson content to generate a quiz for.'),
  gradeLevel: z.string().optional().describe('The grade level of the students taking the quiz.'),
  numberOfQuestions: z.number().int().min(1).max(20).default(5).describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quiz: z.string().describe('The generated quiz in a suitable format (e.g., JSON, Markdown).'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are an AI quiz generator designed to create quizzes for teachers.

  Based on the topic and grade level provided, generate a quiz with the specified number of questions.
  The quiz should be formatted in JSON.

  Topic: {{{topic}}}
  Grade Level: {{{gradeLevel}}}
  Number of Questions: {{{numberOfQuestions}}}

  Quiz (JSON):
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
