export default function LandingPage({ onStart }) {
  return (
    // Card container with shadow and padding
    <div className="bg-white text-center p-12 rounded-xl shadow-2xl max-w-lg mx-auto">
      <h1 className="text-5xl font-bold text-slate-900 mb-3">DevProgressor</h1>
      <p className="text-lg text-slate-600 mb-10">
        Track your development journey, one entry at a time.
      </p>
      <button
        onClick={onStart}
        // Our new, more dynamic button style
        className="bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 transform transition-all duration-300"
      >
        Start My Journal
      </button>
    </div>
  );
}