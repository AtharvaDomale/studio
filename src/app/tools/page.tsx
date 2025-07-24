

import { BookOpen, Calendar, Image as ImageIcon, Video, FileQuestion, GraduationCap, Users, Clapperboard, ScanLine } from 'lucide-react';
import { ExplainerTool } from '@/components/explainer-tool';
import { WeeklyPlanner } from '@/components/weekly-planner';
import { ImageGenerator } from '@/components/image-generator';
import { VideoGenerator } from '@/components/video-generator';
import { StudentAssessor } from '@/components/student-assessor';
import { StorybookGenerator } from '@/components/storybook-generator';
import { LessonCreator } from '@/components/lesson-creator';
import { AnimatedStorybook } from '@/components/animated-storybook';
import { ToolCard } from '@/components/tool-card';
import { ExamGrader } from '@/components/exam-grader';

const tools = [
  {
    id: 'lesson-creator',
    icon: Users,
    title: 'AI Lesson Creator',
    description: 'Generate a complete lesson plan by orchestrating multiple AI agents.',
    component: <LessonCreator />,
  },
  {
    id: 'exam-grader',
    icon: ScanLine,
    title: 'AI Exam Grader',
    description: 'Upload a handwritten exam paper and let AI grade it and provide feedback.',
    component: <ExamGrader />,
  },
  {
    id: 'explainer',
    icon: BookOpen,
    title: 'AI Teaching Explainer',
    description: 'Get simplified teaching methods for any topic, text, or image.',
    component: <ExplainerTool />,
  },
  {
    id: 'planner',
    icon: Calendar,
    title: 'Weekly Planner',
    description: 'Input your goals and constraints to generate a weekly teaching plan.',
    component: <WeeklyPlanner />,
  },
  {
    id: 'image-generator',
    icon: ImageIcon,
    title: 'Concept Image Generator',
    description: 'Generate step-by-step images to explain complex concepts visually.',
    component: <ImageGenerator />,
  },
  {
    id: 'video-generator',
    icon: Video,
    title: 'Concept Video Generator',
    description: 'Create an engaging video to explain a concept, with optional image input.',
    component: <VideoGenerator />,
  },
  {
    id: 'assessor',
    icon: FileQuestion,
    title: 'AI Student Assessor',
    description: 'Generate quizzes to gauge student understanding and provide feedback.',
    component: <StudentAssessor />,
  },
  {
    id: 'storybook-generator',
    icon: GraduationCap,
    title: 'Storybook Generator',
    description: 'Create engaging and educational storybooks with AI illustrations.',
    component: <StorybookGenerator />,
  },
  {
    id: 'animated-storybook',
    icon: Clapperboard,
    title: 'Animated Storybook',
    description: 'Turn any story into an animated video with narration and illustrations.',
    component: <AnimatedStorybook />,
  },
];

export default function ToolsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Your AI Toolkit for Modern Education</h1>
                <p className="mt-4 text-lg text-muted-foreground">Empowering teachers with intelligent tools to create, explain, and assess.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
                <ToolCard
                key={tool.id}
                icon={<tool.icon className="h-8 w-8 text-primary" />}
                title={tool.title}
                description={tool.description}
                >
                {tool.component}
                </ToolCard>
            ))}
            </div>
        </div>
      </main>
    </div>
  );
}
