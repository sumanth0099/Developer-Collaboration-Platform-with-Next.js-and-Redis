import { prisma } from "@/lib/prisma";
import { VoteType, Vote } from "@prisma/client";
import { ContributionDay } from "@/types";

export type LeaderboardUser = {
  reputation: number;
  totalReviewsGiven: number;
  totalSubmissions: number;
  netVotesReceived: number;
};

export type VoteAction =
  | { action: "create"; voteType: VoteType }
  | { action: "update"; voteType: VoteType }
  | { action: "delete" };

export function computeLeaderboardScore(user: LeaderboardUser): number {
  const score =
    user.reputation * 1.0 +
    user.totalReviewsGiven * 15 +
    user.totalSubmissions * 10 +
    user.netVotesReceived * 2;
  return Number(score.toFixed(2));
}

export async function getContributionData(
  userId: string
): Promise<ContributionDay[]> {
  const now = new Date();
  const days: ContributionDay[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({ date: dateStr, count: 0 });
  }

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  const [submissions, reviews] = await Promise.all([
    prisma.submission.findMany({
      where: { authorId: userId, createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
    prisma.review.findMany({
      where: { reviewerId: userId, createdAt: { gte: startDate } },
      select: { createdAt: true },
    }),
  ]);

  for (const sub of submissions) {
    const dateStr = sub.createdAt.toISOString().split("T")[0];
    const day = days.find((d) => d.date === dateStr);
    if (day) day.count++;
  }
  for (const rev of reviews) {
    const dateStr = rev.createdAt.toISOString().split("T")[0];
    const day = days.find((d) => d.date === dateStr);
    if (day) day.count++;
  }

  return days;
}

export function validateUploadedFile(file: File): {
  valid: boolean;
  error: string | null;
} {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size exceeds 5MB limit.",
    };
  }
  return { valid: true, error: null };
}

export function resolveVoteAction(
  existingVote: Vote | null,
  incomingVoteType: VoteType
): VoteAction {
  if (!existingVote) {
    return { action: "create", voteType: incomingVoteType };
  }
  if (existingVote.voteType === incomingVoteType) {
    return { action: "delete" };
  }
  return { action: "update", voteType: incomingVoteType };
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}
