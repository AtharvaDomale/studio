
"use client";
import { generateWeeklyPlan } from "@/ai/flows/weekly-teaching-planner";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactMarkdown from 'react-markdown';
import { Skeleton } from "./ui/skeleton";
import { OutputActions } from "./output-actions";

const formSchema = z.object({
  teachingGoals: z.string().min(10, { message: "Teaching goals must be at least 10 characters." }),
  constraints: z.string().min(10, { message: "Constraints must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function WeeklyPlanner() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { teachingGoals: "", constraints: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await generateWeeklyPlan(data);
      setResult(output.weeklyPlan);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate weekly plan. Please try again.",
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
              name="teachingGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teaching Goals for the Week</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Cover chapter 5 of algebra, introduce photosynthesis..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="constraints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Constraints or Special Considerations</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., 45-minute periods, school assembly on Friday, limited access to lab..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Weekly Plan
            </Button>
          </form>
        </Form>
      </CardContent>
      {(isLoading || result) && (
        <CardFooter className="flex-col items-start gap-4">
          {isLoading ? (
              <div className="w-full p-4 border rounded-lg bg-muted space-y-4">
                  <Skeleton className="w-1/3 h-8" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-4/5 h-4" />
                  <Skeleton className="w-full h-4" />
                  <Skeleton className="w-2/3 h-4" />
              </div>
          ) : (
              result && (
                <div className="w-full">
                  <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-li:text-foreground dark:prose-invert p-4 border rounded-lg bg-muted mb-4">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                  <OutputActions content={result} title="Weekly Teaching Plan" />
                </div>
              )
          )}
        </CardFooter>
      )}
    </>
  );
}
