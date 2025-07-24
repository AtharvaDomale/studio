
import { AcademicCoordinatorAgent } from '@/components/research-agent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus, Mail, Rss } from 'lucide-react';
import { GmailAssistant } from '@/components/gmail-assistant';
import { CalendarAssistant } from '@/components/calendar-assistant';
import { ToolCard } from '@/components/tool-card';

const agents = [
    {
        id: 'academic-coordinator',
        icon: Rss,
        title: 'Multi-Agent Academic Research',
        description: 'Provide a topic, and the coordinator will orchestrate sub-agents to analyze it, find recent papers, and suggest future research directions.',
        component: <AcademicCoordinatorAgent />,
    },
    {
        id: 'gmail-assistant',
        icon: Mail,
        title: 'Gmail Assistant (via n8n Webhook)',
        description: 'Use an agent that sends your prompt to an external n8n workflow to interact with your Gmail account.',
        component: <GmailAssistant />,
    },
    {
        id: 'calendar-assistant',
        icon: CalendarPlus,
        title: 'Calendar Assistant (via n8n Webhook)',
        description: 'Provide an event description, and the agent will send it to your n8n webhook to create a calendar event.',
        component: <CalendarAssistant />,
    }
]

export default function AgentsPage() {
  return (
    <div className="flex flex-col min-h-dvh">
      <main className="flex-1">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">AI Agent Hub</h1>
                <p className="mt-4 text-lg text-muted-foreground">Your intelligent partners for complex tasks.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
                <ToolCard
                key={agent.id}
                icon={<agent.icon className="h-8 w-8 text-primary" />}
                title={agent.title}
                description={agent.description}
                >
                {agent.component}
                </ToolCard>
            ))}
            </div>
        </div>
      </main>
    </div>
  );
}
