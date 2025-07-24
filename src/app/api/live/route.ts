"use client";

import { Mic, MicOff, Loader2, ServerCrash } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenAI, LiveServerMessage, Modality, Session } from "@google/genai";

type SessionStatus = "disconnected" | "connecting" | "connected" | "error";

export function LiveAgent() {
  const [status, setStatus] = useState<SessionStatus>("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [responseText, setResponseText] = useState("");
  const { toast } = useToast();

  const sessionRef = useRef<Session | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    return () => {
      // Cleanup on component unmount
      sessionRef.current?.close();
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
        // The audio from the API is raw PCM, so we need to wrap it in a WAV header
        const wavBuffer = createWavBuffer(audioData);
        const audioBuffer = await audioContextRef.current.decodeAudioData(wavBuffer);
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
        toast({ title: "Audio Error", description: "Failed to play back audio response.", variant: "destructive" });
        isPlayingRef.current = false;
        playNextInQueue();
      }
    } else {
        isPlayingRef.current = false;
    }
  };
  
  const createWavBuffer = (pcmData: ArrayBuffer): ArrayBuffer => {
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmData.byteLength;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint8(0, 'R'.charCodeAt(0));
    view.setUint8(1, 'I'.charCodeAt(0));
    view.setUint8(2, 'F'.charCodeAt(0));
    view.setUint8(3, 'F'.charCodeAt(0));
    view.setUint32(4, 36 + dataSize, true);
    view.setUint8(8, 'W'.charCodeAt(0));
    view.setUint8(9, 'A'.charCodeAt(0));
    view.setUint8(10, 'V'.charCodeAt(0));
    view.setUint8(11, 'E'.charCodeAt(0));

    // fmt sub-chunk
    view.setUint8(12, 'f'.charCodeAt(0));
    view.setUint8(13, 'm'.charCodeAt(0));
    view.setUint8(14, 't'.charCodeAt(0));
    view.setUint8(15, ' '.charCodeAt(0));
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1=PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    view.setUint8(36, 'd'.charCodeAt(0));
    view.setUint8(37, 'a'.charCodeAt(0));
    view.setUint8(38, 't'.charCodeAt(0));
    view.setUint8(39, 'a'.charCodeAt(0));
    view.setUint32(40, dataSize, true);

    // Copy PCM data
    new Uint8Array(buffer, 44).set(new Uint8Array(pcmData));

    return buffer;
}


  const connect = async () => {
    setStatus("connecting");
    try {
        const ai = new GoogleGenAI({
            apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        });
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const newSession = await ai.live.connect({
            model: 'models/gemini-2.0-flash-live-001',
            callbacks: {
                onmessage: (message: LiveServerMessage) => {
                    const part = message.serverContent?.modelTurn?.parts?.[0];
                    if (part?.text) {
                        setResponseText(prev => prev + part.text);
                    }
                    if (part?.inlineData?.data) {
                        const audioData = Buffer.from(part.inlineData.data, 'base64').buffer;
                        audioQueueRef.current.push(audioData);
                        playNextInQueue();
                    }
                    if (message.serverContent?.turnComplete) {
                        if (isRecording) {
                            stopRecording(true); // Stop recording but don't signal end of turn yet
                        }
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Gemini API Error:', e.message);
                    setStatus("error");
                    toast({ title: "Live Agent Error", description: e.message || 'An unknown error occurred with the AI.', variant: "destructive" });
                },
                onclose: (e: CloseEvent) => {
                    setStatus("disconnected");
                    setIsRecording(false);
                },
            },
            config: {
                responseModalities: [Modality.AUDIO, Modality.TEXT],
                speechConfig: {
                    languageCode: 'en-US',
                },
            }
        });

        sessionRef.current = newSession;
        setStatus("connected");
        toast({ title: "Connected", description: "Ready to chat." });
    } catch (error) {
        console.error("Connection failed:", error);
        setStatus("error");
        toast({ title: "Connection Error", description: "Could not connect to the live agent.", variant: "destructive" });
    }
  };

  const startRecording = async () => {
    if (!sessionRef.current) {
      toast({ title: "Not connected", description: "Please connect to the live agent first.", variant: "destructive" });
      return;
    }
    setResponseText(""); // Clear bot response for new turn

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && sessionRef.current) {
            const audioData = await event.data.arrayBuffer();
            const base64Audio = Buffer.from(audioData).toString('base64');
            sessionRef.current.sendClientContent({
                audio: [{ inlineData: { data: base64Audio, mimeType: 'audio/webm' } }]
            }).catch(e => console.error("Error sending audio:", e));
        }
      };
      
      mediaRecorderRef.current.start(500); // Send data every 500ms
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({ title: "Microphone Error", description: "Could not access the microphone.", variant: "destructive" });
    }
  };

  const stopRecording = (isTurnComplete = false) => {
    mediaRecorderRef.current?.stop();
    // Signal end of user audio input if it's not the model signaling turn completion
    if (sessionRef.current && !isTurnComplete) {
        sessionRef.current.sendClientContent({ turns: [] }).catch(e => console.error("Error ending turn:", e));
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (status !== 'connected') {
        connect();
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
      {responseText && (
        <div className="w-full text-left text-sm space-y-2">
            <p><strong className="text-green-600">Bot:</strong> {responseText}</p>
        </div>
      )}
    </div>
  );
}