// src/components/ResumeUploader.jsx
import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// THE DEFINITIVE FIX: Use the standard `new URL` pattern with `import.meta.url`.
// This is the Vite-recommended way to resolve and load web workers.
// It correctly tells Vite to bundle the worker file and provides a valid URL at runtime.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export default function ResumeUploader({ onParseSuccess }) {
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setFileName(file.name);
    setError('');
    setIsParsing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => 'str' in item ? item.str : '').join(" ") + "\n";
          }
          onParseSuccess(fullText.trim());
        } catch (pdfError) {
          console.error("Error parsing PDF:", pdfError);
          setError("Could not read text from this PDF. It might be an image or corrupted.");
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File reading error:", err);
      setError("Failed to read the file.");
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-4">
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Resume</h3>
      <p className="text-slate-600 dark:text-slate-400">Upload a PDF to analyze its content and visualize your skills.</p>
      <input
        type="file"
        id="resume-upload"
        accept="application/pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-indigo-50 file:text-indigo-700
                   hover:file:bg-indigo-100"
        disabled={isParsing}
      />
      {isParsing && <p className="text-indigo-600">Parsing PDF...</p>}
      {fileName && !isParsing && <p className="text-green-600">Successfully parsed: {fileName}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}