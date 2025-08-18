// src/components/SkillGapAnalysis.jsx
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

  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);

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

  const handleGetAIFeedback = async () => {
    try {
      setIsLoadingAI(true);
      setAiError(null);
      setAiResponse('');
      
      console.log('Starting AI feedback generation...');
      console.log('Resume text length:', resumeText?.length || 0);
      console.log('Selected role:', selectedRole);
      
      const prompt = `You are an expert career coach. Analyze the following resume text for a candidate targeting a "${selectedRole}" position. Provide personalized, actionable feedback in Markdown format with two sections: "Resume Improvement Suggestions" and "Skill-Gap Action Plan".

Resume Text:
${resumeText || 'No resume text provided'}

Target Role: ${selectedRole}
Current Skills Match: ${analysis.matchPercentage}%
Matched Skills: ${analysis.matched.join(', ')}
Missing Skills: ${analysis.missing.join(', ')}

Please provide specific, actionable advice based on this information.`;
      
      console.log('Sending prompt to AI:', prompt.substring(0, 200) + '...');
      
      // Check if we're in development mode and API is not available
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev) {
        // For local development, use a mock response
        console.log('Running locally - using mock response');
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockResponse = `# AI-Powered Resume Analysis for ${selectedRole}

## Resume Improvement Suggestions

Based on your resume analysis, here are specific recommendations to improve your chances for a **${selectedRole}** position:

### Strengths to Highlight
- **Skills Match**: You currently have a ${analysis.matchPercentage}% match with the target role requirements
- **Strong Areas**: ${analysis.matched.length > 0 ? analysis.matched.slice(0, 3).join(', ') : 'Focus on building technical skills'}

### Areas for Improvement
- **Missing Skills**: ${analysis.missing.length > 0 ? analysis.missing.slice(0, 3).join(', ') : 'Core technical skills'}
- **Resume Format**: Ensure your resume clearly showcases your technical abilities
- **Project Examples**: Include specific projects that demonstrate your skills

## Skill-Gap Action Plan

### Immediate Actions (Next 2-4 weeks)
1. **Focus on Missing Skills**: Prioritize learning ${analysis.missing.length > 0 ? analysis.missing[0] : 'JavaScript'} and ${analysis.missing.length > 1 ? analysis.missing[1] : 'React'}
2. **Build Portfolio Projects**: Create 2-3 projects using the skills you're learning
3. **Update Resume**: Incorporate new skills and projects

### Medium-term Goals (1-3 months)
1. **Complete Online Courses**: Focus on ${selectedRole}-specific training
2. **Practice Coding**: Daily practice on platforms like LeetCode or HackerRank
3. **Network**: Connect with professionals in your target role

### Long-term Strategy (3-6 months)
1. **Advanced Skills**: Move beyond basics to intermediate/advanced concepts
2. **Real-world Experience**: Contribute to open source or freelance projects
3. **Certifications**: Consider relevant certifications for your target role

---

*Note: This is a development mock response. In production on Vercel, you'll receive real AI-powered analysis from Google's Gemini AI.*`;

        setAiResponse(mockResponse);
        return;
      }
      
      // For production, call the actual API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Check if response is streaming or JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/plain')) {
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    fullText += parsed.text;
                    setAiResponse(fullText);
                  }
                } catch (e) {
                  console.log('Non-JSON data received:', data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        console.log('AI streaming response completed');
      } else {
        // Handle JSON response (for development mock)
        const data = await response.json();
        console.log('AI JSON response received:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setAiResponse(data.text);
        console.log('AI JSON response completed');
      }
      
    } catch (error) {
      console.error('Error in handleGetAIFeedback:', error);
      setAiError(error.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Target Role Skill Analysis</h3>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="p-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500"
        >
          {Object.keys(TARGET_ROLES).map(role => <option key={role} value={role}>{role}</option>)}
        </select>
      </div>

      {/* --- THIS IS THE SECTION THAT WAS MISSING --- */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-base font-medium text-indigo-700 dark:text-white">Role Match</span>
          <span className="text-sm font-medium text-indigo-700 dark:text-white">{analysis.matchPercentage}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-4 dark:bg-slate-700">
          <div className="bg-indigo-600 h-4 rounded-full transition-all duration-500" style={{ width: `${analysis.matchPercentage}%` }}></div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">Matched Skills ({analysis.matched.length})</h4>
        <div className="flex flex-wrap gap-3">
          {analysis.matched.length > 0 ? (
            analysis.matched.map(skill => (
              <span key={skill} className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-green-900 dark:text-green-200">
                {skill}
              </span>
            ))
          ) : <p className="text-slate-500 text-sm">No matched skills found for this role in the resume.</p>}
        </div>
      </div>
      
      <div>
        <h4 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-3">Missing Skills ({analysis.missing.length})</h4>
        <div className="flex flex-wrap gap-3">
          {analysis.missing.map(skill => (
            <span key={skill} className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full dark:bg-yellow-900 dark:text-yellow-200">
              {skill}
            </span>
          ))}
        </div>
      </div>
      {/* --- END OF MISSING SECTION --- */}

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Go beyond keywords. Get a personalized analysis of your resume's strengths and weaknesses.</p>
        <button
          onClick={handleGetAIFeedback}
          disabled={isLoadingAI}
          className="w-full sm:w-auto bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isLoadingAI ? '✨ Analyzing with Gemini...' : 'Get Personalized AI Feedback'}
        </button>
      </div>

      {aiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{aiError}</span>
        </div>
      )}

      {(aiResponse || isLoadingAI) && (
         <AIFeedback feedback={aiResponse} isLoading={isLoadingAI} />
      )}
    </div>
  );
}