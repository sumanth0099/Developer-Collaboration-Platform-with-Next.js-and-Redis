export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getContributionData } from "@/lib/utils";
import ProfileStats from "@/components/ui/ProfileStats";
import ContributionGraph from "@/components/ui/ContributionGraph";
import SubmissionCard from "@/components/submission/SubmissionCard";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: { displayName: true },
  });
  if (!user) return { title: "User not found - DevPulse" };
  return {
    title: `${user.displayName}'s Profile - DevPulse`,
    description: `View ${user.displayName}'s submissions, reviews, and contributions on DevPulse.`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      submissions: {
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
          _count: { select: { reviews: true, votes: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { reviews: true, submissions: true } },
    },
  });

  if (!user) notFound();

  const [contributionData, totalVotesReceived] = await Promise.all([
    getContributionData(user.id),
    prisma.vote.count({
      where: {
        submission: { authorId: user.id },
        voteType: "UPVOTE",
      },
    }),
  ]);

  const session = await getServerSession();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-6">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} className="w-20 h-20 rounded-full border-2 border-blue-500" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
            {user.displayName[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-gray-400">@{user.username}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-400">
            <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <ProfileStats
        reputation={user.reputation}
        totalSubmissions={user._count.submissions}
        totalReviews={user._count.reviews}
        totalVotes={totalVotesReceived}
      />

      <div>
        <h2 className="text-xl font-semibold mb-4">Activity (Last 30 Days)</h2>
        <ContributionGraph data={contributionData} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>
        <div className="space-y-4">
          {user.submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={{
                ...submission,
                createdAt: submission.createdAt.toISOString(),
                tags: submission.tags.map((t) => t.tag),
                userVote: null,
              }}
              currentUserId={session?.user?.id as string}
            />
          ))}
          {user.submissions.length === 0 && (
            <p className="text-gray-500">No submissions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
