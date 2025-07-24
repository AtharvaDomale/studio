
"use client";

import { Mic, MicOff, Loader2, ServerCrash } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type SessionStatus = "disconnected" | "connecting" | "connected" | "error";

export function LiveAgent() {
  const [status, setStatus] = useState<SessionStatus>("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      socketRef.current?.close();
      mediaRecorderRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const playNextInQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift();

    if (audioData && audioContextRef.current) {
      try {
        const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          isPlayingRef.current = false;
          playNextInQueue();
        };
        source.start();
      } catch (error) {
        console.error("Error playing audio:", error);
        isPlayingRef.current = false;
        playNextInQueue();
      }
    } else {
        isPlayingRef.current = false;
    }
  };


  const connectWebSocket = () => {
    setStatus("connecting");
    const wsUrl = process.env.NEXT_PUBLIC_SITE_URL ? `wss://${new URL(process.env.NEXT_PUBLIC_SITE_URL).host}/api/live` : 'ws://localhost:3000/api/live';

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("connected");
      toast({ title: "Connected", description: "Ready to chat." });
      // Initialize AudioContext after user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new window.AudioContext();
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'userText') {
          setTranscribedText(prev => prev + data.text);
        } else if (data.type === 'botText') {
            setResponseText(prev => prev + data.text);
        } else if (data.type === 'botAudio') {
          const audioData = Buffer.from(data.audio, 'base64').buffer;
          audioQueueRef.current.push(audioData);
          playNextInQueue();
        } else if (data.type === 'turnComplete') {
            setTranscribedText(""); // Clear user text for next turn
        }
      } catch (error) {
          const audioData = event.data as Blob;
          const reader = new FileReader();
          reader.onload = function(e) {
              if (e.target?.result instanceof ArrayBuffer) {
                  audioQueueRef.current.push(e.target.result);
                  playNextInQueue();
              }
          }
          reader.readAsArrayBuffer(audioData);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setStatus("error");
      toast({ title: "Connection Error", description: "Could not connect to the live agent.", variant: "destructive" });
    };

    socket.onclose = () => {
      setStatus("disconnected");
      setIsRecording(false);
      toast({ title: "Disconnected", description: "Live session ended." });
    };
  };

  const startRecording = async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      toast({ title: "Not connected", description: "Please connect to the live agent first.", variant: "destructive" });
      return;
    }
    setResponseText(""); // Clear bot response for new turn
    setTranscribedText(""); // Clear user text

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(event.data);
        }
      };
      mediaRecorderRef.current.start(250); // Send data every 250ms
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Error", description: "Could not access the microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    // Signal end of user audio input
    if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'userTurnEnd' }));
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (status !== 'connected') {
        connectWebSocket();
        return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getStatusInfo = () => {
    switch (status) {
      case "disconnected":
        return { text: "Click to Connect", icon: <Mic className="h-10 w-10" />, color: "text-foreground" };
      case "connecting":
        return { text: "Connecting...", icon: <Loader2 className="h-10 w-10 animate-spin" />, color: "text-blue-500" };
      case "connected":
        return { text: isRecording ? "Listening..." : "Click to Speak", icon: isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />, color: isRecording ? "text-red-500" : "text-green-500" };
      case "error":
        return { text: "Connection Error", icon: <ServerCrash className="h-10 w-10" />, color: "text-destructive" };
    }
  };

  const { text, icon, color } = getStatusInfo();

  return (
    <div className="w-full p-4 border rounded-lg bg-muted flex flex-col items-center justify-center space-y-4 min-h-[250px]">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Live Talking Agent</h3>
        <p className="text-sm text-muted-foreground">Start a real-time conversation with the teaching assistant.</p>
      </div>
      <button
        onClick={handleMicClick}
        disabled={status === 'connecting'}
        className={`flex flex-col items-center justify-center p-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring ${color} disabled:opacity-50`}
      >
        {icon}
        <span className="mt-2 text-sm font-medium">{text}</span>
      </button>
      {(transcribedText || responseText) && (
        <div className="w-full text-left text-sm space-y-2">
            {transcribedText && <p><strong className="text-primary">You:</strong> {transcribedText}</p>}
            {responseText && <p><strong className="text-green-600">Bot:</strong> {responseText}</p>}
        </div>
      )}
    </div>
  );
}
