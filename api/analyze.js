// api/analyze.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// This tells Vercel to run this function on its fast "Edge" network.
export const runtime = 'edge';

// This is the main serverless function handler for Vercel production.
export default async function POST(req) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check if API key is available (this will work in Vercel)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY environment variable is not set");
      return new Response(JSON.stringify({ 
        error: "API key not configured. Please set GOOGLE_API_KEY in your Vercel environment variables.",
        details: "This API is designed to run on Vercel with the GOOGLE_API_KEY environment variable set."
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log("Starting AI generation for prompt:", prompt.substring(0, 100) + "...");

    // Securely get the API key from your Vercel project's environment variables.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Use streaming for better user experience
    const streamingResponse = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Create a proper streaming response that's compatible with the frontend
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamingResponse.stream) {
            const text = chunk.text();
            if (text) {
              // Send each chunk as it arrives
              const data = `data: ${JSON.stringify({ text, type: 'text-delta' })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error("Error in API route:", error);
    // Return a structured error response.
    return new Response(JSON.stringify({ 
      error: "Failed to generate feedback.", 
      details: error.message,
      hint: "Make sure your Vercel deployment has the GOOGLE_API_KEY environment variable set."
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}