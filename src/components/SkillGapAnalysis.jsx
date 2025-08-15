// src/components/SkillGapAnalysis.jsx
import { useChat } from '@ai-sdk/react';
import React, { useState, useMemo } from 'react';
import { marked } from 'marked';
import AIFeedback from './AIFeedback';

const TARGET_ROLES = {
  "Full Stack Developer": ['JavaScript', 'React', 'Node.js', 'SQL', 'HTML', 'CSS', 'Git', 'Docker', 'AWS'],
  "Data Analyst": ['Python', 'SQL', 'MySQL', 'Power BI', 'MS Excel', 'Pandas', 'Statistics'],
  "Cloud Specialist": ['AWS', 'Docker', 'Kubernetes', 'Networking', 'Python', 'Git', 'Terraform'],
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function SkillGapAnalysis({ resumeText }) {
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");

  const { messages, append, isLoading, error } = useChat({
    // This now correctly points to the serverless function we created.
    api: '/api/analyze',
  });

  const analysis = useMemo(() => {
    if (!resumeText) return { matched: [], missing: TARGET_ROLES[selectedRole], matchPercentage: 0 };
    const text = resumeText.toLowerCase();
    const coreSkills = TARGET_ROLES[selectedRole];
    const matchedSkills = coreSkills.filter(skill => {
      const regex = new RegExp(`\\b${escapeRegExp(skill.toLowerCase())}\\b`, 'i');
      return regex.test(text);
    });
    const missingSkills = coreSkills.filter(skill => !matchedSkills.includes(skill));
    const matchPercentage = Math.round((matchedSkills.length / coreSkills.length) * 100);
    return { matched: matchedSkills, missing: missingSkills, matchPercentage };
  }, [resumeText, selectedRole]);

  const handleGetAIFeedback = () => {
    const prompt = `You are an expert career coach. Analyze the following resume text for a candidate targeting a "${selectedRole}" position. Provide personalized, actionable feedback in Markdown format...`; // (Full prompt)
    
    // The `append` function from the `useChat` hook handles everything for us.
    append({ role: 'user', content: prompt });
  };
  
  // Get the last message from the assistant to display.
  const aiFeedback = messages.findLast(m => m.role === 'assistant')?.content;

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-6">
      {/* ... (The top section of the component for role selection and skill display remains the same) ... */}
      
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
        <button
          onClick={handleGetAIFeedback}
          disabled={isLoading}
          className="w-full sm:w-auto bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isLoading ? '✨ Analyzing with Gemini...' : 'Get Personalized AI Feedback'}
        </button>
      </div>

      {/* Display any errors from the API call */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error.message}</span>
        </div>
      )}

      {/* Display the streaming AI feedback */}
      {(aiFeedback || isLoading) && (
         <AIFeedback feedback={aiFeedback} isLoading={isLoading} />
      )}
    </div>
  );
}