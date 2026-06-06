"use client";
export default function FeedError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-20 space-y-4">
      <h2 className="text-xl font-bold text-red-400">Failed to load feed</h2>
      <p className="text-gray-400">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">Try Again</button>
    </div>
  );
}
