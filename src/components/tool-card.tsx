
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ToolCard({ icon, title, description, children }: ToolCardProps) {
  return (
    <Dialog>
      <Card className="shadow-lg flex flex-col group hover:border-primary transition-all duration-300">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow flex items-end">
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    Launch Tool <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
            </DialogTrigger>
        </CardContent>
      </Card>
      
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 text-primary">{React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8" })}</div>
                <div>
                    <DialogTitle className="text-2xl">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </div>
            </div>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto -mx-6 px-6">
            {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
