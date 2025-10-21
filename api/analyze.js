// api/analyze.js — Final working Gemini 2.5 Flash integration (non-streaming)

export const config = {
  runtime: "nodejs", // ensures it runs on Node.js runtime, not Edge
};

export default async function handler(req, res) {
  // ----- CORS -----
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_API_KEY not configured.");
      return res.status(500).json({
        error: "GOOGLE_API_KEY environment variable not set",
        details: "Add GOOGLE_API_KEY in your Vercel project settings.",
      });
    }

    console.log("Starting Gemini 2.5 Flash generation...");

    // ----- Gemini v1beta generateContent endpoint -----
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({ error: data });
    }

    // ----- Extract text from response -----
    const modelOutput =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    console.log("Gemini 2.5 Flash output length:", modelOutput.length);

    // Return JSON result to frontend
    res.status(200).json({ text: modelOutput });
  } catch (error) {
    console.error("Gemini API route error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}
