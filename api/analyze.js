

export const config = {
  runtime: 'nodejs', // ensure Node runtime, not Edge
};

export default async function handler(req, res) {
  console.log('Node.js Handler called:', { method: req.method, hasBody: !!req.body });

  // ----- CORS HANDLING -----
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
      promptLength: prompt?.length || 0,
    });

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // ----- CHECK API KEY -----
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_API_KEY environment variable is not set');
      return res.status(500).json({
        error: 'API key not configured. Please set GOOGLE_API_KEY in your Vercel environment variables.',
        details: 'This API is designed to run on Vercel with the GOOGLE_API_KEY environment variable set.',
      });
    }

    console.log('Starting AI feedback generation...');
    console.log('Prompt snippet:', prompt.substring(0, 100) + '...');

    // ----- STREAMING RESPONSE HEADERS -----
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // ----- DIRECT CALL TO GEMINI v1 API -----
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:streamGenerateContent?alt=sse',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      res.write(`data: ${JSON.stringify({ error: errorText, type: 'error' })}\n\n`);
      return res.end();
    }

    console.log('Gemini API connected, streaming in progress...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let hasContent = false;

    // ----- STREAM DATA TO FRONTEND -----
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      if (chunk.trim() !== '') {
        hasContent = true;
        res.write(chunk); // Forward SSE chunk as-is
      }
    }

    if (!hasContent) {
      console.warn('No content received from AI');
      res.write(`data: ${JSON.stringify({ error: 'No content generated', type: 'error' })}\n\n`);
    }

    console.log('AI streaming completed.');
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in API route:', error);
    console.error('Error stack:', error.stack);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate feedback.',
        details: error.message,
        hint: 'Ensure GOOGLE_API_KEY is set in Vercel and valid for Gemini API v1.',
      });
    } else {
      const errorData = `data: ${JSON.stringify({ error: error.message, type: 'error' })}\n\n`;
      res.write(errorData);
      res.end();
    }
  }
}
