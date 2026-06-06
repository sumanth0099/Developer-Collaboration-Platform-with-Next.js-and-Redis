export default function LeaderboardLoading() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-8 bg-gray-800 rounded w-48" />
      <div className="h-4 bg-gray-800 rounded w-64" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
            <div className="w-10 h-10 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-32" />
              <div className="h-3 bg-gray-700 rounded w-20" />
            </div>
            <div className="h-6 bg-gray-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
