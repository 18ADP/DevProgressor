// api/analyze.js — Gemini 2.5 Flash, robust non-streaming version

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
      console.error("GOOGLE_API_KEY missing.");
      return res.status(500).json({ error: "GOOGLE_API_KEY not set in env" });
    }
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is empty or invalid" });
    }

    const cleanedPrompt = prompt.trim().slice(0, 10000); // safety limit
    console.log("→ Gemini 2.5 Flash request length:", cleanedPrompt.length);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: cleanedPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({ error: data });
    }

    // --- Handle response safely ---
    const candidate = data?.candidates?.[0];
    const text =
      candidate?.content?.parts?.map(p => p.text).join("") ||
      candidate?.content?.parts?.map(p => p.content).join("") ||
      null;

    if (!text) {
      console.warn("⚠️ Gemini returned no content:", JSON.stringify(data, null, 2));
      return res.status(200).json({
        text:
          "⚠️ Gemini API returned no response. Verify your API key in AI Studio and ensure the Generative Language API is enabled.",
      });
    }

    console.log("✅ Gemini output length:", text.length);
    res.status(200).json({ text });
  } catch (error) {
    console.error("Gemini API route error:", error);
    res.status(500).json({ error: error.message });
  }
}
