// api/analyze.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIStream, StreamingTextResponse } from 'ai';

// This tells Vercel to run this function on its fast "Edge" network.
export const runtime = 'edge';

// This is the main serverless function handler.
export default async function POST(req) {
  try {
    const { prompt } = await req.json();

    // Securely get the API key from your Vercel project's environment variables.
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const streamingResponse = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const stream = GoogleAIStream(streamingResponse);
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error("Error in API route:", error);
    // Return a structured error response.
    return new Response(JSON.stringify({ error: "Failed to generate feedback." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}