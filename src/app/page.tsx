
import { BookOpen, Calendar, Image as ImageIcon, Video, FileQuestion, GraduationCap, Users, Clapperboard, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExplainerTool } from '@/components/explainer-tool';
import { WeeklyPlanner } from '@/components/weekly-planner';
import { ImageGenerator } from '@/components/image-generator';
import { VideoGenerator } from '@/components/video-generator';
import { StudentAssessor } from '@/components/student-assessor';
import { Header } from '@/components/header';
import { StorybookGenerator } from '@/components/storybook-generator';
import { LessonCreator } from '@/components/lesson-creator';
import { AnimatedStorybook } from '@/components/animated-storybook';
import { GeneralAssistant } from '@/components/general-assistant';

export default function Home() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="lesson-creator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-10 mb-4 h-auto">
            <TabsTrigger value="lesson-creator" className="flex-col sm:flex-row py-2">
              <Users className="mb-1 sm:mb-0 sm:mr-2" /> Lesson Creator
            </TabsTrigger>
            <TabsTrigger value="explainer" className="flex-col sm:flex-row py-2">
              <BookOpen className="mb-1 sm:mb-0 sm:mr-2" /> Explainer
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex-col sm:flex-row py-2">
              <Calendar className="mb-1 sm:mb-0 sm:mr-2" /> Planner
            </TabsTrigger>
            <TabsTrigger value="image-generator" className="flex-col sm:flex-row py-2">
              <ImageIcon className="mb-1 sm:mb-0 sm:mr-2" /> Image Gen
            </TabsTrigger>
            <TabsTrigger value="video-generator" className="flex-col sm:flex-row py-2">
              <Video className="mb-1 sm:mb-0 sm:mr-2" /> Video Gen
            </TabsTrigger>
            <TabsTrigger value="assessor" className="flex-col sm:flex-row py-2">
              <FileQuestion className="mb-1 sm:mb-0 sm:mr-2" /> Assessor
            </TabsTrigger>
            <TabsTrigger value="storybook-generator" className="flex-col sm:flex-row py-2">
                <GraduationCap className="mb-1 sm:mb-0 sm:mr-2" /> Storybook Gen
            </TabsTrigger>
            <TabsTrigger value="animated-storybook" className="flex-col sm:flex-row py-2">
                <Clapperboard className="mb-1 sm:mb-0 sm:mr-2" /> Animated Story
            </TabsTrigger>
             <TabsTrigger value="assistant" className="flex-col sm:flex-row py-2">
                <Sparkles className="mb-1 sm:mb-0 sm:mr-2" /> Assistant
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lesson-creator">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI Lesson Creator</CardTitle>
                <CardDescription>
                  Generate a complete lesson plan by orchestrating multiple AI agents.
                </CardDescription>
              </CardHeader>
              <LessonCreator />
            </Card>
          </TabsContent>
          <TabsContent value="explainer">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI Teaching Explainer</CardTitle>
                <CardDescription>
                  Input text, grade, and subject to get simplified teaching methods for any topic.
                </CardDescription>
              </CardHeader>
              <ExplainerTool />
            </Card>
          </TabsContent>
          <TabsContent value="planner">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI-Powered Weekly Planner</CardTitle>
                <CardDescription>
                  Input your goals and constraints to generate a weekly teaching plan.
                </CardDescription>
              </CardHeader>
              <WeeklyPlanner />
            </Card>
          </TabsContent>
          <TabsContent value="image-generator">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Concept Image Generator</CardTitle>
                <CardDescription>
                  Generate step-by-step images to explain complex concepts visually.
                </CardDescription>
              </CardHeader>
              <ImageGenerator />
            </Card>
          </TabsContent>
          <TabsContent value="video-generator">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Step-by-Step Video Generator</CardTitle>
                <CardDescription>
                  Create an engaging, multi-part video series that breaks down complex ideas.
                </CardDescription>
              </CardHeader>
              <VideoGenerator />
            </Card>
          </TabsContent>
          <TabsContent value="assessor">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>AI Student Assessor</CardTitle>
                <CardDescription>
                  Generate quizzes to gauge student understanding and provide feedback.
                </CardDescription>
              </CardHeader>
              <StudentAssessor />
            </Card>
          </TabsContent>
          <TabsContent value="storybook-generator">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>AI-Powered Storybook Generator</CardTitle>
                      <CardDescription>
                          Create engaging and educational storybooks with illustrations.
                      </CardDescription>
                  </CardHeader>
                  <StorybookGenerator />
              </Card>
          </TabsContent>
          <TabsContent value="animated-storybook">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>AI Animated Storybook</CardTitle>
                      <CardDescription>
                          Turn any story into an animated video with narration and illustrations.
                      </CardDescription>
                  </CardHeader>
                  <AnimatedStorybook />
              </Card>
          </TabsContent>
           <TabsContent value="assistant">
              <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle>General Assistant</CardTitle>
                      <CardDescription>
                        Your AI assistant for everyday tasks. Ask it to schedule meetings, send emails, or take notes.
                      </CardDescription>
                  </CardHeader>
                  <GeneralAssistant />
              </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
