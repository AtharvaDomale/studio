"use client";
import { conceptImageGenerator } from "@/ai/flows/concept-image-generator";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  conceptDescription: z.string().min(10, { message: "Concept description must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

type Step = {
  stepDescription: string;
  imageUrl: string;
};

export function ImageGenerator() {
  const [result, setResult] = useState<Step[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { conceptDescription: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await conceptImageGenerator(data);
      setResult(output.steps);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
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
              name="conceptDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concept to Visualize</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The process of mitosis, Newton's third law of motion..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Images
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start space-y-4">
          <h3 className="font-semibold text-lg">Generated Concept Steps:</h3>
          {isLoading ? (
            <Carousel className="w-full">
              <CarouselContent>
                {Array.from({ length: 3 }).map((_, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                        <div className="flex flex-col h-full p-4 border rounded-lg gap-4">
                          <Skeleton className="w-full aspect-video rounded-md" />
                          <Skeleton className="w-4/5 h-6" />
                        </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            result && (
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent>
                  {result.map((step, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1 h-full">
                          <div className="flex flex-col h-full p-4 border rounded-lg bg-muted">
                            <div className="relative w-full aspect-video mb-4">
                                <Image src={step.imageUrl} alt={step.stepDescription} fill objectFit="cover" className="rounded-md bg-white" />
                            </div>
                            <p className="text-sm font-medium text-foreground flex-1">{step.stepDescription}</p>
                          </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )
          )}
        </CardFooter>
      )}
    </>
  );
}
