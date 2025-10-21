// /pages/api/analyze.js
// Node.js API route using TextCortex for simple AI feedback generation

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Handle CORS (important for frontend fetch)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body;
    const apiKey = process.env.TEXTCORTEX_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing TEXTCORTEX_API_KEY in environment variables.",
      });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Invalid prompt" });
    }

    console.log("Sending request to TextCortex API...");

    const response = await fetch("https://api.textcortex.com/v1/texts/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TextCortex API expects this format
        model: "gpt-3.5-turbo", // free model under TextCortex plan
        // You can adjust “max_tokens” or “temperature” if needed
        max_tokens: 500,
        temperature: 0.7,
        n: 1,
        input_text: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("TextCortex API Error:", data);
      return res.status(response.status).json({
        error: data.error || "TextCortex API call failed",
      });
    }

    // TextCortex returns data.output_texts array
    const text =
      data?.data?.outputs?.[0]?.text ||
      data?.output_text ||
      "⚠️ No feedback generated.";

    res.status(200).json({ text });
  } catch (err) {
    console.error("TextCortex route error:", err);
    res.status(500).json({ error: err.message });
  }
}
