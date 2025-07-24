
import { Header } from '@/components/header';
import { ResearchAgent } from '@/components/research-agent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">AI Research Agent</h1>
                <p className="mt-4 text-lg text-muted-foreground">Your intelligent partner for in-depth research and analysis.</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Rss className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Automated Research Assistant</CardTitle>
                        <CardDescription>Provide a topic, and the agent will conduct research, synthesize findings, and generate a structured report.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResearchAgent />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
