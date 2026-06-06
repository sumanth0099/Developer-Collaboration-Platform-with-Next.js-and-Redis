import { LeaderboardEntry } from "@/types";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

export default function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.user.id} className={`flex items-center gap-4 bg-gray-900 border rounded-xl p-4 transition-all hover:border-gray-700 ${
          entry.rank === 1 ? "border-yellow-700/50 bg-yellow-900/10"
          : entry.rank === 2 ? "border-gray-500/50"
          : entry.rank === 3 ? "border-orange-800/50 bg-orange-900/10"
          : "border-gray-800"
        }`}>
          <div className="w-8 text-center font-bold text-lg">
            {entry.rank === 1 ? <Trophy className="w-6 h-6 text-yellow-400 mx-auto" />
            : entry.rank === 2 ? <Medal className="w-6 h-6 text-gray-300 mx-auto" />
            : entry.rank === 3 ? <Medal className="w-6 h-6 text-orange-500 mx-auto" />
            : <span className="text-gray-500 text-sm">{entry.rank}</span>}
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm overflow-hidden">
            {entry.user.avatarUrl
              ? <img src={entry.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              : entry.user.displayName[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${entry.user.username}`} className="font-semibold text-white hover:text-blue-400 transition-colors block truncate">
              {entry.user.displayName}
            </Link>
            <div className="text-xs text-gray-500 flex gap-3 mt-0.5">
              <span>Rep: {entry.breakdown.reputationPoints}</span>
              <span>Reviews: +{entry.breakdown.reviewBonus}</span>
              <span>Submissions: +{entry.breakdown.submissionBonus}</span>
              <span>Votes: {entry.breakdown.voteBonus >= 0 ? "+" : ""}{entry.breakdown.voteBonus}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {entry.score.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      ))}
      {entries.length === 0 && (
        <div className="text-center py-16 text-gray-500">No data yet. Be the first to contribute!</div>
      )}
    </div>
  );
}
