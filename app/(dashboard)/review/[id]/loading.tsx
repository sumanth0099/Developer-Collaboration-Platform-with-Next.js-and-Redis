export default function ReviewLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div className="h-8 bg-gray-700 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-700 rounded-full w-16" />
          <div className="h-6 bg-gray-700 rounded-full w-20" />
        </div>
        <div className="h-4 bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-700 rounded w-5/6" />
        <div className="h-48 bg-gray-700 rounded-lg" />
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full" />
              <div className="h-4 bg-gray-700 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
