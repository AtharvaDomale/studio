
"use client";

import { addStudent, getStudents, Student } from "@/services/student-service-mock";
import { evaluateStudentPerformance } from "@/ai/flows/student-evaluator";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
import { ChartConfig } from "./ui/chart";
import { Badge } from "./ui/badge";


const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  className: z.string().min(1, { message: "Class name is required." }),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<{ evaluationSummary: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", className: "" },
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setIsLoading(true);
    try {
      const studentList = await getStudents();
      setStudents(studentList);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not fetch students.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: FormValues) {
    setIsAdding(true);
    try {
      await addStudent(data.name, data.className);
      toast({ title: "Success", description: "Student added successfully." });
      form.reset();
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to add student.", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  }

  async function handleEvaluate(studentId: string, studentName: string) {
    setIsEvaluating(studentId);
    setEvaluation(null);
    try {
      const result = await evaluateStudentPerformance({ studentId, studentName });
      setEvaluation(result);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to evaluate student performance.", variant: "destructive" });
    } finally {
      setIsEvaluating(null);
    }
  }
  
  const chartData = students.map(s => ({
    name: s.name.split(' ')[0], // Use first name for chart
    averageScore: s.averageScore,
    fill: s.averageScore >= 80 ? 'hsl(var(--chart-2))' : s.averageScore >= 60 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))',
  }));

  const chartConfig = {
    averageScore: {
      label: "Average Score",
    },
  } satisfies ChartConfig;

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  }

  return (
    <div className="space-y-8">

      <Card>
        <CardHeader>
          <CardTitle>Class Performance Overview</CardTitle>
          <CardDescription>Average scores across all completed quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, left: -20, right: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={10} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="averageScore" radius={8}>
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col md:flex-row items-end gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grade 5 Math" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isAdding}>
                {isAdding ? <Loader2 className="mr-2 animate-spin" /> : <UserPlus className="mr-2" />}
                Add Student
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
          <CardDescription>View and evaluate your students.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Quizzes Completed</TableHead>
                  <TableHead className="text-center">Average Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell className="text-center">{student.quizzesCompleted}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={getScoreBadgeVariant(student.averageScore)}>
                            {student.averageScore > 0 ? `${student.averageScore}%` : 'N/A'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog onOpenChange={(open) => !open && setEvaluation(null)}>
                        <DialogTrigger asChild>
                           <Button 
                             variant="outline"
                             size="sm"
                             onClick={() => handleEvaluate(student.id, student.name)}
                             disabled={isEvaluating === student.id}
                           >
                             {isEvaluating === student.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Evaluate
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Evaluation for {student.name}</DialogTitle>
                            <DialogDescription>
                              AI-powered performance analysis and recommendations.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 max-h-[60vh] overflow-y-auto">
                            {isEvaluating === student.id ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="animate-spin text-primary h-8 w-8" />
                                </div>
                            ) : evaluation ? (
                                <div className="prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{evaluation.evaluationSummary}</ReactMarkdown>
                                </div>
                            ) : (
                                <p>No evaluation available. Click evaluate to start.</p>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
