
'use server';

/**
 * @fileOverview An agent that generates a single concept video.
 *
 * - conceptVideoGenerator - A function that handles the concept video generation process.
 * - ConceptVideoGeneratorInput - The input type for the conceptVideoGenerator function.
 * - ConceptVideoGeneratorOutput - The return type for the conceptVideoGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {MediaPart} from 'genkit';

const ConceptVideoGeneratorInputSchema = z.object({
  prompt: z.string().describe('The prompt or topic to generate a video for.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the topic.'),
  duration: z.number().min(5).max(8).default(5).describe('The duration of the video in seconds.'),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9').describe('The aspect ratio of the video.'),
  image: z.string().optional().describe(
    "An optional starting image for the video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  model: z.string().describe("The video generation model to use."),
});
export type ConceptVideoGeneratorInput = z.infer<typeof ConceptVideoGeneratorInputSchema>;

const ConceptVideoGeneratorOutputSchema = z.object({
    title: z.string().describe('The title of the generated video.'),
    description: z.string().describe('A brief description of the video content.'),
    videoUrl: z.string().describe(
        'The URL of the generated video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
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
  async (input) => {
    const apiKey = process.env.GEMINI_API_KEY;

    // Step 1: Generate a title and description
    const titleAndDescResponse = await ai.generate({
        prompt: `Create a concise title and a one-sentence description for an educational video about "${input.prompt}" for a ${input.grade} ${input.subject} student.`,
        output: {
            schema: z.object({
                title: z.string(),
                description: z.string(),
            })
        }
    });

    const { title, description } = titleAndDescResponse.output || { title: input.prompt, description: 'An educational video.' };

    // Step 2: Generate the video
    const videoPrompt: (string | MediaPart)[] = [
        {
            text: `A short, engaging, and educational video for a ${input.grade} student studying ${input.subject}. The video should visually represent this concept: "${input.prompt}". Style: vibrant, simple, and easy-to-understand for educational purposes.`
        }
    ];

    if (input.image) {
        videoPrompt.push({media: {url: input.image}});
    }

    const config: any = {};
    // Conditionally add parameters based on model support
    if (input.model === 'veo-2.0-generate-001') {
      config.durationSeconds = input.duration;
      config.aspectRatio = input.aspectRatio;
    }

    let {operation} = await ai.generate({
        model: googleAI.model(input.model as any),
        prompt: videoPrompt,
        config: config,
    });

    if (!operation) {
        throw new Error('Failed to start video generation operation.');
    }

    // Wait until the operation completes.
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Failed to generate video. Error: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find(p => !!p.media);
    if (!video || !video.media?.url) {
        throw new Error('Failed to find the generated video.');
    }
    
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(`${video.media!.url}&key=${apiKey}`);
    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    const videoDataUrl = `data:video/mp4;base64,${base64Video}`;

    // Step 3: Return the final combined output.
    return { 
        title,
        description,
        videoUrl: videoDataUrl
    };
  }
);

