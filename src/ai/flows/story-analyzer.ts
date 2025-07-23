
'use server';

/**
 * @fileOverview An AI agent that analyzes a story and breaks it down into scenes.
 *
 * This is the first step in the animated storybook generation process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

export type StoryAnalysis = z.infer<typeof StoryAnalysisSchema>;

// Define Input Schema
const AnalyzeStoryInputSchema = z.object({
  story: z.string().min(20).describe('The full text of the story to be animated.'),
  grade: z.string().describe('The grade level of the target audience.'),
});
export type AnalyzeStoryInput = z.infer<typeof AnalyzeStoryInputSchema>;

export async function analyzeStory(input: AnalyzeStoryInput): Promise<StoryAnalysis> {
    return storyAnalysisFlow(input);
}


const storyAnalysisFlow = ai.defineFlow(
    {
        name: 'storyAnalysisFlow',
        inputSchema: AnalyzeStoryInputSchema,
        outputSchema: StoryAnalysisSchema,
    },
    async (input) => {
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
        return storyAnalysis;
    }
);
