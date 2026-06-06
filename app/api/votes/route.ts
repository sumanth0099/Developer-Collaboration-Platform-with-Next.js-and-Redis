export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth";
import { resolveVoteAction } from "@/lib/utils";
import { VoteType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const { submissionId, voteType } = body as { submissionId: string; voteType: VoteType };

    if (!submissionId || !voteType) {
      return NextResponse.json({ error: "submissionId and voteType are required", code: "MISSING_FIELDS" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return NextResponse.json({ error: "Submission not found", code: "NOT_FOUND" }, { status: 404 });
    if (submission.authorId === user.id) {
      return NextResponse.json({ error: "Cannot vote on your own submission", code: "SELF_VOTE_NOT_ALLOWED" }, { status: 403 });
    }

    const existingVote = await prisma.vote.findUnique({ where: { submissionId_userId: { submissionId, userId: user.id } } });
    const voteAction = resolveVoteAction(existingVote, voteType);

    await prisma.$transaction(async (tx) => {
      if (voteAction.action === "create") {
        await tx.vote.create({ data: { submissionId, userId: user.id, voteType: voteAction.voteType } });
        if (voteAction.voteType === "UPVOTE") {
          await tx.user.update({ where: { id: submission.authorId }, data: { reputation: { increment: 2 } } });
        } else {
          const author = await tx.user.findUnique({ where: { id: submission.authorId }, select: { reputation: true } });
          if (author && author.reputation > 0) {
            await tx.user.update({ where: { id: submission.authorId }, data: { reputation: { decrement: 1 } } });
          }
        }
      } else if (voteAction.action === "update") {
        await tx.vote.update({ where: { submissionId_userId: { submissionId, userId: user.id } }, data: { voteType: voteAction.voteType } });
        if (voteAction.voteType === "UPVOTE") {
          await tx.user.update({ where: { id: submission.authorId }, data: { reputation: { increment: 2 } } });
        } else {
          const author = await tx.user.findUnique({ where: { id: submission.authorId }, select: { reputation: true } });
          if (author && author.reputation > 0) {
            await tx.user.update({ where: { id: submission.authorId }, data: { reputation: { decrement: 1 } } });
          }
        }
      } else {
        await tx.vote.delete({ where: { submissionId_userId: { submissionId, userId: user.id } } });
      }
    });

    const [upvoteCount, downvoteCount, userVoteRecord] = await Promise.all([
      prisma.vote.count({ where: { submissionId, voteType: "UPVOTE" } }),
      prisma.vote.count({ where: { submissionId, voteType: "DOWNVOTE" } }),
      prisma.vote.findUnique({ where: { submissionId_userId: { submissionId, userId: user.id } } }),
    ]);

    return NextResponse.json({
      data: {
        submissionId,
        userVote: userVoteRecord?.voteType ?? null,
        upvoteCount,
        downvoteCount,
      },
    });
  } catch (error) {
    console.error("POST /api/votes error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
