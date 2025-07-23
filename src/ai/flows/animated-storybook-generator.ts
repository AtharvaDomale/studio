
'use server';

/**
 * @fileOverview An AI agent that generates animated storybooks.
 *
 * This agent orchestrates multiple AI models to analyze a story, generate audio narration
 * with multiple voices, create consistent character illustrations, and then generate
 * an animated video clip for each scene.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';
import {MediaPart} from 'genkit';

// Define Input Schema
const AnimatedStorybookInputSchema = z.object({
  story: z.string().min(20).describe('The full text of the story to be animated.'),
  grade: z.string().describe('The grade level of the target audience.'),
});
export type AnimatedStorybookInput = z.infer<typeof AnimatedStorybookInputSchema>;


// Define Scene Breakdown and Character Schemas for structured output
const SceneSchema = z.object({
    sceneDescription: z.string().describe("A concise summary of the action in this scene."),
    characters: z.array(z.string()).describe("The characters present in this scene."),
    setting: z.string().describe("The location or setting of the scene."),
    mood: z.string().describe("The mood or emotion of the scene."),
    narrationText: z.string().describe("The exact narration text for this scene, including dialogue attributed to speakers (e.g., 'Leo said: ...')."),
    illustrationPrompt: z.string().describe("A detailed prompt for an image generation model to create a consistent illustration for this scene."),
});

const StoryAnalysisSchema = z.object({
  title: z.string().describe("A creative title for the story."),
  mainCharacter: z.string().describe("The name of the main character."),
  characterSheetPrompt: z.string().describe("A detailed prompt to generate a consistent character reference sheet for the main character."),
  scenes: z.array(SceneSchema).describe("An array of scenes that make up the story."),
});


// Define final output schema for the entire flow
const AnimatedStorybookOutputSchema = z.object({
  title: z.string(),
  scenes: z.array(
    z.object({
      narrationAudio: z.string().describe("Data URI of the narrated audio for the scene."),
      videoUrl: z.string().describe("Data URI of the generated video for the scene."),
      narrationText: z.string(),
    })
  ),
});
export type AnimatedStorybookOutput = z.infer<typeof AnimatedStorybookOutputSchema>;


// The main exported function that clients will call
export async function animatedStorybookGenerator(
  input: AnimatedStorybookInput
): Promise<AnimatedStorybookOutput> {
  return animatedStorybookFlow(input);
}


// Helper function to convert PCM audio from TTS to WAV format
async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      let bufs: any[] = [];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
}


const animatedStorybookFlow = ai.defineFlow(
  {
    name: 'animatedStorybookFlow',
    inputSchema: AnimatedStorybookInputSchema,
    outputSchema: AnimatedStorybookOutputSchema,
  },
  async (input) => {
    // === Step 1: Analyze the story to break it down into scenes ===
    const analysisResponse = await ai.generate({
        prompt: `You are a master storyteller and film director. Analyze the following story and break it down into distinct scenes. For each scene, define the characters, setting, mood, and create a detailed illustration prompt. Ensure character consistency by first creating a character sheet prompt for the main character, and referencing it in each scene's illustration prompt. Also, extract the exact narration text for each scene, including speaker dialogue.
        
        Story: "${input.story}"
        Grade Level: ${input.grade}
        Art Style: Charming children's storybook illustration, soft watercolor style, vibrant but gentle colors, rounded shapes, no sharp edges.

        Produce a structured analysis based on the above.`,
        output: {
            schema: StoryAnalysisSchema
        }
    });

    const storyAnalysis = analysisResponse.output;
    if (!storyAnalysis) {
        throw new Error("Failed to analyze the story.");
    }
    
    // === Step 2: Generate a consistent character sheet image ===
    const { media: characterSheetImage } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: storyAnalysis.characterSheetPrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const characterSheetDataUri = characterSheetImage?.url;
    if (!characterSheetDataUri) {
        throw new Error("Failed to generate character sheet.");
    }
    
    // === Step 3: Generate audio for all scenes in parallel ===
    const audioGenerationPromises = storyAnalysis.scenes.map(async (scene, index) => {
      const { media: narrationAudioMedia } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        prompt: scene.narrationText,
        config: { responseModalities: ['AUDIO'] },
      });

      if (!narrationAudioMedia) throw new Error(`Failed to generate audio for scene ${index + 1}.`);
      
      const audioBuffer = Buffer.from(
          narrationAudioMedia.url.substring(narrationAudioMedia.url.indexOf(',') + 1), 'base64'
      );
      const wavAudioBase64 = await toWav(audioBuffer);
      return `data:audio/wav;base64,${wavAudioBase64}`;
    });

    const narrationAudios = await Promise.all(audioGenerationPromises);
    const apiKey = process.env.GEMINI_API_KEY;

    // === Step 4: Generate video for each scene sequentially to avoid rate limits ===
    const processedScenes = [];
    for (let i = 0; i < storyAnalysis.scenes.length; i++) {
        const scene = storyAnalysis.scenes[i];
        
        const videoPrompt: (string | MediaPart)[] = [
            { text: `Animate this scene in a gentle, slow-panning Ken Burns style. Scene description: ${scene.illustrationPrompt}` },
        ];
        if (characterSheetDataUri) {
          videoPrompt.push({ media: { url: characterSheetDataUri, contentType: 'image/png' } });
        }
        
        let { operation } = await ai.generate({
            model: googleAI.model('veo-2.0-generate-001'),
            prompt: videoPrompt,
            config: {
                durationSeconds: 8,
                aspectRatio: '16:9',
            },
        });
        
        if (!operation) throw new Error(`Failed to start video generation for scene ${i + 1}.`);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.checkOperation(operation);
        }
    
        if (operation.error) throw new Error(`Video generation failed for scene ${i + 1}: ${operation.error.message}`);

        const videoPart = operation.output?.message?.content.find(p => !!p.media);
        if (!videoPart || !videoPart.media?.url) throw new Error(`Failed to find video for scene ${i + 1}.`);

        const fetch = (await import('node-fetch')).default;
        const videoDownloadResponse = await fetch(`${videoPart.media!.url}&key=${apiKey}`);
        if (!videoDownloadResponse.ok) {
            throw new Error(`Failed to download video for scene ${i + 1}: ${videoDownloadResponse.statusText}`);
        }
        const videoBuffer = await videoDownloadResponse.arrayBuffer();
        const base64Video = Buffer.from(videoBuffer).toString('base64');
        const videoUrl = `data:video/mp4;base64,${base64Video}`;

        processedScenes.push({
            narrationAudio: narrationAudios[i],
            videoUrl: videoUrl,
            narrationText: scene.narrationText,
        });
    }

    return {
      title: storyAnalysis.title,
      scenes: processedScenes,
    };
  }
);
