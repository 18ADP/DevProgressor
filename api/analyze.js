// api/analyze.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// This tells Vercel to run this function on its fast "Edge" network.
export const runtime = 'edge';

// This is the main serverless function handler.
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

    // Check if API key is available
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY environment variable is not set");
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Securely get the API key from your Vercel project's environment variables.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    console.log("Starting AI generation for prompt:", prompt.substring(0, 100) + "...");

    // For now, let's use a non-streaming approach to test
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI generation completed successfully");

    return new Response(JSON.stringify({ 
      text,
      role: 'assistant',
      id: Date.now().toString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Error in API route:", error);
    // Return a structured error response.
    return new Response(JSON.stringify({ error: "Failed to generate feedback.", details: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}