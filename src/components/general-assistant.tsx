
"use client";

import { runAssistant } from "@/ai/flows/general-assistant";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, User, Bot, FileImage, SendHorizonal } from "lucide-react";
import { useState, useRef, FormEvent } from "react";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";

type Message = {
    role: 'user' | 'model';
    content: string;
    image?: string;
};

type HistoryMessage = {
    role: 'user' | 'model';
    content: {
        text?: string;
        media?: { url: string; };
    }[];
};

export function GeneralAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !previewImage) return;

    const userMessage: Message = { role: 'user', content: input, image: previewImage ?? undefined };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");
    setPreviewImage(null);

    // Convert UI messages to the format expected by the AI flow
    const history: HistoryMessage[] = messages.map(m => ({
        role: m.role,
        content: [{ text: m.content }]
    }));
    
    try {
      const output = await runAssistant({
        history,
        query: input,
        image: previewImage ?? undefined,
      });

      const modelMessage: Message = { role: 'model', content: output.response };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "The assistant encountered an error. Please try again.",
        variant: "destructive",
      });
      // Remove the user message that caused the error to allow retry
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
        <CardContent className="h-full flex flex-col p-0">
            <ScrollArea className="flex-1 p-6 space-y-6">
                <div className="space-y-4">
                {messages.length === 0 && !isLoading && (
                    <div className="text-center p-8 text-muted-foreground">
                        <Bot className="mx-auto h-12 w-12 mb-4" />
                        <h2 className="text-xl font-semibold">AI Assistant</h2>
                        <p className="mt-2">Ask me anything about your Firebase project. You can even upload an image!</p>
                        <p className="text-xs mt-4">Examples:</p>
                        <ul className="text-xs list-disc list-inside">
                           <li>How many users are in my project?</li>
                           <li>List the collections in my Firestore database.</li>
                           <li>What is my current project ID?</li>
                        </ul>
                    </div>
                )}
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                        {message.role === 'model' && (
                            <div className="p-2 rounded-full bg-primary text-primary-foreground">
                                <Bot size={20}/>
                            </div>
                        )}
                        <div className={`rounded-lg p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {message.image && <Image src={message.image} alt="User upload" width={200} height={200} className="rounded-md mb-2" />}
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                        </div>
                         {message.role === 'user' && (
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                                <User size={20}/>
                            </div>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-primary text-primary-foreground">
                            <Bot size={20}/>
                        </div>
                        <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center">
                            <Loader2 className="animate-spin" />
                        </div>
                    </div>
                )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                     <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                        <FileImage />
                     </Button>
                     <Input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange} 
                     />
                    <div className="flex-1 relative">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message or upload an image..."
                            disabled={isLoading}
                        />
                        {previewImage && (
                            <div className="absolute right-2 bottom-12 p-1 bg-background border rounded-md">
                                <Image src={previewImage} alt="Preview" width={40} height={40} className="rounded-sm" />
                            </div>
                        )}
                    </div>
                    <Button type="submit" disabled={isLoading || (!input.trim() && !previewImage)} size="icon">
                        <SendHorizonal />
                    </Button>
                </form>
            </div>
        </CardContent>
    </>
  );
}
