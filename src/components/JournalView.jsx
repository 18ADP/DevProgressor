import { useState } from 'react';

function JournalEntry({ entry, onDeleteEntry, onSetEditingId }) {
  // Helper to format Firebase Timestamps or Date strings
  const formatDate = (date) => {
    const d = date && date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
    
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md transition hover:shadow-lg group">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{formatDate(entry.date || entry.createdAt)}</p>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.text}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button onClick={() => onSetEditingId(entry.id)} className="text-slate-500 hover:text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
          </button>
          <button onClick={() => onDeleteEntry(entry.id)} className="text-slate-500 hover:text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function EditJournalEntry({ entry, onUpdateEntry, onSetEditingId }) {
  const [editText, setEditText] = useState(entry.text);

  const handleSave = () => {
    if (!editText) return;
    onUpdateEntry(entry.id, editText);
    onSetEditingId(null);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border-2 border-indigo-500">
      <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <textarea
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        className="w-full p-2 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 transition dark:bg-slate-700 dark:border-slate-600"
      ></textarea>
      <div className="flex justify-end gap-3 mt-3">
        <button onClick={() => onSetEditingId(null)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold">Cancel</button>
        <button onClick={handleSave} className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition">Save</button>
      </div>
    </div>
  );
}

export default function JournalView({ entries, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text) return;
    onAddEntry({ date, text });
    setText('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-10">
      <h2 className="text-4xl font-bold text-slate-900 dark:text-white text-center">My Dev Journal</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <label htmlFor="date" className="block text-slate-600 dark:text-slate-300 font-semibold mb-2">Date</label>
            <input
              type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="flex-[3]">
            <label htmlFor="entry" className="block text-slate-600 dark:text-slate-300 font-semibold mb-2">Today's Progress</label>
            <textarea
              id="entry" value={text} onChange={(e) => setText(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg h-24 focus:ring-2 focus:ring-indigo-500 transition dark:bg-slate-700 dark:border-slate-600"
              placeholder="What did you learn or build today?"
            ></textarea>
          </div>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transform transition">
          Add Entry
        </button>
      </form>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 border-b-2 border-slate-200 dark:border-slate-700 pb-2">Past Entries</h3>
        {entries.length > 0 ? (
          entries.map(entry => (
            <div key={entry.id}>
              {editingId === entry.id ? (
                <EditJournalEntry entry={entry} onUpdateEntry={onUpdateEntry} onSetEditingId={setEditingId} />
              ) : (
                <JournalEntry entry={entry} onDeleteEntry={onDeleteEntry} onSetEditingId={setEditingId} />
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
            <p className="text-slate-500 dark:text-slate-400">No entries yet. Add one above!</p>
          </div>
        )}
      </div>
    </div>
  );
}