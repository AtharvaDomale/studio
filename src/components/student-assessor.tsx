"use client";
import { generateQuiz } from "@/ai/flows/student-quiz-generator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  topic: z.string().min(10, { message: "Topic must be at least 10 characters." }),
  gradeLevel: z.string({ required_error: "Please select a grade level." }),
  numberOfQuestions: z.number().min(1).max(10).default(5),
});

type FormValues = z.infer<typeof formSchema>;

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

interface QuizData {
  questions: QuizQuestion[];
}

export function StudentAssessor() {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: "", numberOfQuestions: 5 },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    setQuiz(null);
    try {
      const output = await generateQuiz(data);
      const parsedQuiz = JSON.parse(output.quiz);
      setQuiz(parsedQuiz);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error Generating Quiz",
        description: "Failed to generate or parse the quiz. The AI might have returned an invalid format. Please try again.",
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
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Topic</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., The Solar System, World War II causes..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gradeLevel"
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
                name="numberOfQuestions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Quiz
            </Button>
          </form>
        </Form>
      </CardContent>

      {quiz?.questions && (
        <CardFooter>
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-4">Generated Quiz</h3>
            <Accordion type="single" collapsible className="w-full">
              {quiz.questions.map((q, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>{`Question ${index + 1}: ${q.question}`}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-4">
                      {q.options.map((option, i) => (
                        <li key={i} className={`p-2 rounded-md flex items-center ${option === q.answer ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700' : 'bg-muted/50'}`}>
                           {option} {option === q.answer && <CheckCircle className="ml-auto h-5 w-5 text-green-600 dark:text-green-400" />}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardFooter>
      )}
    </>
  );
}
