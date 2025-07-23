"use client";
import { conceptVideoGenerator } from "@/ai/flows/concept-video-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
  duration: z.number().min(5).max(8).default(5),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
  image: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function VideoGenerator() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      prompt: "",
      duration: 5,
      aspectRatio: "16:9",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        form.setValue("image", dataUrl);
        setPreviewImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept to Visualize in Video</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The water cycle, cellular respiration..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Optional Starting Image</FormLabel>
                    <FormControl>
                        <div className="flex items-center gap-4">
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <FileImage className="mr-2" /> Upload Image
                            </Button>
                            <Input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageChange} 
                            />
                            {previewImage && <Image src={previewImage} alt="Preview" width={48} height={48} className="rounded-md object-cover" />}
                        </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Duration (seconds): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={5}
                        max={8}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="aspectRatio"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Aspect Ratio</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex items-center space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="16:9" />
                        </FormControl>
                        <FormLabel className="font-normal">16:9 (Widescreen)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="9:16" />
                        </FormControl>
                        <FormLabel className="font-normal">9:16 (Vertical)</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                    <Skeleton className="w-full aspect-video rounded-lg" />
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
