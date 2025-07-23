"use client";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Film } from "lucide-react";
import { useForm } from "react-hook-form";

export function VideoGenerator() {
  const form = useForm();
  return (
    <>
      <CardContent>
        <div className="space-y-4">
          <Form {...form}>
            <FormItem>
              <FormLabel>Concept to Visualize in Video</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., The water cycle, cellular respiration..." rows={4} disabled />
              </FormControl>
            </FormItem>
            <Button type="submit" disabled className="w-full md:w-auto">
              Generate Video
            </Button>
          </Form>
        </div>
        <div className="mt-8 text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg bg-muted">
            <Film className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">Video Generation Coming Soon!</h3>
            <p className="mt-2 text-sm max-w-md mx-auto">
                This feature is under development. Soon, you'll be able to generate step-by-step videos to explain complex topics.
            </p>
        </div>
      </CardContent>
    </>
  );
}
