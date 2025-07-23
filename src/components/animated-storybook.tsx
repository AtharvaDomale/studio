
"use client";

import { animatedStorybookGenerator, AnimatedStorybookOutput } from "@/ai/flows/animated-storybook-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PlayCircle, BookOpen } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Skeleton } from "./ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import React from "react";

const formSchema = z.object({
  story: z.string().min(20, { message: "Story must be at least 20 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
});

type FormValues = z.infer<typeof formSchema>;

export function AnimatedStorybook() {
  const [result, setResult] = useState<AnimatedStorybookOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>()
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { story: "" },
  });

  React.useEffect(() => {
    if (!carouselApi || !audioRefs.current.length) return;

    const onSelect = (api: CarouselApi) => {
      const selectedIndex = api.selectedScrollSnap();
      // Pause all other audio elements
      audioRefs.current.forEach((audio, index) => {
        if (audio && index !== selectedIndex) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      // Play the selected one
      audioRefs.current[selectedIndex]?.play().catch(e => console.log("Play failed", e));
    };

    carouselApi.on("select", onSelect);
    // Play the first slide on load
    onSelect(carouselApi);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await animatedStorybookGenerator(data);
      setResult(output);
      // Reset audio refs for the new result
      if (output.scenes) {
        audioRefs.current = audioRefs.current.slice(0, output.scenes.length);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Animated Storybook",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                    <Textarea placeholder="Paste your story here. For example: Leo the lion was sad. His big, loud roar had gone away..." {...field} rows={6} />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Your Animated Story...
                </>
              ) : (
                "Create Animated Storybook"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start space-y-4">
          {isLoading ? (
            <div className="w-full space-y-4">
                <p className="text-center text-muted-foreground">✨ Your animated storybook is being created by a team of AI agents. This is a complex process and may take several minutes. Please be patient. ✨</p>
                <div className="w-full max-w-2xl mx-auto space-y-4">
                    <Skeleton className="w-1/2 h-8 mx-auto" />
                    <Skeleton className="w-full aspect-video rounded-lg" />
                    <Skeleton className="w-full h-12" />
                </div>
            </div>
          ) : (
            result && (
              <div className="w-full space-y-4">
                <h3 className="text-2xl font-bold text-center">{result.title}</h3>
                <Carousel setApi={setCarouselApi} opts={{ align: "start", loop: false }} className="w-full max-w-3xl mx-auto">
                  <CarouselContent>
                    {result.scenes.map((scene, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1 h-full">
                          <div className="flex flex-col h-full p-4 border rounded-lg bg-muted gap-4">
                            <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                                <video 
                                    src={scene.videoUrl} 
                                    className="w-full h-full object-contain"
                                    loop
                                    autoPlay 
                                    muted
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <p className="text-base text-center font-medium text-foreground leading-relaxed">
                                {scene.narrationText}
                            </p>
                            <audio 
                                ref={el => audioRefs.current[index] = el}
                                src={scene.narrationAudio}
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                <div className="text-center text-sm text-muted-foreground">
                    <p>Navigate through the scenes using the arrows. Audio will play for the current scene.</p>
                </div>
              </div>
            )
          )}
        </CardFooter>
      )}
    </>
  );
}
