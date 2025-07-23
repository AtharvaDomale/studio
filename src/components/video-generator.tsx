"use client";
import { conceptVideoGenerator } from "@/ai/flows/concept-video-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function VideoGenerator() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setVideoUrl(null);
    try {
      const output = await conceptVideoGenerator(data);
      if (output.videoUrl) {
        // Append API key for client-side fetching
        const urlWithKey = `${output.videoUrl}&key=${apiKey}`;
        setVideoUrl(urlWithKey);
      } else {
        throw new Error("Video URL was not returned.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Video",
        description: "Failed to generate video. Please try again later.",
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
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept to Visualize in Video</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The water cycle, cellular respiration..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || !apiKey} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Video
            </Button>
            {!apiKey && <p className="text-sm text-destructive mt-2">API key is not configured. Video generation is disabled.</p>}
          </form>
        </Form>
      </CardContent>
      {(isLoading || videoUrl) && (
        <CardFooter>
          <div className="w-full">
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="w-full h-[400px] rounded-lg" />
                    <p className="text-center text-muted-foreground">Generating video... this may take a minute or two.</p>
                </div>
            ) : (
              videoUrl && (
                <video controls src={videoUrl} className="w-full rounded-lg" autoPlay>
                  Your browser does not support the video tag.
                </video>
              )
            )}
          </div>
        </CardFooter>
      )}
    </>
  );
}
