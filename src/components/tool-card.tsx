
"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolCard({ icon, title, description, children }: ToolCardProps) {
  return (
    <Card className="shadow-lg flex flex-col">
      <CardHeader className="flex-row items-center gap-4 space-y-0">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex-grow">
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="tool-content" className="border-b-0">
                <AccordionTrigger className="px-6 pt-0 justify-center text-sm hover:no-underline">
                    Expand Tool
                </AccordionTrigger>
                <AccordionContent>
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
}
