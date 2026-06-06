export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ensureDefaultTags } from "@/lib/tags";
import { getServerSession } from "@/lib/auth";
import { Metadata } from "next";
import { DifficultyTag, SubmissionStatus } from "@prisma/client";
import SubmissionFeed from "@/components/submission/SubmissionFeed";

type SearchParams = {
  page?: string;
  language?: string;
  difficulty?: string;
  status?: string;
  sort?: string;
  tag?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const filters = [];
  if (searchParams.language) filters.push(`Language: ${searchParams.language}`);
  if (searchParams.difficulty) filters.push(`Difficulty: ${searchParams.difficulty}`);
  if (searchParams.status) filters.push(`Status: ${searchParams.status}`);
  const description = filters.length > 0
    ? `Browse code submissions filtered by: ${filters.join(", ")}`
    : "Discover and review code submissions from developers worldwide.";

  return {
    title: "DevPulse - Code Review Feed",
    description,
  };
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const limit = 10;

  const where: any = {};
  if (searchParams.status) where.status = searchParams.status as SubmissionStatus;
  if (searchParams.language) where.language = searchParams.language;
  if (searchParams.difficulty) where.difficultyTag = searchParams.difficulty as DifficultyTag;
  if (searchParams.tag) where.tags = { some: { tag: { name: searchParams.tag } } };

  const [total, initialSubmissions, tags] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
        _count: { select: { reviews: true, votes: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        votes: session?.user
          ? { where: { userId: session.user.id as string }, select: { voteType: true } }
          : false,
      },
    }),
    ensureDefaultTags(),
  ]);

  const serializedSubmissions = initialSubmissions.map((s) => ({
    id: s.id, title: s.title, description: s.description, language: s.language,
    status: s.status, difficultyTag: s.difficultyTag, viewCount: s.viewCount,
    createdAt: s.createdAt.toISOString(), author: s.author, _count: s._count,
    tags: s.tags.map((t) => t.tag),
    userVote: session?.user && s.votes && (s.votes as any[]).length > 0
      ? (s.votes as any[])[0].voteType : null,
  }));

  const filters = {
    language: searchParams.language,
    difficulty: searchParams.difficulty,
    status: searchParams.status,
    sort: searchParams.sort || "newest",
    tag: searchParams.tag,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Code Review Feed
        </h1>
        <p className="text-gray-400 mt-2">Discover and review code from developers worldwide</p>
      </div>
      <SubmissionFeed
        initialData={serializedSubmissions}
        initialTotal={total}
        filters={filters}
        tags={tags}
        currentUserId={session?.user?.id as string}
      />
    </div>
  );
}
