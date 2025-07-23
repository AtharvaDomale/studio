
"use client";

import { runAssistant } from "@/ai/flows/general-assistant";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import ReactMarkdown from 'react-markdown';
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  query: z.string().min(10, { message: "Query must be at least 10 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneralAssistant() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: "" },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await runAssistant(data);
      setResult(output.response);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "The assistant encountered an error. Please try again.",
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
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How can I help you?</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Email bob@example.com to schedule a meeting for Friday at 2pm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Ask Assistant
            </Button>
          </form>
        </Form>
      </CardContent>

      {(isLoading || result) && (
        <CardFooter className="flex-col items-start gap-4">
          <h3 className="text-lg font-semibold">Assistant's Response:</h3>
          {isLoading ? (
            <div className="w-full p-4 border rounded-lg bg-muted space-y-3">
              <Skeleton className="w-3/4 h-5" />
              <Skeleton className="w-1/2 h-5" />
            </div>
          ) : (
            result && (
              <div className="w-full prose prose-sm max-w-none dark:prose-invert p-4 border rounded-lg bg-muted">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )
          )}
        </CardFooter>
      )}
    </>
  );
}
