// src/api/analyzeWithGenkit.js
import { configureGenkit, defineFlow, generate } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { streamVercelResponse } from 'genkit/next';

// This configuration runs ONLY on the server.
// It securely reads the environment variable you set in Vercel.
configureGenkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
  ],
  logSinks: [],
  enableTracingAndMetrics: false,
});

// Define the schema for the data we expect from the frontend.
const analysisInputSchema = z.object({
  resumeText: z.string(),
  targetRole: z.string(),
});

// Define our Genkit Flow for resume analysis.
export const analyzeResume = defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: analysisInputSchema,
    outputSchema: z.string(),
  },
  async ({ resumeText, targetRole }) => {
    const model = 'gemini-1.5-flash';
    const prompt = `You are an expert career coach. Analyze the following resume text for a candidate targeting a "${targetRole}" position. Provide personalized, actionable feedback in Markdown format with two sections: "Resume Improvement Suggestions" and "Skill-Gap Action Plan".`;
    
    const llmResponse = await generate({
      prompt: prompt,
      model: model,
      config: { temperature: 0.5 },
      stream: true, // Enable streaming output
    });

    // Return the response as a stream of text.
    return llmResponse.textStream();
  }
);

// This is the main API handler that Vercel will execute.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resumeText, targetRole } = req.body;
    
    // Run our Genkit flow and stream the response directly back to the client.
    const stream = await analyzeResume({ resumeText, targetRole });
    streamVercelResponse(stream, res);

  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Failed to generate feedback.' });
  }
}