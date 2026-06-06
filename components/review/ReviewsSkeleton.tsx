export default function ReviewsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-gray-800 rounded w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full" />
            <div className="space-y-1">
              <div className="h-4 bg-gray-700 rounded w-24" />
              <div className="h-3 bg-gray-700 rounded w-16" />
            </div>
            <div className="ml-auto flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="w-4 h-4 bg-gray-700 rounded" />
              ))}
            </div>
          </div>
          <div className="h-4 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
