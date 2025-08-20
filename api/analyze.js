// api/analyze.js - Node.js Runtime Version
import { GoogleGenerativeAI } from '@google/generative-ai';

// Use Node.js runtime instead of Edge
// export const runtime = 'nodejs'; // Uncomment this line if Edge runtime doesn't work

export default async function handler(req, res) {
  console.log('Node.js Handler called:', { method: req.method, hasBody: !!req.body });

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    console.log('Received request:', { 
      hasPrompt: !!prompt, 
      promptLength: prompt?.length || 0 
    });
    
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    // Check if API key is available
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY environment variable is not set");
      return res.status(500).json({ 
        error: "API key not configured. Please set GOOGLE_API_KEY in your Vercel environment variables.",
        details: "This API is designed to run on Vercel with the GOOGLE_API_KEY environment variable set."
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

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      // Use streaming for better user experience
      const streamingResponse = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      console.log("Starting stream processing...");
      let hasContent = false;
      
      for await (const chunk of streamingResponse.stream) {
        const text = chunk.text();
        if (text) {
          hasContent = true;
          console.log("Streaming chunk received, length:", text.length);
          const data = `data: ${JSON.stringify({ text, type: 'text-delta' })}\n\n`;
          res.write(data);
        }
      }
      
      if (!hasContent) {
        console.warn("No content received from AI");
        const errorData = `data: ${JSON.stringify({ error: 'No content generated', type: 'error' })}\n\n`;
        res.write(errorData);
      }
      
      // Send completion signal
      console.log("Stream completed, sending DONE signal");
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (streamError) {
      console.error('Streaming error:', streamError);
      const errorData = `data: ${JSON.stringify({ error: streamError.message, type: 'error' })}\n\n`;
      res.write(errorData);
      res.end();
    }

  } catch (error) {
    console.error("Error in API route:", error);
    console.error("Error stack:", error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: "Failed to generate feedback.", 
        details: error.message,
        hint: "Make sure your Vercel deployment has the GOOGLE_API_KEY environment variable set."
      });
    } else {
      // If headers already sent (streaming started), send error through stream
      const errorData = `data: ${JSON.stringify({ error: error.message, type: 'error' })}\n\n`;
      res.write(errorData);
      res.end();
    }
  }
}