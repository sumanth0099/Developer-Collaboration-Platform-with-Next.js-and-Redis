import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-gray-700">404</h1>
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-gray-400">The page you are looking for does not exist.</p>
        <Link
          href="/feed"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </div>
  );
}
