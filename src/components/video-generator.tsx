
"use client";
import { conceptVideoGenerator, ConceptVideoGeneratorOutput } from "@/ai/flows/concept-video-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileImage, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
  grade: z.string({ required_error: "Please select a grade level." }),
  subject: z.string().min(2, { message: "Subject must be at least 2 characters." }),
  image: z.string().optional(),
  model: z.string().default('veo-3.0-generate-preview'),
});

type FormValues = z.infer<typeof formSchema>;

export function VideoGenerator() {
  const [result, setResult] = useState<ConceptVideoGeneratorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      prompt: "",
      subject: "",
      model: "veo-3.0-generate-preview",
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
    setResult(null);
    
    try {
      const output = await conceptVideoGenerator(data);
      
      if (output.videoUrl) {
        setResult(output);
      } else {
        throw new Error("The AI failed to generate the video.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Video",
        description: error instanceof Error ? error.message : "An unknown error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const printableContent = result ? `${result.title}\n\n${result.description}` : '';

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
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Biology, History" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={() => (
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

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Video
            </Button>
          </form>
        </Form>
      </CardContent>
      {(isLoading || result) && (
        <CardFooter className="flex-col items-start space-y-4">
            <h3 className="font-semibold text-lg">Generated Video:</h3>
            {isLoading ? (
                 <div className="w-full max-w-lg mx-auto space-y-4">
                    <p className="text-center text-muted-foreground">Generating video... this may take a several minutes.</p>
                    <div className="flex flex-col h-full p-4 border rounded-lg gap-4">
                        <Skeleton className="w-full aspect-video rounded-md" />
                        <Skeleton className="w-3/4 h-7" />
                        <Skeleton className="w-full h-5" />
                    </div>
                </div>
            ) : (
              result && (
                <div className="w-full max-w-lg mx-auto">
                    <div className="flex flex-col h-full p-4 border rounded-lg bg-muted gap-4">
                        <div className="relative w-full aspect-video mb-4 rounded-md overflow-hidden bg-black">
                            <video controls src={result.videoUrl} className="w-full h-full object-contain" autoPlay muted>
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <h4 className="text-lg font-semibold">{result.title}</h4>
                        <p className="text-sm text-foreground flex-1">
                          {result.description}
                        </p>
                    </div>
                    <div className="mt-4 w-full flex justify-center">
                        <OutputActions content={printableContent} title={result.title} />
                    </div>
                </div>
              )
            )}
        </CardFooter>
      )}
    </>
  );
}
