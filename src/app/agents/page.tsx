
import { Header } from '@/components/header';
import { AcademicCoordinatorAgent } from '@/components/research-agent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus, Mail, Rss } from 'lucide-react';
import { GmailAssistant } from '@/components/gmail-assistant';
import { CalendarAssistant } from '@/components/calendar-assistant';

export default function AgentsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto grid gap-12">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">AI Agent Hub</h1>
                <p className="mt-4 text-lg text-muted-foreground">Your intelligent partners for complex tasks.</p>
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
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Mail className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Gmail Assistant (via n8n MCP)</CardTitle>
                        <CardDescription>Use an agent that connects to an external n8n workflow to interact with your Gmail account.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <GmailAssistant />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <CalendarPlus className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Calendar Assistant (via n8n Webhook)</CardTitle>
                        <CardDescription>Provide an event description, and the agent will send it to your n8n webhook to create a calendar event.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <CalendarAssistant />
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
