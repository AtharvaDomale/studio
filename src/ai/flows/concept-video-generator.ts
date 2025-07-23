'use server';

/**
 * @fileOverview A concept video generation AI agent.
 *
 * - conceptVideoGenerator - A function that handles the concept video generation process.
 * - ConceptVideoGeneratorInput - The input type for the conceptVideoGenerator function.
 * - ConceptVideoGeneratorOutput - The return type for the conceptVideoGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const ConceptVideoGeneratorInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate a video for.'),
});
export type ConceptVideoGeneratorInput = z.infer<typeof ConceptVideoGeneratorInputSchema>;

const ConceptVideoGeneratorOutputSchema = z.object({
  videoUrl: z.string().describe('The URL of the generated video.'),
});
export type ConceptVideoGeneratorOutput = z.infer<typeof ConceptVideoGeneratorOutputSchema>;

export async function conceptVideoGenerator(
  input: ConceptVideoGeneratorInput
): Promise<ConceptVideoGeneratorOutput> {
  return conceptVideoGeneratorFlow(input);
}

const conceptVideoGeneratorFlow = ai.defineFlow(
  {
    name: 'conceptVideoGeneratorFlow',
    inputSchema: ConceptVideoGeneratorInputSchema,
    outputSchema: ConceptVideoGeneratorOutputSchema,
  },
  async ({prompt}) => {
    let {operation} = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `A short, engaging, and educational video for students. The video should visually represent this concept: "${prompt}". Style: vibrant, simple, and easy-to-understand for educational purposes.`,
      config: {
        durationSeconds: 5,
        aspectRatio: '16:9',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) {
      throw new Error('Failed to find the generated video');
    }

    return {
      videoUrl: video.media.url,
    };
  }
);
