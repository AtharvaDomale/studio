
import { Header } from '@/components/header';
import { AcademicCoordinatorAgent } from '@/components/research-agent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">AI Academic Coordinator</h1>
                <p className="mt-4 text-lg text-muted-foreground">Your intelligent partner for in-depth academic research and analysis.</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Rss className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Multi-Agent Academic Research</CardTitle>
                        <CardDescription>Provide a topic, and the coordinator will orchestrate sub-agents to analyze it, find recent papers, and suggest future research directions.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <AcademicCoordinatorAgent />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
