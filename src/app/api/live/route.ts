
// This is an experimental serverless function that uses WebSockets,
// which may not be supported by all environments.
// We are using a simple in-memory solution for WebSocket management.
// For production, a more robust solution like Redis pub/sub would be needed.

import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// This is a very simple in-memory store for a single WebSocket connection.
// It is NOT suitable for production use with multiple users.
let webSocket: WebSocket | null = null;

// This function is not part of the default export and is used to handle WebSocket connections.
export async function SOCKET(
  req: Request,
  socket: WebSocket,
  head: Buffer
): Promise<void> {
  // Store the single WebSocket connection
  if (webSocket) {
    // If a connection already exists, close it and log a warning.
    console.warn("Closing existing WebSocket connection to accept a new one.");
    webSocket.close(1000, "New connection initiated");
  }
  webSocket = socket;
  console.log("WebSocket connection established.");

  let session: any = null;

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    session = await ai.live.connect({
        model: 'models/gemini-2.0-flash-live-001',
        // This callback handles messages received FROM the Gemini API
        callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (webSocket?.readyState === WebSocket.OPEN) {
                // Forward the message from Gemini to the client
                const part = message.serverContent?.modelTurn?.parts?.[0];
                if (part?.text) {
                    webSocket.send(JSON.stringify({ type: 'botText', text: part.text }));
                }
                if (part?.inlineData?.data) {
                    // In this setup, we will get raw audio data that we need to wrap in a WAV header on the client.
                    // For simplicity, we send it as a base64 string.
                    webSocket.send(JSON.stringify({ type: 'botAudio', audio: part.inlineData.data }));
                }

                if (message.serverContent?.turnComplete) {
                     webSocket.send(JSON.stringify({ type: 'turnComplete' }));
                }
              }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Gemini API Error:', e.message);
                if (webSocket?.readyState === WebSocket.OPEN) {
                    webSocket.send(JSON.stringify({ type: 'error', message: 'Gemini API error.'}));
                }
            },
            onclose: (e: CloseEvent) => {
                console.log('Gemini API session closed:', e.reason);
            },
        },
        config: {
            responseModalities: [Modality.AUDIO, Modality.TEXT],
            speechConfig: {
              languageCode: 'en-US',
            },
        }
    });

    // This callback handles messages received FROM the client browser
    socket.onmessage = async (event) => {
        if (session) {
            // Check for a special message indicating the end of a user's turn
            try {
                const message = JSON.parse(event.data as string);
                if (message.type === 'userTurnEnd') {
                    // Signal to Gemini that the user has finished speaking
                    await session.sendClientContent({ turns: []});
                    return;
                }
            } catch (e) {
                // Not a JSON control message, assume it's audio data
            }

            // Forward audio data from the client to the Gemini API
            const audioData = Buffer.from(event.data as ArrayBuffer).toString('base64');
            await session.sendClientContent({
              audio: [{
                inlineData: {
                  data: audioData,
                  mimeType: 'audio/webm',
                },
              }]
            });
        }
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
        session?.close();
        webSocket = null;
    };

  } catch (error) {
    console.error("Failed to initialize Gemini session:", error);
    socket.close(1011, "Server error");
  }
}

// The standard Next.js API route handlers are not used for WebSockets,
// but they are required by the file-based routing convention.
export async function GET(req: NextRequest) {
  return new NextResponse('This endpoint is for WebSocket connections.', { status: 426 });
}
