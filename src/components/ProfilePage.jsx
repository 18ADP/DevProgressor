export default function ProfilePage({ user, entriesCount, onSignOut }) {
  return (
    <div className="bg-white dark:bg-slate-800 text-center p-12 rounded-xl shadow-2xl max-w-lg mx-auto">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Profile</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">You are logged in as:</p>
      <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-8">{user.email}</p>
      
      <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg mb-8">
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">Total Journal Entries</p>
        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{entriesCount}</p>
      </div>

      <button
        onClick={onSignOut}
        className="bg-slate-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:bg-slate-700 transition"
      >
        Sign Out
      </button>
    </div>
  );
}