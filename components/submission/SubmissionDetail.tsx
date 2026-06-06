import Link from "next/link";
import { Eye, MessageSquare, Code2, Calendar } from "lucide-react";

type Props = {
  submission: {
    id: string; title: string; description: string; language: string; status: string;
    difficultyTag: string; viewCount: number; createdAt: string; authorId: string;
    codeContent: string;
    author: { id: string; username: string; displayName: string; avatarUrl: string | null; reputation: number };
    tags: Array<{ id: string; name: string; color: string }>;
    snapshots: Array<{ id: string; imageUrl: string; uploadedAt: string }>;
    _count: { reviews: number; votes: number };
  };
  currentUserId?: string;
};

export default function SubmissionDetail({ submission }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{submission.title}</h1>
          <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
            submission.status === "PENDING" ? "bg-gray-700 text-gray-300"
            : submission.status === "UNDER_REVIEW" ? "bg-blue-900/50 text-blue-400"
            : submission.status === "REVIEWED" ? "bg-green-900/50 text-green-400"
            : "bg-gray-800 text-gray-500"
          }`}>
            {submission.status.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Link href={`/profile/${submission.author.username}`} className="flex items-center gap-2 hover:text-blue-400 transition-colors">
            {submission.author.avatarUrl ? (
              <img src={submission.author.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                {submission.author.displayName[0]}
              </div>
            )}
            {submission.author.displayName}
          </Link>
          <span>·</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(submission.createdAt).toLocaleDateString()}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{submission.viewCount} views</span>
          <span>·</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{submission._count.reviews} reviews</span>
        </div>

        <p className="text-gray-300">{submission.description}</p>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-lg bg-gray-800 text-gray-300 font-mono flex items-center gap-1">
            <Code2 className="w-3 h-3" />{submission.language}
          </span>
          <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
            submission.difficultyTag === "BEGINNER" ? "bg-green-900/50 text-green-400"
            : submission.difficultyTag === "INTERMEDIATE" ? "bg-yellow-900/50 text-yellow-400"
            : submission.difficultyTag === "ADVANCED" ? "bg-orange-900/50 text-orange-400"
            : "bg-red-900/50 text-red-400"
          }`}>{submission.difficultyTag}</span>
          {submission.tags.map((tag) => (
            <span key={tag.id} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Code Block */}
      <div className="border-t border-gray-800">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-950">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-gray-500 font-mono">{submission.language}</span>
        </div>
        <pre className="overflow-auto max-h-[500px] p-6 text-sm font-mono text-gray-300 bg-gray-950 leading-relaxed">
          <code>{submission.codeContent}</code>
        </pre>
      </div>
    </div>
  );
}
