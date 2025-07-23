'use server';

/**
 * @fileOverview A concept image generation AI agent.
 *
 * - conceptImageGenerator - A function that handles the concept image generation process.
 * - ConceptImageGeneratorInput - The input type for the conceptImageGenerator function.
 * - ConceptImageGeneratorOutput - The return type for the conceptImageGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConceptImageGeneratorInputSchema = z.object({
  conceptDescription: z
    .string()
    .describe('The description of the concept, topic, or story to be explained.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the topic.'),
});
export type ConceptImageGeneratorInput = z.infer<typeof ConceptImageGeneratorInputSchema>;

const ConceptImageGeneratorOutputSchema = z.object({
  steps: z.array(
    z.object({
      stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
      imageUrl: z.string().describe(
        'The URL of the generated image for the step, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
    })
  ).describe('A series of 3 steps to explain the concept, with an image for each step.'),
});
export type ConceptImageGeneratorOutput = z.infer<typeof ConceptImageGeneratorOutputSchema>;

export async function conceptImageGenerator(
  input: ConceptImageGeneratorInput
): Promise<ConceptImageGeneratorOutput> {
  return conceptImageGeneratorFlow(input);
}

const stepGenerationPrompt = ai.definePrompt({
    name: 'conceptImageStepGenerationPrompt',
    input: { schema: ConceptImageGeneratorInputSchema },
    output: {
      schema: z.object({
        steps: z.array(
          z.object({
            stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
          })
        ).describe('A series of 3 steps to explain the concept.'),
      }),
    },
    prompt: `You are an expert educator. Your task is to break down a complex concept, topic, or story into exactly 3 simple, easy-to-understand steps for a student.

Consider the student's grade level and the subject to tailor the complexity of the language.

Topic/Story: {{{conceptDescription}}}
Grade Level: {{{grade}}}
Subject: {{{subject}}}

Generate a 3-step explanation.`,
});


const conceptImageGeneratorFlow = ai.defineFlow(
  {
    name: 'conceptImageGeneratorFlow',
    inputSchema: ConceptImageGeneratorInputSchema,
    outputSchema: ConceptImageGeneratorOutputSchema,
  },
  async (input) => {
    const stepResponse = await stepGenerationPrompt(input);
    const stepsData = stepResponse.output?.steps;

    if (!stepsData || stepsData.length === 0) {
      throw new Error('Failed to get a valid step descriptions from the AI.');
    }

    const stepsWithImages = await Promise.all(
      stepsData.map(async (step) => {
        const imagePrompt = `A simple, clear, and educational illustration for a ${input.grade} student studying ${input.subject}. The image should visually represent this concept: "${step.stepDescription}". Style: vibrant, simple, and easy-to-understand for educational purposes.`;
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: imagePrompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        });

        return {
          stepDescription: step.stepDescription,
          imageUrl: media?.url || '',
        };
      })
    );

    return { steps: stepsWithImages };
  }
);
