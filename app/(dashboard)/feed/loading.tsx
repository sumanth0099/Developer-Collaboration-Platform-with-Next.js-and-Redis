export default function FeedLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-700 rounded w-1/4" />
              <div className="h-3 bg-gray-700 rounded w-1/6" />
            </div>
          </div>
          <div className="h-5 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-700 rounded-full w-16" />
            <div className="h-6 bg-gray-700 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
