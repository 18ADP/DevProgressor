// src/components/AIFeedback.jsx
import { marked } from 'marked';

export default function AIFeedback({ feedback, isLoading }) {
  // Show a loading skeleton while the AI is thinking.
  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Don't render anything if there is no feedback yet.
  if (!feedback) {
    return null;
  }

  // Safely parse the markdown string from the AI into HTML.
  const rawMarkup = marked(feedback, { breaks: true });

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        ✨ AI-Powered Feedback
      </h3>
      {/* Use Tailwind's 'prose' class for beautiful typography.
        Use `dangerouslySetInnerHTML` to render the HTML from the 'marked' library.
        This is safe here because we are controlling the source of the markdown.
      */}
      <div
      className="prose prose-slate dark:prose-invert max-w-none break-words whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: rawMarkup }}
      />
    </div>
  );
}