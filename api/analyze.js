// api/analyze.js — Final, working Gemini (v1) API version

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  console.log("Handler called:", { method: req.method, hasBody: !!req.body });

  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY not set");
      return res.status(500).json({
        error: "Missing Gemini API key",
        details: "Set GOOGLE_API_KEY in your Vercel environment variables.",
      });
    }

    console.log("Starting Gemini feedback generation...");

    // --- Streaming headers ---
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // --- Direct fetch to Gemini v1 endpoint ---
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
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

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      res.write(`data: ${JSON.stringify({ error: errorText, type: "error" })}\n\n`);
      return res.end();
    }

    console.log("Streaming Gemini response...");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let hasOutput = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk.trim()) {
        hasOutput = true;
        res.write(chunk); // forward raw SSE chunks directly to frontend
      }
    }

    if (!hasOutput) {
      res.write(`data: ${JSON.stringify({ error: "No content generated", type: "error" })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
    console.log("Gemini streaming complete.");
  } catch (error) {
    console.error("Error in Gemini handler:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal Server Error",
        details: error.message,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, type: "error" })}\n\n`);
      res.end();
    }
  }
}