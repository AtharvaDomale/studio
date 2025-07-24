
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/header';
import Link from 'next/link';
import { BrainCircuit, LayoutDashboard, Rss, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TeachAI',
  description: 'AI-powered tools for modern educators',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
            <Sidebar>
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                         <Link href="/" className="flex items-center justify-center" prefetch={false}>
                            <BrainCircuit className="h-6 w-6 text-primary" />
                            <span className="ml-3 text-xl font-bold text-sidebar-foreground">TeachAI</span>
                        </Link>
                    </div>
                    <SidebarContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/">
                                        <LayoutDashboard />
                                        Dashboard
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/agents">
                                        <Rss />
                                        Agents
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                             <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href="/tools">
                                        <Wrench />
                                        Tools
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                </div>
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col min-h-dvh">
                    <Header />
                    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-background">
                        {children}
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
