// src/components/SkillGapAnalysis.jsx
import React, { useState, useMemo } from 'react';

// Define our target roles and the essential skills for each.
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
    </div>
  );
}