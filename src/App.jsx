// src/App.jsx
import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from "firebase/firestore";

// Components
import JournalView from './components/JournalView';
import Auth from './components/Auth';
import ProfilePage from './components/ProfilePage';
import DarkModeToggle from './components/DarkModeToggle';
import ResumeUploader from './components/ResumeUploader';
import SkillGapAnalysis from './components/SkillGapAnalysis';
import DashboardCharts from './components/DashboardCharts';

function App() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState('journal');
  const [resumeText, setResumeText] = useState('');

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Data fetching logic
  useEffect(() => {
    if (user) {
      getEntries();
    } else {
      setEntries([]);
    }
  }, [user]);

  async function getEntries() {
    if (!user) return;
    const entriesCollectionRef = collection(db, 'entries');
    const q = query(entriesCollectionRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const entriesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    setEntries(entriesData);
  }

  const handleAddEntry = async (newEntryData) => {
    const docRef = await addDoc(collection(db, 'entries'), {
      ...newEntryData,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
    setEntries([{ ...newEntryData, id: docRef.id, createdAt: { toDate: () => new Date() } }, ...entries]);
  };

  const handleDeleteEntry = async (entryId) => {
    const entryDoc = doc(db, 'entries', entryId);
    await deleteDoc(entryDoc);
    setEntries(entries.filter(entry => entry.id !== entryId));
  };

  const handleUpdateEntry = async (entryId, newText) => {
    const entryDoc = doc(db, 'entries', entryId);
    await updateDoc(entryDoc, { text: newText });
    setEntries(
      entries.map(entry =>
        entry.id === entryId ? { ...entry, text: newText } : entry
      )
    );
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <main className="min-h-screen w-full bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        {user && <DarkModeToggle />}
        {user && (
          <nav className="flex gap-4 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <button onClick={() => setPage('journal')} className={`px-3 py-1 text-sm font-semibold rounded-full transition ${page === 'journal' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Journal</button>
            <button onClick={() => setPage('dashboard')} className={`px-3 py-1 text-sm font-semibold rounded-full transition ${page === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Dashboard</button>
            <button onClick={() => setPage('profile')} className={`px-3 py-1 text-sm font-semibold rounded-full transition ${page === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-indigo-600'}`}>Profile</button>
          </nav>
        )}
      </div>

      <div className="w-full max-w-7xl mx-auto pt-16">
        {!user ? (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <Auth />
          </div>
        ) : (
          <>
            {page === 'journal' && (
              <JournalView
                entries={entries}
                onAddEntry={handleAddEntry}
                onDeleteEntry={handleDeleteEntry}
                onUpdateEntry={handleUpdateEntry}
              />
            )}
            {page === 'dashboard' && (
              <div className="space-y-8">
                <ResumeUploader onParseSuccess={setResumeText} />
                {resumeText && <SkillGapAnalysis resumeText={resumeText} />}
                <DashboardCharts entries={entries} />
              </div>
            )}
            {page === 'profile' && (
               <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <ProfilePage user={user} entriesCount={entries.length} onSignOut={handleSignOut} />
               </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default App;