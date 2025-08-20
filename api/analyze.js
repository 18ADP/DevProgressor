// api/analyze.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// This tells Vercel to run this function on its fast "Edge" network.
export const runtime = 'edge';

// This is the main serverless function handler for Vercel production.
export default async function handler(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // Parse JSON body from Request object (Web API)
    const body = await request.json();
    const { prompt } = body;
    
    console.log('Received request body:', { promptLength: prompt?.length || 0 });
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check if API key is available
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

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    // Use streaming for better user experience
    const streamingResponse = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Create a proper streaming response that's compatible with the frontend
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Starting stream processing...");
          
          for await (const chunk of streamingResponse.stream) {
            const text = chunk.text();
            if (text) {
              console.log("Streaming chunk:", text.substring(0, 50) + "...");
              // Send each chunk as Server-Sent Events format
              const data = `data: ${JSON.stringify({ text, type: 'text-delta' })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
          
          // Send completion signal
          console.log("Stream completed, sending DONE signal");
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          // Send error through stream
          const errorData = `data: ${JSON.stringify({ error: error.message, type: 'error' })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
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
    // Return a structured error response
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

// Handle CORS preflight requests
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}