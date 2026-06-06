export const dynamic = "force-dynamic";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeLeaderboardScore } from "@/lib/utils";
import { LeaderboardEntry } from "@/types";
import LeaderboardTable from "@/components/ui/LeaderboardTable";

const getCachedLeaderboard = unstable_cache(
  async (): Promise<LeaderboardEntry[]> => {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, displayName: true, avatarUrl: true, reputation: true,
        _count: { select: { reviews: true, submissions: true } },
        submissions: { select: { votes: { select: { voteType: true } } } },
      },
    });

    const scoredUsers = users.map((user) => {
      const totalReviewsGiven = user._count.reviews;
      const totalSubmissions = user._count.submissions;
      const allVotes = user.submissions.flatMap((s) => s.votes);
      const netVotesReceived = allVotes.filter((v) => v.voteType === "UPVOTE").length -
        allVotes.filter((v) => v.voteType === "DOWNVOTE").length;

      const score = computeLeaderboardScore({ reputation: user.reputation, totalReviewsGiven, totalSubmissions, netVotesReceived });
      return {
        user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, reputation: user.reputation },
        score,
        breakdown: { reputationPoints: user.reputation, reviewBonus: totalReviewsGiven * 15, submissionBonus: totalSubmissions * 10, voteBonus: netVotesReceived * 2 },
      };
    });

    scoredUsers.sort((a, b) => b.score - a.score);
    return scoredUsers.slice(0, 50).map((entry, index) => ({ rank: index + 1, ...entry }));
  },
  ["leaderboard"],
  { revalidate: 300, tags: ["leaderboard"] }
);

export default async function LeaderboardPage() {
  const entries = await getCachedLeaderboard();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🏆 Leaderboard
        </h1>
        <p className="text-gray-400 mt-2">Top contributors ranked by reputation, reviews, and votes</p>
      </div>
      <LeaderboardTable entries={entries} />
    </div>
  );
}
