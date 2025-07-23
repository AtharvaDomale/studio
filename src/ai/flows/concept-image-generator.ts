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
    .describe('The description of the concept to be explained.'),
});
export type ConceptImageGeneratorInput = z.infer<typeof ConceptImageGeneratorInputSchema>;

const ConceptImageGeneratorOutputSchema = z.object({
  steps: z.array(
    z.object({
      stepDescription: z.string().describe('The description of the step.'),
      imageUrl: z.string().describe(
        'The URL of the generated image for the step, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'        
      ),
    })
  ).describe('The steps to explain the concept, with an image for each step.'),
});
export type ConceptImageGeneratorOutput = z.infer<typeof ConceptImageGeneratorOutputSchema>;

export async function conceptImageGenerator(
  input: ConceptImageGeneratorInput
): Promise<ConceptImageGeneratorOutput> {
  return conceptImageGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conceptImageGeneratorPrompt',
  input: {schema: ConceptImageGeneratorInputSchema},
  output: {schema: ConceptImageGeneratorOutputSchema},
  prompt: `You are an AI that generates a series of images that break down a complex concept step by step.

  You will receive a concept description as input.
  Your task is to break down the concept into a series of steps, and for each step, generate an image that illustrates the step.

  Concept Description: {{{conceptDescription}}}

  For each step, provide a description and the URL of the generated image.
`,
});

const conceptImageGeneratorFlow = ai.defineFlow(
  {
    name: 'conceptImageGeneratorFlow',
    inputSchema: ConceptImageGeneratorInputSchema,
    outputSchema: ConceptImageGeneratorOutputSchema,
  },
  async input => {
    const steps = [];
    const numberOfSteps = 3; // You can adjust this number as needed

    for (let i = 1; i <= numberOfSteps; i++) {
      const stepDescription = `Step ${i}: Briefly explain this part of the concept.`;
      const imagePrompt = `Generate an image that illustrates ${stepDescription} for the concept: ${input.conceptDescription}.`;
      const {media} = await ai.generate({
        // IMPORTANT: ONLY the googleai/gemini-2.0-flash-preview-image-generation model is able to generate images. You MUST use exactly this model to generate images.
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: imagePrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
        },
      });

      if (media && media.url) {
        steps.push({
          stepDescription: stepDescription,
          imageUrl: media.url,
        });
      }
    }

    return {steps};
  }
);
