// api/analyze.js — Gemini 2.5 Pro (non-streaming, stable)

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GOOGLE_API_KEY in environment variables" });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    const model = "models/gemini-2.5-pro";
    console.log("Using model:", model);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt.trim() }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json({ error: data });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "⚠️ Gemini returned no content.";

    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini route error:", error);
    res.status(500).json({ error: error.message });
  }
}
