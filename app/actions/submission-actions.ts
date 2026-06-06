"use server";

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { FullSubmission } from "@/types";

const VIEW_SYNC_THRESHOLD = 10;
const VIEW_SYNC_INTERVAL_MS = 5 * 60 * 1000;

export async function incrementViewCount(
  submissionId: string
): Promise<{ newCount: number }> {
  const countKey = `viewcount:${submissionId}`;
  const syncKey = `viewcount:${submissionId}:lastSync`;
  const redisCount = await redis.incr(countKey);
  const lastSync = await redis.get<number>(syncKey);
  const now = Date.now();

  if (
    redisCount >= VIEW_SYNC_THRESHOLD ||
    !lastSync ||
    now - Number(lastSync) > VIEW_SYNC_INTERVAL_MS
  ) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { viewCount: { increment: redisCount } },
    });
    await redis.set(countKey, 0);
    await redis.set(syncKey, now);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { viewCount: true },
  });

  return { newCount: (submission?.viewCount ?? 0) + redisCount };
}

export async function getSubmissionWithCache(
  submissionId: string
): Promise<FullSubmission | null> {
  const cacheKey = `cache:submission:${submissionId}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached) {
    return typeof cached === "string" ? JSON.parse(cached) : (cached as unknown as FullSubmission);
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true, reputation: true } },
      reviews: {
        include: { reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
      votes: { select: { id: true, voteType: true, userId: true } },
      tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      snapshots: true,
      _count: { select: { reviews: true, votes: true } },
    },
  });

  if (!submission) return null;

  const serialized: FullSubmission = {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    reviews: submission.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    snapshots: submission.snapshots.map((s) => ({
      ...s,
      uploadedAt: s.uploadedAt.toISOString(),
    })),
  };

  await redis.set(cacheKey, JSON.stringify(serialized), { ex: 120 });
  return serialized;
}
