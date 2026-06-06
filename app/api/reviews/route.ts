export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations";
import { pusherServer } from "@/lib/pusher";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten(), code: "VALIDATION_ERROR" }, { status: 422 });
    }

    const { submissionId, content, lineReference, rating } = parsed.data;

    const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) return NextResponse.json({ error: "Submission not found", code: "NOT_FOUND" }, { status: 404 });
    if (submission.authorId === user.id) {
      return NextResponse.json({ error: "Cannot review your own submission", code: "self_review_not_allowed" }, { status: 403 });
    }

    const existingReview = await prisma.review.findFirst({ where: { submissionId, reviewerId: user.id } });
    if (existingReview) {
      return NextResponse.json({ error: "Already reviewed this submission", code: "review_already_exists" }, { status: 409 });
    }

    const createReviewTransaction = async () => {
      return prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: { submissionId, content, lineReference: lineReference ?? null, rating, reviewerId: user!.id },
          include: { reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        });

        if (submission.status === "PENDING") {
          await tx.submission.update({ where: { id: submissionId }, data: { status: "UNDER_REVIEW" } });
        }

        await tx.user.update({ where: { id: user!.id }, data: { reputation: { increment: 10 } } });

        await tx.notification.create({
          data: {
            type: "NEW_REVIEW",
            message: `${user!.displayName} reviewed your submission "${submission.title}"`,
            userId: submission.authorId,
            metadata: { reviewId: review.id, submissionId },
          },
        });

        return review;
      });
    }

    const review = await createReviewTransaction();

    // Emit real-time notification to submission author
    try {
      await pusherServer.trigger(`private-user-${submission.authorId}`, "new-notification", {
        type: "NEW_REVIEW",
        message: `${user.displayName} reviewed your submission "${submission.title}"`,
        submissionId,
        reviewId: review.id,
      });
      await pusherServer.trigger(`submission-${submissionId}`, "new-review", {
        ...review,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      });
    } catch (pusherError) {
      console.error("Pusher error (non-fatal):", pusherError);
    }

    revalidatePath(`/review/${submissionId}`);

    return NextResponse.json({ data: { ...review, createdAt: review.createdAt.toISOString(), updatedAt: review.updatedAt.toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromSession();
    if (!user) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const body = await request.json();
    const { reviewId, isResolved } = body;
    if (!reviewId) return NextResponse.json({ error: "reviewId is required", code: "MISSING_FIELD" }, { status: 400 });

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { submission: true },
    });
    if (!review) return NextResponse.json({ error: "Review not found", code: "NOT_FOUND" }, { status: 404 });
    if (review.submission.authorId !== user.id) {
      return NextResponse.json({ error: "Only the submission author can resolve reviews", code: "FORBIDDEN" }, { status: 403 });
    }

    const updated = await prisma.review.update({ where: { id: reviewId }, data: { isResolved } });

    if (isResolved) {
      await prisma.notification.create({
        data: {
          type: "REVIEW_RESOLVED",
          message: `Your review on "${review.submission.title}" was marked as resolved`,
          userId: review.reviewerId,
          metadata: { reviewId, submissionId: review.submissionId },
        },
      });
      try {
        await pusherServer.trigger(`private-user-${review.reviewerId}`, "new-notification", {
          type: "REVIEW_RESOLVED",
          message: `Your review on "${review.submission.title}" was marked as resolved`,
          reviewId,
          submissionId: review.submissionId,
        });
      } catch (e) { console.error("Pusher error:", e); }
    }

    return NextResponse.json({ data: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() } });
  } catch (error) {
    console.error("PATCH /api/reviews error:", error);
    return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}
