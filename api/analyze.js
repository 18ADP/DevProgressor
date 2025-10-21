// api/analyze.js — Node.js runtime version using OpenAI API

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  console.log('Handler called:', { method: req.method, hasBody: !!req.body });

  // ----- CORS -----
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

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not set');
      return res.status(500).json({
        error: 'Missing OpenAI API key',
        details: 'Set OPENAI_API_KEY in your Vercel environment variables.',
      });
    }

    console.log('Starting AI feedback generation...');

    // ----- STREAMING RESPONSE HEADERS -----
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // ----- STREAM FROM OPENAI -----
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert career coach. Analyze resumes and provide precise, actionable feedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI API error:', err);
      res.write(`data: ${JSON.stringify({ error: err, type: 'error' })}\n\n`);
      return res.end();
    }

    console.log('Streaming response from OpenAI...');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let hasContent = false;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process chunks line-by-line (Server-Sent Events format)
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            res.end();
            console.log('Stream completed');
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              hasContent = true;
              res.write(`data: ${JSON.stringify({ text: delta, type: 'text-delta' })}\n\n`);
            }
          } catch {
            // ignore keep-alives or malformed lines
          }
        }
      }
    }

    if (!hasContent) {
      console.warn('No content received from OpenAI');
      res.write(`data: ${JSON.stringify({ error: 'No content generated', type: 'error' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in API route:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to generate feedback.',
        details: error.message,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, type: 'error' })}\n\n`);
      res.end();
    }
  }
}