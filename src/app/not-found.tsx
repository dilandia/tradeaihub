import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 bg-zinc-950">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-amber-500/10">
            <FileQuestion className="w-16 h-16 text-amber-500" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-xl font-semibold text-zinc-300 mb-4">
            Page not found
          </h2>
          <p className="text-zinc-400 mb-8">
            The page you are looking for does not exist or has been moved.
          </p>

          <div className="flex gap-3 justify-center flex-col sm:flex-row">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              <Home className="w-4 h-4" /> Dashboard
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition font-medium border border-zinc-700"
            >
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
