import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { incrementViewCount } from "@/app/actions/submission-actions";
import ReviewsList from "@/components/review/ReviewsList";
import ReviewsSkeleton from "@/components/review/ReviewsSkeleton";
import SubmissionDetail from "@/components/submission/SubmissionDetail";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          reputation: true,
        },
      },
      tags: { include: { tag: true } },
      snapshots: true,
      _count: { select: { reviews: true, votes: true } },
    },
  });

  if (!submission) notFound();

  await incrementViewCount(id);

  const session = await getServerSession();

  const reviewsData = await prisma.review.findMany({
    where: { submissionId: id },
    include: {
      reviewer: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <SubmissionDetail
        submission={{
          ...submission,
          createdAt: submission.createdAt.toISOString(),
          tags: submission.tags.map((t) => t.tag),
          snapshots: submission.snapshots.map((s) => ({
            ...s,
            uploadedAt: s.uploadedAt.toISOString(),
          })),
        }}
        currentUserId={session?.user?.id as string}
      />

      <Suspense fallback={<ReviewsSkeleton />}>
        <ReviewsList
          initialReviews={reviewsData.map((r) => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }))}
          submissionId={id}
          submissionAuthorId={submission.authorId}
          currentUserId={session?.user?.id as string}
        />
      </Suspense>
    </div>
  );
}