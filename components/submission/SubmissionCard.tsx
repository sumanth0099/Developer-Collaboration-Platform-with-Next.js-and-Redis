import Link from "next/link";
import { SubmissionListItem } from "@/types";
import { ArrowUp, ArrowDown, MessageSquare, Eye, Clock } from "lucide-react";

type Props = {
  submission: SubmissionListItem;
  currentUserId?: string;
  onVote?: (submissionId: string, voteType: string) => void;
};

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-900/50 text-green-400 border-green-700",
  INTERMEDIATE: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
  ADVANCED: "bg-orange-900/50 text-orange-400 border-orange-700",
  EXPERT: "bg-red-900/50 text-red-400 border-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-700 text-gray-300",
  UNDER_REVIEW: "bg-blue-900/50 text-blue-400",
  REVIEWED: "bg-green-900/50 text-green-400",
  CLOSED: "bg-gray-800 text-gray-500",
};

export default function SubmissionCard({ submission, currentUserId, onVote }: Props) {
  const upvotes = submission._count?.votes ?? 0;
  const isOwn = currentUserId === submission.author?.id;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group">
      <div className="flex items-start gap-4">
        {/* Vote buttons */}
        {onVote && !isOwn && (
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => onVote(submission.id, "UPVOTE")}
              className={`p-1.5 rounded-lg transition-colors ${
                submission.userVote === "UPVOTE"
                  ? "text-blue-400 bg-blue-900/30"
                  : "text-gray-500 hover:text-blue-400 hover:bg-blue-900/20"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-400">{upvotes}</span>
            <button
              onClick={() => onVote(submission.id, "DOWNVOTE")}
              className={`p-1.5 rounded-lg transition-colors ${
                submission.userVote === "DOWNVOTE"
                  ? "text-red-400 bg-red-900/30"
                  : "text-gray-500 hover:text-red-400 hover:bg-red-900/20"
              }`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {submission.author?.avatarUrl ? (
              <img src={submission.author.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                {(submission.author?.displayName || "U")[0]}
              </div>
            )}
            <Link href={`/profile/${submission.author?.username}`} className="text-sm text-gray-400 hover:text-blue-400 transition-colors">
              @{submission.author?.username}
            </Link>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(submission.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Title */}
          <Link href={`/review/${submission.id}`}>
            <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors mb-2 truncate">
              {submission.title}
            </h2>
          </Link>

          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">{submission.description}</p>

          {/* Tags & Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-mono">
              {submission.language}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[submission.difficultyTag] || ""}`}>
              {submission.difficultyTag}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[submission.status] || ""}`}>
              {submission.status.replace("_", " ")}
            </span>
            {submission.tags?.map((tag) => (
              <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${tag.color}20`, color: tag.color, border: `1px solid ${tag.color}40` }}>
                {tag.name}
              </span>
            ))}

            <div className="ml-auto flex items-center gap-3 text-gray-500 text-xs">
              <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{submission._count?.reviews}</span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{submission.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
