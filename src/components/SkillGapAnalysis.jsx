// src/components/SkillGapAnalysis.jsx
import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import AIFeedback from './AIFeedback';

const TARGET_ROLES = { /* ... same roles as before ... */ };
const escapeRegExp = (string) => { /* ... same as before ... */ };

export default function SkillGapAnalysis({ resumeText }) {
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [feedback, setFeedback] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analysis = useMemo(() => { /* ... analysis logic remains the same ... */ }, [resumeText, selectedRole]);

  const handleGetAIFeedback = async () => {
    setIsAnalyzing(true);
    setFeedback('');
    try {
      // Call our new Vercel API route.
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetRole: selectedRole }),
      });

      if (!response.body) return;

      // Read the streaming response from the server.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        // Append each new chunk of text to our feedback state.
        setFeedback((prev) => prev + chunk);
      }

    } catch (error) {
      console.error("AI analysis error:", error);
      setFeedback("Sorry, an error occurred while generating feedback.");
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-6">
      {/* ... (The top section with the dropdown and skill analysis remains the same) ... */}
      
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Go beyond keywords. Get a personalized analysis of your resume's strengths and weaknesses.</p>
        <button
          onClick={handleGetAIFeedback}
          disabled={isAnalyzing}
          className="w-full sm:w-auto bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isAnalyzing ? '✨ Analyzing with Genkit...' : 'Get Personalized AI Feedback'}
        </button>
      </div>

      <AIFeedback feedback={feedback} isLoading={isAnalyzing} />
    </div>
  );
}