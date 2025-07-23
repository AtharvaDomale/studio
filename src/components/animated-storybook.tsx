
"use client";

import { analyzeStory, StoryAnalysis } from "@/ai/flows/story-analyzer";
import { generateScene, SceneOutput, generateCharacterSheet } from "@/ai/flows/scene-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import React from "react";
import Image from "next/image";

const formSchema = z.object({
  story: z.string().min(20, { message: "Story must be at least 20 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
});

type FormValues = z.infer<typeof formSchema>;

type SceneState = {
  narrationText: string;
  illustrationPrompt: string;
  data?: SceneOutput;
  status: 'pending' | 'loading' | 'done' | 'error';
  errorMessage?: string;
};

export function AnimatedStorybook() {
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [scenes, setScenes] = useState<SceneState[]>([]);
  const [characterSheetUri, setCharacterSheetUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { story: "" },
  });

  useEffect(() => {
    if (!carouselApi || !audioRefs.current.length) return;

    const onSelect = (api: CarouselApi) => {
      const selectedIndex = api.selectedScrollSnap();
      audioRefs.current.forEach((audio, index) => {
        if (audio && index !== selectedIndex) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      audioRefs.current[selectedIndex]?.play().catch(e => console.log("Play failed", e));
    };

    carouselApi.on("select", onSelect);
    carouselApi.on("reInit", onSelect);

    return () => {
        carouselApi.off("select", onSelect);
        carouselApi.off("reInit", onSelect);
    };
  }, [carouselApi]);


  useEffect(() => {
    if (analysis && scenes.length > 0 && isGenerating) {
        generateAllScenes();
    }
  }, [analysis, scenes, isGenerating]);


  async function onSubmit(data: FormValues) {
    setIsAnalyzing(true);
    setAnalysis(null);
    setScenes([]);
    setCharacterSheetUri(null);
    setIsGenerating(false);
    try {
      const analysisResult = await analyzeStory(data);
      setAnalysis(analysisResult);
      setScenes(analysisResult.scenes.map(s => ({
        narrationText: s.narrationText,
        illustrationPrompt: s.illustrationPrompt,
        status: 'pending',
      })));
      setIsGenerating(true); // Trigger scene generation
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Analyzing Story",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateAllScenes() {
    if (!analysis) return;

    // First, generate the character sheet
    try {
        const sheet = await generateCharacterSheet({ characterSheetPrompt: analysis.characterSheetPrompt });
        setCharacterSheetUri(sheet.characterSheetDataUri);
    } catch (error) {
        console.error("Failed to generate character sheet", error);
        toast({ title: "Warning", description: "Could not generate a character sheet. Character consistency may be affected.", variant: "destructive" });
    }

    // Now, generate scenes sequentially
    for (let i = 0; i < analysis.scenes.length; i++) {
      setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'loading' } : s));
      try {
        const sceneData = await generateScene({
          narrationText: analysis.scenes[i].narrationText,
          illustrationPrompt: analysis.scenes[i].illustrationPrompt,
          characterSheetDataUri: characterSheetUri ?? undefined,
        });
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done', data: sceneData } : s));
      } catch (error) {
        console.error(`Error generating scene ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'error', errorMessage } : s));
        toast({
          title: `Error in Scene ${i + 1}`,
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
    setIsGenerating(false);
  }

  return (
    <>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="story"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story or Poem</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste your story here..." {...field} rows={6} disabled={isAnalyzing || isGenerating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAnalyzing || isGenerating}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                        <SelectItem key={grade} value={`Grade ${grade}`}>Grade {grade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isAnalyzing || isGenerating} className="w-full md:w-auto">
              {(isAnalyzing || isGenerating) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAnalyzing ? "Analyzing Story..." : `Generating Scene ${scenes.findIndex(s => s.status === 'loading') + 1}/${scenes.length}...`}
                </>
              ) : (
                "Create Animated Storybook"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {(analysis) && (
        <CardFooter className="flex-col items-start space-y-4 w-full">
            <h3 className="text-2xl font-bold text-center w-full">{analysis.title}</h3>
            {characterSheetUri &&
                <div className="w-full flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">Generated Character Reference</p>
                    <Image src={characterSheetUri} alt="Character Sheet" width={100} height={100} className="rounded-lg border bg-muted" />
                </div>
            }
            <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false }} className="w-full max-w-3xl mx-auto">
                <CarouselContent>
                {scenes.map((scene, index) => (
                    <CarouselItem key={index}>
                    <div className="p-1 h-full">
                        <div className="flex flex-col h-full p-4 border rounded-lg bg-muted gap-4">
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black/80 flex items-center justify-center">
                                {scene.status === 'done' && scene.data?.videoUrl ? (
                                    <video src={scene.data.videoUrl} className="w-full h-full object-contain" loop autoPlay muted>
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                        {scene.status === 'loading' && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                                        {scene.status === 'error' && <p className="text-destructive-foreground text-sm">⚠️<br />{scene.errorMessage}</p>}
                                        {scene.status === 'pending' && <p className="text-muted-foreground">Waiting...</p>}
                                    </div>
                                )}
                            </div>
                            <p className="text-base text-center font-medium text-foreground leading-relaxed h-20 overflow-y-auto">
                                {scene.narrationText}
                            </p>
                            {scene.status === 'done' && scene.data?.narrationAudio && (
                                <audio ref={el => audioRefs.current[index] = el} src={scene.data.narrationAudio} />
                            )}
                        </div>
                    </div>
                    </CarouselItem>
                ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
             <div className="text-center text-sm text-muted-foreground w-full">
                <p>Navigate through the scenes using the arrows. Audio will play for the current scene.</p>
            </div>
        </CardFooter>
      )}
    </>
  );
}
