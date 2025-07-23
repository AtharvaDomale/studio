'use server';

/**
 * @fileOverview A multi-agent AI that creates a comprehensive lesson plan.
 *
 * This agent orchestrates other specialized agents to gather teaching methods,
 * generate visual aids, and create quizzes, then synthesizes them into a
 * complete lesson plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { teachingMethodExplainer } from './teaching-method-explainer';
import { generateQuiz } from './student-quiz-generator';
import { conceptImageGenerator } from './concept-image-generator';

const LessonPlanCreatorInputSchema = z.object({
  topic: z.string().describe('The central topic for the lesson plan.'),
  grade: z.string().describe('The grade level of the students.'),
  subject: z.string().describe('The subject of the lesson.'),
});
export type LessonPlanCreatorInput = z.infer<typeof LessonPlanCreatorInputSchema>;

const LessonPlanCreatorOutputSchema = z.object({
  lessonPlan: z.string().describe('The complete, synthesized lesson plan in Markdown format.'),
  imageUrl: z.string().url().describe('A relevant image URL for the lesson.'),
});
export type LessonPlanCreatorOutput = z.infer<typeof LessonPlanCreatorOutputSchema>;

export async function createLessonPlan(
  input: LessonPlanCreatorInput
): Promise<LessonPlanCreatorOutput> {
  return lessonPlanCreatorFlow(input);
}

const lessonPlanCreatorFlow = ai.defineFlow(
  {
    name: 'lessonPlanCreatorFlow',
    inputSchema: LessonPlanCreatorInputSchema,
    outputSchema: LessonPlanCreatorOutputSchema,
  },
  async (input) => {
    console.log('Orchestrator started for topic:', input.topic);

    // Step 1: Delegate tasks to specialized agents in parallel
    const [methodsResponse, quizResponse, imageResponse] = await Promise.all([
      teachingMethodExplainer({
        content: input.topic,
        grade: input.grade,
        subject: input.subject,
      }),
      generateQuiz({
        topic: input.topic,
        gradeLevel: input.grade,
        numberOfQuestions: 3,
      }),
      conceptImageGenerator({
        conceptDescription: input.topic,
        grade: input.grade,
        subject: input.subject,
      }),
    ]);
    
    // Extract the quiz questions text
    const quizData = JSON.parse(quizResponse.quiz);
    const quizText = quizData.questions
    .map((q: any, i: number) => `${i + 1}. ${q.question}\nOptions: ${q.options.join(', ')}\nAnswer: ${q.answer}`)
    .join('\n\n');
    
    const imageUrl = imageResponse.steps[0]?.imageUrl || '';

    // Step 2: Synthesize the results into a comprehensive lesson plan
    console.log('Synthesizing results from all agents...');
    const synthesisPrompt = `You are a master educator responsible for creating a final, comprehensive lesson plan.
    You have received input from several specialized AI agents. Your task is to synthesize this information into a single, cohesive, and well-structured lesson plan document in Markdown format.

    Topic: ${input.topic}
    Grade Level: ${input.grade}
    Subject: ${input.subject}

    Here is the information from your assistant agents:

    1.  **Suggested Teaching Methods & Activities:**
        ${methodsResponse.teachingMethods}

    2.  **Generated Assessment Quiz:**
        ${quizText}

    Please create a lesson plan that includes:
    - A clear title.
    - Learning objectives.
    - A list of materials (mentioning the generated image).
    - A step-by-step procedure for the lesson, incorporating the suggested activities.
    - The assessment quiz you've created.
    - A concluding summary.

    Format the entire output as a clean, readable Markdown document.`;

    const synthesisResponse = await ai.generate({
      prompt: synthesisPrompt,
    });

    return {
      lessonPlan: synthesisResponse.text,
      imageUrl: imageUrl,
    };
  }
);
