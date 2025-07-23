'use server';

/**
 * @fileOverview An agentic, step-by-step video generation AI agent.
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
  prompt: z.string().describe('The prompt or topic to generate a video series for.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the topic.'),
  duration: z.number().min(5).max(8).default(5).describe('The duration of each video in seconds.'),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9').describe('The aspect ratio of the videos.'),
  image: z.string().optional().describe(
    "An optional starting image for the first video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type ConceptVideoGeneratorInput = z.infer<typeof ConceptVideoGeneratorInputSchema>;

const ConceptVideoGeneratorOutputSchema = z.object({
  steps: z.array(
    z.object({
      stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
      videoUrl: z.string().describe(
          'The URL of the generated video for the step, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
      ),
    })
  ).describe('A series of steps to explain the concept, with a video for each step.'),
});
export type ConceptVideoGeneratorOutput = z.infer<typeof ConceptVideoGeneratorOutputSchema>;

export async function conceptVideoGenerator(
  input: ConceptVideoGeneratorInput
): Promise<ConceptVideoGeneratorOutput> {
  return conceptVideoGeneratorFlow(input);
}

const stepGenerationPrompt = ai.definePrompt({
    name: 'conceptVideoStepGenerationPrompt',
    input: { schema: z.object({
        prompt: z.string(),
        grade: z.string(),
        subject: z.string(),
    })},
    output: {
      schema: z.object({
        steps: z.array(
          z.object({
            stepDescription: z.string().describe('The description of the step, tailored for the specified grade and subject.'),
          })
        ).describe('A series of 3-5 steps to explain the concept.'),
      }),
    },
    prompt: `You are an expert educator and AI agent. Your task is to research and break down a complex concept, topic, or story into 3 to 5 simple, easy-to-understand steps for a student.

Your research must consider the student's grade level and the subject to tailor the complexity of the language and the depth of the explanation.

Topic/Story: {{{prompt}}}
Grade Level: {{{grade}}}
Subject: {{{subject}}}

Generate a 3-5 step explanation. For each step, provide a clear and concise description.`,
});

const conceptVideoGeneratorFlow = ai.defineFlow(
  {
    name: 'conceptVideoGeneratorFlow',
    inputSchema: ConceptVideoGeneratorInputSchema,
    outputSchema: ConceptVideoGeneratorOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the step-by-step descriptions.
    const stepResponse = await stepGenerationPrompt({
        prompt: input.prompt,
        grade: input.grade,
        subject: input.subject,
    });
    const stepsData = stepResponse.output?.steps;

    if (!stepsData || stepsData.length === 0) {
      throw new Error('Agent failed to generate step descriptions.');
    }

    // Step 2: Generate a video for each step sequentially.
    const stepsWithVideos = [];
    let isFirstStep = true;
    const apiKey = process.env.GEMINI_API_KEY;

    for (const step of stepsData) {
        const videoPrompt: (string | MediaPart)[] = [
            {
                text: `A short, engaging, and educational video for a ${input.grade} student studying ${input.subject}. The video should visually represent this concept: "${step.stepDescription}". Style: vibrant, simple, and easy-to-understand for educational purposes.`
            }
        ];

        // Add the optional image only to the first video generation step
        if (isFirstStep && input.image) {
            videoPrompt.push({media: {url: input.image}});
            isFirstStep = false;
        }

        let {operation} = await ai.generate({
            model: googleAI.model('veo-2.0-generate-001'),
            prompt: videoPrompt,
            config: {
                durationSeconds: input.duration,
                aspectRatio: input.aspectRatio,
            },
        });

        if (!operation) {
            throw new Error(`Failed to start video generation operation for step: "${step.stepDescription}"`);
        }

        // Wait until the operation completes.
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
            operation = await ai.checkOperation(operation);
        }

        if (operation.error) {
            throw new Error(`Failed to generate video for step: "${step.stepDescription}". Error: ${operation.error.message}`);
        }

        const video = operation.output?.message?.content.find(p => !!p.media);
        if (!video || !video.media?.url) {
            throw new Error(`Failed to find the generated video for step: "${step.stepDescription}"`);
        }
        
        const fetch = (await import('node-fetch')).default;
        const videoDownloadResponse = await fetch(`${video.media!.url}&key=${apiKey}`);
        if (!videoDownloadResponse.ok) {
            throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
        }
        const videoBuffer = await videoDownloadResponse.arrayBuffer();
        const base64Video = Buffer.from(videoBuffer).toString('base64');
        const videoDataUrl = `data:video/mp4;base64,${base64Video}`;


        stepsWithVideos.push({
            stepDescription: step.stepDescription,
            videoUrl: videoDataUrl,
        });
    }


    // Step 3: Return the final combined output.
    return { steps: stepsWithVideos };
  }
);
