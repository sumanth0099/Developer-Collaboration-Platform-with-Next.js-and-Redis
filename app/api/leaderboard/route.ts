export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeLeaderboardScore } from "@/lib/utils";

export async function GET() {
  try {
    const generatedAt = new Date().toISOString();
    const cachedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        reputation: true,
        _count: { select: { reviews: true, submissions: true } },
        submissions: {
          select: {
            votes: { select: { voteType: true } },
          },
        },
      },
    });

    const scoredUsers = users.map((user) => {
      const totalReviewsGiven = user._count.reviews;
      const totalSubmissions = user._count.submissions;
      const allVotes = user.submissions.flatMap((s) => s.votes);
      const upvotes = allVotes.filter((v) => v.voteType === "UPVOTE").length;
      const downvotes = allVotes.filter((v) => v.voteType === "DOWNVOTE").length;
      const netVotesReceived = upvotes - downvotes;

      const score = computeLeaderboardScore({
        reputation: user.reputation,
        totalReviewsGiven,
        totalSubmissions,
        netVotesReceived,
      });

      return {
        user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, reputation: user.reputation },
        score,
        breakdown: {
          reputationPoints: user.reputation,
          reviewBonus: totalReviewsGiven * 15,
          submissionBonus: totalSubmissions * 10,
          voteBonus: netVotesReceived * 2,
        },
      };
    });

    scoredUsers.sort((a, b) => b.score - a.score);
    const top50 = scoredUsers.slice(0, 50).map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({ data: { entries: top50 }, meta: { generatedAt, cachedUntil } });
  } catch (error) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
